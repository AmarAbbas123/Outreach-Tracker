import Papa from 'papaparse';
import Prospect from '../models/Prospect.js';
import Campaign from '../models/Campaign.js';
import Blacklist from '../models/Blacklist.js';
import normalizeDomain from '../utils/normalizeDomain.js';

// GET /prospects?campaign=&status=&tag=&country=&q=&page=1&limit=25
export const listProspects = async (req, res, next) => {
  try {
    const { campaign, status, tag, country, q = '', page = 1, limit = 25 } = req.query;
    const workspaceId = req.workspaceId;

    const filter = { workspace: workspaceId };

    if (campaign && campaign !== 'all') filter.campaign = campaign;
    if (status && status !== 'all') filter.status = status;
    if (country && country !== 'all') filter.country = country;
    if (tag && tag !== 'all') filter.tags = tag;

    if (q.trim()) {
      const searchRegex = { $regex: q.trim(), $options: 'i' };
      filter.$or = [
        { domain: searchRegex },
        { contactName: searchRegex },
        { contactEmail: searchRegex },
        { niche: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const [prospects, total] = await Promise.all([
      Prospect.find(filter)
        .populate('campaign', 'name client')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Prospect.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        prospects,
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

// POST /prospects
export const createProspect = async (req, res, next) => {
  try {
    const {
      campaign,
      domain,
      pageUrl,
      contactName,
      contactEmail,
      niche,
      country,
      dr,
      traffic,
      tags,
      notes,
      status,
    } = req.body;
    const workspaceId = req.workspaceId;

    const normalizedDomain = normalizeDomain(domain);
    if (!normalizedDomain) {
      return res.status(400).json({ success: false, message: 'Invalid domain name.' });
    }

    // Verify campaign exists in workspace
    const campaignDoc = await Campaign.findOne({ _id: campaign, workspace: workspaceId });
    if (!campaignDoc) {
      return res.status(400).json({ success: false, message: 'Campaign not found.' });
    }

    // Check Blacklist
    const blacklisted = await Blacklist.findOne({
      workspace: workspaceId,
      domain: normalizedDomain,
    }).lean();

    if (blacklisted) {
      return res.status(400).json({
        success: false,
        message: `Domain is blacklisted: ${blacklisted.reason || 'Blocked domain'}`,
      });
    }

    // Check duplicate in same campaign
    const existingInCampaign = await Prospect.findOne({
      workspace: workspaceId,
      campaign,
      domain: normalizedDomain,
    }).lean();

    if (existingInCampaign) {
      return res.status(400).json({
        success: false,
        message: 'This domain already exists in this campaign.',
      });
    }

    // Soft check: duplicate across other campaigns of the same client
    let warning = null;
    const otherCampaigns = await Campaign.find({
      workspace: workspaceId,
      client: campaignDoc.client,
      _id: { $ne: campaign },
    }).select('_id name');

    if (otherCampaigns.length > 0) {
      const otherCampaignIds = otherCampaigns.map((c) => c._id);
      const existingInClient = await Prospect.findOne({
        workspace: workspaceId,
        campaign: { $in: otherCampaignIds },
        domain: normalizedDomain,
      })
        .populate('campaign', 'name')
        .lean();

      if (existingInClient) {
        warning = `Note: This domain was previously pitched in campaign "${existingInClient.campaign?.name}".`;
      }
    }

    const prospectStatus = status || 'new';

    const prospect = await Prospect.create({
      workspace: workspaceId,
      campaign,
      domain: normalizedDomain,
      pageUrl: pageUrl || '',
      contactName: contactName || '',
      contactEmail: contactEmail ? contactEmail.toLowerCase().trim() : '',
      niche: niche || '',
      country: country || '',
      metrics: {
        dr: dr || 0,
        traffic: traffic || 0,
      },
      tags: tags || [],
      notes: notes || '',
      status: prospectStatus,
      statusHistory: [
        {
          status: prospectStatus,
          changedAt: new Date(),
          changedBy: req.user?._id,
        },
      ],
    });

    res.status(201).json({
      success: true,
      data: { prospect, warning },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This domain already exists in this campaign.',
      });
    }
    next(err);
  }
};

// GET /prospects/:id
export const getProspect = async (req, res, next) => {
  try {
    const prospect = await Prospect.findOne({
      _id: req.params.id,
      workspace: req.workspaceId,
    })
      .populate('campaign', 'name client')
      .populate('statusHistory.changedBy', 'name email')
      .lean();

    if (!prospect) {
      return res.status(404).json({ success: false, message: 'Prospect not found.' });
    }

    res.json({ success: true, data: { prospect } });
  } catch (err) {
    next(err);
  }
};

// PUT /prospects/:id
export const updateProspect = async (req, res, next) => {
  try {
    const updates = { ...req.body };

    if (updates.domain) {
      const normalizedDomain = normalizeDomain(updates.domain);
      if (!normalizedDomain) {
        return res.status(400).json({ success: false, message: 'Invalid domain name.' });
      }

      // Check blacklist
      const blacklisted = await Blacklist.findOne({
        workspace: req.workspaceId,
        domain: normalizedDomain,
      }).lean();

      if (blacklisted) {
        return res.status(400).json({
          success: false,
          message: `Domain is blacklisted: ${blacklisted.reason || 'Blocked domain'}`,
        });
      }

      updates.domain = normalizedDomain;
    }

    if (updates.dr !== undefined || updates.traffic !== undefined) {
      updates.metrics = {
        dr: updates.dr ?? 0,
        traffic: updates.traffic ?? 0,
      };
      delete updates.dr;
      delete updates.traffic;
    }

    const prospect = await Prospect.findOneAndUpdate(
      { _id: req.params.id, workspace: req.workspaceId },
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('campaign', 'name client')
      .lean();

    if (!prospect) {
      return res.status(404).json({ success: false, message: 'Prospect not found.' });
    }

    res.json({ success: true, data: { prospect } });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This domain already exists in this campaign.',
      });
    }
    next(err);
  }
};

// PATCH /prospects/:id/status
export const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const workspaceId = req.workspaceId;

    const prospect = await Prospect.findOneAndUpdate(
      { _id: req.params.id, workspace: workspaceId },
      {
        $set: { status },
        $push: {
          statusHistory: {
            status,
            changedAt: new Date(),
            changedBy: req.user?._id,
          },
        },
      },
      { new: true }
    )
      .populate('campaign', 'name client')
      .lean();

    if (!prospect) {
      return res.status(404).json({ success: false, message: 'Prospect not found.' });
    }

    res.json({ success: true, data: { prospect } });
  } catch (err) {
    next(err);
  }
};

// DELETE /prospects/:id
export const deleteProspect = async (req, res, next) => {
  try {
    const prospect = await Prospect.findOneAndDelete({
      _id: req.params.id,
      workspace: req.workspaceId,
    });

    if (!prospect) {
      return res.status(404).json({ success: false, message: 'Prospect not found.' });
    }

    res.json({ success: true, message: 'Prospect deleted.' });
  } catch (err) {
    next(err);
  }
};

// POST /prospects/bulk
export const bulkAction = async (req, res, next) => {
  try {
    const { action, ids, status, tag } = req.body;
    const workspaceId = req.workspaceId;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No prospects selected.' });
    }

    const filter = { _id: { $in: ids }, workspace: workspaceId };

    if (action === 'delete') {
      const result = await Prospect.deleteMany(filter);
      return res.json({
        success: true,
        message: `Deleted ${result.deletedCount} prospect(s).`,
      });
    }

    if (action === 'status') {
      if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required for bulk status update.' });
      }

      await Prospect.updateMany(filter, {
        $set: { status },
        $push: {
          statusHistory: {
            status,
            changedAt: new Date(),
            changedBy: req.user?._id,
          },
        },
      });

      return res.json({
        success: true,
        message: `Updated status for ${ids.length} prospect(s).`,
      });
    }

    if (action === 'tag') {
      if (!tag || !tag.trim()) {
        return res.status(400).json({ success: false, message: 'Tag name is required.' });
      }

      await Prospect.updateMany(filter, {
        $addToSet: { tags: tag.trim() },
      });

      return res.json({
        success: true,
        message: `Added tag to ${ids.length} prospect(s).`,
      });
    }

    res.status(400).json({ success: false, message: 'Unknown bulk action.' });
  } catch (err) {
    next(err);
  }
};

