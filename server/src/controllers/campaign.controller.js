import Campaign from '../models/Campaign.js';
import Client from '../models/Client.js';
import Prospect from '../models/Prospect.js';
import Link from '../models/Link.js';

// GET /campaigns?client=&status=&search=&page=1&limit=50
export const listCampaigns = async (req, res, next) => {
  try {
    const { client, status, search = '', page = 1, limit = 50 } = req.query;
    const workspaceId = req.workspaceId;

    const filter = { workspace: workspaceId };

    if (client && client !== 'all') filter.client = client;
    if (status && status !== 'all') filter.status = status;
    if (search.trim()) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [rawCampaigns, total] = await Promise.all([
      Campaign.find(filter)
        .populate('client', 'name domain')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Campaign.countDocuments(filter),
    ]);

    const campaignIds = rawCampaigns.map((c) => c._id);
    let campaigns = rawCampaigns;

    if (campaignIds.length > 0) {
      // Aggregate prospects for all campaigns in one query
      const [prospectStats, linkStats] = await Promise.all([
        Prospect.aggregate([
          { $match: { campaign: { $in: campaignIds }, workspace: workspaceId } },
          {
            $group: {
              _id: '$campaign',
              totalProspects: { $sum: 1 },
              linksWon: {
                $sum: { $cond: [{ $eq: ['$status', 'link_live'] }, 1, 0] },
              },
              emailsSent: {
                $sum: {
                  $cond: [
                    {
                      $in: [
                        '$status',
                        ['email_sent', 'followup_sent', 'replied', 'negotiating', 'agreed', 'link_live'],
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              replies: {
                $sum: {
                  $cond: [
                    {
                      $in: ['$status', ['replied', 'negotiating', 'agreed', 'link_live']],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ]),
        Link.aggregate([
          { $match: { campaign: { $in: campaignIds }, workspace: workspaceId, status: 'live' } },
          {
            $group: {
              _id: '$campaign',
              totalCost: { $sum: '$cost' },
              totalLiveLinks: { $sum: 1 },
            },
          },
        ]),
      ]);

      const prospectMap = new Map();
      prospectStats.forEach((p) => prospectMap.set(String(p._id), p));

      const linkMap = new Map();
      linkStats.forEach((l) => linkMap.set(String(l._id), l));

      campaigns = rawCampaigns.map((camp) => {
        const pStats = prospectMap.get(String(camp._id)) || {
          totalProspects: 0,
          linksWon: 0,
          emailsSent: 0,
          replies: 0,
        };
        const lStats = linkMap.get(String(camp._id)) || { totalCost: 0, totalLiveLinks: 0 };

        const linksWon = Math.max(pStats.linksWon, lStats.totalLiveLinks);
        const goalLinks = camp.goalLinks || 0;
        const budget = camp.budget || 0;
        const totalSpend = lStats.totalCost || 0;

        return {
          ...camp,
          prospectsCount: pStats.totalProspects,
          linksWon,
          emailsSent: pStats.emailsSent,
          replies: pStats.replies,
          totalSpend,
          linksProgress: goalLinks > 0 ? Math.min(100, Math.round((linksWon / goalLinks) * 100)) : 0,
          budgetProgress: budget > 0 ? Math.min(100, Math.round((totalSpend / budget) * 100)) : 0,
        };
      });
    }

    res.json({
      success: true,
      data: {
        campaigns,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /campaigns
export const createCampaign = async (req, res, next) => {
  try {
    const { client, name, type, targetUrls, goalLinks, budget, startDate, endDate, status } = req.body;
    const workspaceId = req.workspaceId;

    let clientId = client;
    if (!clientId) {
      let defaultClient = await Client.findOne({ workspace: workspaceId });
      if (!defaultClient) {
        defaultClient = await Client.create({
          workspace: workspaceId,
          name: 'Default Client',
          notes: 'Auto-created client for campaigns',
        });
      }
      clientId = defaultClient._id;
    } else {
      // Verify client belongs to workspace
      const clientDoc = await Client.findOne({ _id: clientId, workspace: workspaceId });
      if (!clientDoc) {
        return res.status(400).json({ success: false, message: 'Invalid client.' });
      }
    }

    const campaign = await Campaign.create({
      workspace: workspaceId,
      client: clientId,
      name,
      type: type || 'guest_post',
      targetUrls: targetUrls || [],
      goalLinks: goalLinks || 0,
      budget: budget || 0,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status: status || 'active',
    });

    const populated = await Campaign.findById(campaign._id).populate('client', 'name domain').lean();

    res.status(201).json({ success: true, data: { campaign: populated } });
  } catch (err) {
    next(err);
  }
};

// GET /campaigns/:id
export const getCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      workspace: req.workspaceId,
    })
      .populate('client', 'name domain')
      .lean();

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }

    res.json({ success: true, data: { campaign } });
  } catch (err) {
    next(err);
  }
};

// GET /campaigns/:id/stats
export const getCampaignStats = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      workspace: req.workspaceId,
    })
      .populate('client', 'name domain')
      .lean();

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }

    const [prospectsBreakdown, linksData] = await Promise.all([
      Prospect.aggregate([
        { $match: { campaign: campaign._id, workspace: req.workspaceId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Link.aggregate([
        { $match: { campaign: campaign._id, workspace: req.workspaceId, status: 'live' } },
        {
          $group: {
            _id: null,
            totalCost: { $sum: '$cost' },
            totalLiveLinks: { $sum: 1 },
          },
        },
      ]),
    ]);

    const statusCounts = {
      new: 0,
      contact_found: 0,
      email_sent: 0,
      followup_sent: 0,
      replied: 0,
      negotiating: 0,
      agreed: 0,
      link_live: 0,
      lost: 0,
    };

    let totalProspects = 0;
    prospectsBreakdown.forEach((item) => {
      if (statusCounts[item._id] !== undefined) {
        statusCounts[item._id] = item.count;
      }
      totalProspects += item.count;
    });

    const emailsSent =
      statusCounts.email_sent +
      statusCounts.followup_sent +
      statusCounts.replied +
      statusCounts.negotiating +
      statusCounts.agreed +
      statusCounts.link_live;

    const replies =
      statusCounts.replied +
      statusCounts.negotiating +
      statusCounts.agreed +
      statusCounts.link_live;

    const liveLinksCount = linksData[0]?.totalLiveLinks || statusCounts.link_live || 0;
    const totalSpend = linksData[0]?.totalCost || 0;
    const goalLinks = campaign.goalLinks || 0;
    const budget = campaign.budget || 0;

    const stats = {
      prospectsCount: totalProspects,
      emailsSent,
      replies,
      replyRate: emailsSent > 0 ? Math.round((replies / emailsSent) * 100) : 0,
      linksWon: liveLinksCount,
      goalLinks,
      goalProgress: goalLinks > 0 ? Math.min(100, Math.round((liveLinksCount / goalLinks) * 100)) : 0,
      budget,
      totalSpend,
      budgetProgress: budget > 0 ? Math.min(100, Math.round((totalSpend / budget) * 100)) : 0,
      costPerLink: liveLinksCount > 0 ? Math.round(totalSpend / liveLinksCount) : 0,
      statusBreakdown: statusCounts,
    };

    res.json({
      success: true,
      data: {
        campaign,
        stats,
      },
    });
  } catch (err) {
    next(err);
  }
};

// PUT /campaigns/:id
export const updateCampaign = async (req, res, next) => {
  try {
    const existing = await Campaign.findOne({
      _id: req.params.id,
      workspace: req.workspaceId,
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }

    const updates = { ...req.body };

    // Acceptance criterion: "Completed campaigns are read-only unless re-opened"
    if (existing.status === 'completed' && updates.status === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Completed campaigns are read-only unless re-opened. Re-open campaign to active or draft first.',
      });
    }

    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.endDate) updates.endDate = new Date(updates.endDate);

    // If client is being changed, verify it belongs to workspace
    if (updates.client) {
      const clientDoc = await Client.findOne({ _id: updates.client, workspace: req.workspaceId });
      if (!clientDoc) {
        return res.status(400).json({ success: false, message: 'Invalid client.' });
      }
    }

    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, workspace: req.workspaceId },
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('client', 'name domain')
      .lean();

    res.json({ success: true, data: { campaign } });
  } catch (err) {
    next(err);
  }
};

// DELETE /campaigns/:id
export const deleteCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOneAndDelete({
      _id: req.params.id,
      workspace: req.workspaceId,
    });

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }

    res.json({ success: true, message: 'Campaign deleted.' });
  } catch (err) {
    next(err);
  }
};

// GET /campaigns/:id/links
export const getCampaignLinks = async (req, res, next) => {
  try {
    const links = await Link.find({
      campaign: req.params.id,
      workspace: req.workspaceId,
    })
      .populate('prospect', 'domain contactName contactEmail')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: { links } });
  } catch (err) {
    next(err);
  }
};

// POST /campaigns/:id/links
export const createCampaignLink = async (req, res, next) => {
  try {
    const { sourceUrl, targetUrl, anchorText, rel, cost, liveDate, status, notes, prospect } = req.body;

    if (!sourceUrl) {
      return res.status(400).json({ success: false, message: 'Source URL is required.' });
    }

    const link = await Link.create({
      workspace: req.workspaceId,
      campaign: req.params.id,
      prospect: prospect || undefined,
      sourceUrl,
      targetUrl: targetUrl || '',
      anchorText: anchorText || '',
      rel: rel || 'dofollow',
      cost: cost ? parseFloat(cost) : 0,
      liveDate: liveDate ? new Date(liveDate) : new Date(),
      status: status || 'live',
      notes: notes || '',
    });

    res.status(201).json({ success: true, data: { link } });
  } catch (err) {
    next(err);
  }
};
