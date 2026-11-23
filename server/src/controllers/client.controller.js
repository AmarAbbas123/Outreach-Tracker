import Client from '../models/Client.js';
import Campaign from '../models/Campaign.js';
import Prospect from '../models/Prospect.js';
import normalizeDomain from '../utils/normalizeDomain.js';

// GET /clients?search=&archived=false&page=1&limit=25
export const listClients = async (req, res, next) => {
  try {
    const { search = '', archived = 'false', page = 1, limit = 25 } = req.query;
    const workspaceId = req.workspaceId;

    const filter = { workspace: workspaceId };

    // archived filter
    if (archived === 'true') {
      filter.isArchived = true;
    } else if (archived === 'false') {
      filter.isArchived = false;
    }
    // archived=all => no isArchived filter

    // search by name or domain or niche
    if (search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { domain: { $regex: search.trim(), $options: 'i' } },
        { niche: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const [rawClients, total] = await Promise.all([
      Client.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Client.countDocuments(filter),
    ]);

    // Enrich clients with campaign counts and prospect / won links stats
    const clientIds = rawClients.map((c) => c._id);
    let clients = rawClients;

    if (clientIds.length > 0) {
      // Find all campaigns for these clients in this workspace
      const campaigns = await Campaign.find(
        { client: { $in: clientIds }, workspace: workspaceId },
        '_id client'
      ).lean();

      const campaignCountMap = new Map();
      const clientToCampaignIds = new Map();
      const allCampaignIds = [];

      campaigns.forEach((camp) => {
        const cId = String(camp.client);
        campaignCountMap.set(cId, (campaignCountMap.get(cId) || 0) + 1);
        if (!clientToCampaignIds.has(cId)) {
          clientToCampaignIds.set(cId, []);
        }
        clientToCampaignIds.get(cId).push(camp._id);
        allCampaignIds.push(camp._id);
      });

      // Aggregate prospects and links won for all relevant campaigns
      const prospectStats = allCampaignIds.length > 0
        ? await Prospect.aggregate([
            {
              $match: {
                campaign: { $in: allCampaignIds },
                workspace: workspaceId,
              },
            },
            {
              $group: {
                _id: {
                  campaign: '$campaign',
                  isWon: { $eq: ['$status', 'link_live'] },
                },
                count: { $sum: 1 },
              },
            },
          ])
        : [];

      // Map campaign -> { prospects, linksWon }
      const campaignStatsMap = new Map();
      prospectStats.forEach((stat) => {
        const campId = String(stat._id.campaign);
        if (!campaignStatsMap.has(campId)) {
          campaignStatsMap.set(campId, { prospects: 0, linksWon: 0 });
        }
        const current = campaignStatsMap.get(campId);
        current.prospects += stat.count;
        if (stat._id.isWon) {
          current.linksWon += stat.count;
        }
      });

      clients = rawClients.map((c) => {
        const cId = String(c._id);
        const campIds = clientToCampaignIds.get(cId) || [];
        let prospectsTotal = 0;
        let linksWon = 0;
        campIds.forEach((campId) => {
          const stats = campaignStatsMap.get(String(campId));
          if (stats) {
            prospectsTotal += stats.prospects;
            linksWon += stats.linksWon;
          }
        });

        return {
          ...c,
          campaignCount: campaignCountMap.get(cId) || 0,
          prospectsTotal,
          linksWon,
        };
      });
    }

    res.json({
      success: true,
      data: {
        clients,
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

// POST /clients
export const createClient = async (req, res, next) => {
  try {
    const { name, domain, niche, notes } = req.body;
    const workspaceId = req.workspaceId;

    const normalizedDomain = domain ? normalizeDomain(domain) : '';

    const client = await Client.create({
      workspace: workspaceId,
      name,
      domain: normalizedDomain,
      niche: niche || '',
      notes: notes || '',
    });

    res.status(201).json({ success: true, data: { client } });
  } catch (err) {
    next(err);
  }
};

// GET /clients/:id
export const getClient = async (req, res, next) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      workspace: req.workspaceId,
    }).lean();

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    // Fetch all campaigns belonging to this client
    const campaigns = await Campaign.find({
      client: req.params.id,
      workspace: req.workspaceId,
    })
      .sort({ createdAt: -1 })
      .lean();

    const campaignIds = campaigns.map((c) => c._id);

    // Aggregate prospects and links won for this client's campaigns
    let prospectsTotal = 0;
    let linksWon = 0;
    const campaignStatsMap = new Map();

    if (campaignIds.length > 0) {
      const stats = await Prospect.aggregate([
        {
          $match: {
            campaign: { $in: campaignIds },
            workspace: req.workspaceId,
          },
        },
        {
          $group: {
            _id: {
              campaign: '$campaign',
              isWon: { $eq: ['$status', 'link_live'] },
            },
            count: { $sum: 1 },
          },
        },
      ]);

      stats.forEach((s) => {
        const campId = String(s._id.campaign);
        if (!campaignStatsMap.has(campId)) {
          campaignStatsMap.set(campId, { prospects: 0, linksWon: 0 });
        }
        const cur = campaignStatsMap.get(campId);
        cur.prospects += s.count;
        prospectsTotal += s.count;
        if (s._id.isWon) {
          cur.linksWon += s.count;
          linksWon += s.count;
        }
      });
    }

    const campaignsWithStats = campaigns.map((c) => {
      const s = campaignStatsMap.get(String(c._id)) || { prospects: 0, linksWon: 0 };
      return {
        ...c,
        prospectsCount: s.prospects,
        linksWon: s.linksWon,
      };
    });

    res.json({
      success: true,
      data: {
        client: {
          ...client,
          campaignCount: campaigns.length,
          prospectsTotal,
          linksWon,
        },
        campaigns: campaignsWithStats,
        totals: {
          campaignsCount: campaigns.length,
          prospectsTotal,
          linksWon,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// PUT /clients/:id
export const updateClient = async (req, res, next) => {
  try {
    const updates = { ...req.body };

    if (updates.domain !== undefined) {
      updates.domain = updates.domain ? normalizeDomain(updates.domain) : '';
    }

    const client = await Client.findOneAndUpdate(
      { _id: req.params.id, workspace: req.workspaceId },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    res.json({ success: true, data: { client } });
  } catch (err) {
    next(err);
  }
};

// DELETE /clients/:id
export const deleteClient = async (req, res, next) => {
  try {
    // Block delete if client has campaigns (Module 2 Rule: "Deleting a client with campaigns is blocked; archive instead")
    const campaignCount = await Campaign.countDocuments({
      client: req.params.id,
      workspace: req.workspaceId,
    });

    if (campaignCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete client with ${campaignCount} associated campaign(s). Please archive the client instead.`,
      });
    }

    const client = await Client.findOneAndDelete({
      _id: req.params.id,
      workspace: req.workspaceId,
    });

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    res.json({ success: true, message: 'Client successfully deleted.' });
  } catch (err) {
    next(err);
  }
};