// POST /prospects/import (CSV Upload)
export const importCSV = async (req, res, next) => {
  try {
    const { campaign } = req.body;
    const workspaceId = req.workspaceId;

    if (!campaign) {
      return res.status(400).json({ success: false, message: 'Campaign is required for import.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a CSV file.' });
    }

    // Verify campaign belongs to workspace
    const campaignDoc = await Campaign.findOne({ _id: campaign, workspace: workspaceId });
    if (!campaignDoc) {
      return res.status(400).json({ success: false, message: 'Invalid campaign selected.' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const parsed = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.trim().toLowerCase().replace(/[\s-]+/g, '_'),
    });

    if (parsed.errors && parsed.errors.length > 0 && parsed.data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Could not parse CSV file.',
        errors: parsed.errors,
      });
    }

    const rows = parsed.data.slice(0, 5000); // Max 5000 rows as per spec

    // Fetch existing blacklist for workspace
    const blacklists = await Blacklist.find({ workspace: workspaceId }).select('domain').lean();
    const blacklistSet = new Set(blacklists.map((b) => b.domain.toLowerCase()));

    // Fetch existing domains in this campaign
    const existingProspects = await Prospect.find({
      workspace: workspaceId,
      campaign,
    }).select('domain').lean();
    const existingDomains = new Set(existingProspects.map((p) => p.domain.toLowerCase()));

    const toInsert = [];
    const batchDomains = new Set();
    let duplicatesSkipped = 0;
    let blacklistedSkipped = 0;
    const invalidRows = [];

    rows.forEach((row, index) => {
      const rowNum = index + 2; // header is row 1
      const rawDomain = row.domain || row.website || row.url || '';
      const normalized = normalizeDomain(rawDomain);

      if (!normalized) {
        invalidRows.push({ row: rowNum, reason: 'Missing or invalid domain.' });
        return;
      }

      if (blacklistSet.has(normalized)) {
        blacklistedSkipped++;
        return;
      }

      if (existingDomains.has(normalized) || batchDomains.has(normalized)) {
        duplicatesSkipped++;
        return;
      }

      batchDomains.add(normalized);

      // parse tags
      let tags = [];
      if (row.tags) {
        tags = String(row.tags)
          .split(/[,;|]/)
          .map((t) => t.trim())
          .filter(Boolean);
      }

      toInsert.push({
        workspace: workspaceId,
        campaign,
        domain: normalized,
        pageUrl: row.page_url || row.pageurl || row.url || '',
        contactName: row.contact_name || row.name || row.contact || '',
        contactEmail: (row.contact_email || row.email || '').toLowerCase().trim(),
        niche: row.niche || row.category || '',
        country: row.country || '',
        metrics: {
          dr: Math.min(100, Math.max(0, parseInt(row.dr || row.domain_rating, 10) || 0)),
          traffic: Math.max(0, parseInt(row.traffic || row.monthly_traffic, 10) || 0),
        },
        tags,
        notes: row.notes || '',
        status: 'new',
        statusHistory: [
          {
            status: 'new',
            changedAt: new Date(),
            changedBy: req.user?._id,
          },
        ],
      });
    });

    let importedCount = 0;
    if (toInsert.length > 0) {
      const inserted = await Prospect.insertMany(toInsert, { ordered: false });
      importedCount = inserted.length;
    }

    res.json({
      success: true,
      data: {
        summary: {
          imported: importedCount,
          duplicatesSkipped,
          blacklistedSkipped,
          invalidRowsCount: invalidRows.length,
          invalidRows: invalidRows.slice(0, 20), // preview top 20
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

