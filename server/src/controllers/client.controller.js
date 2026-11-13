import Client from '../models/Client.js';
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

    // search by name or domain
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

    const [clients, total] = await Promise.all([
      Client.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Client.countDocuments(filter),
    ]);

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

    res.json({ success: true, data: { client } });
  } catch (err) {
    next(err);
  }
};

// PUT /clients/:id
export const updateClient = async (req, res, next) => {
  try {
    const updates = req.body;

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
    // Block delete if client has campaigns (future-proof guard)
    // We'll import Campaign model lazily when available
    let Campaign;
    try {
      Campaign = (await import('../models/Campaign.js')).default;
      const campaignCount = await Campaign.countDocuments({
        client: req.params.id,
        workspace: req.workspaceId,
      });
      if (campaignCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete client with ${campaignCount} active campaign(s). Archive them first.`,
        });
      }
    } catch (_) {
      // Campaign model not yet created — allow delete
    }

    const client = await Client.findOneAndDelete({
      _id: req.params.id,
      workspace: req.workspaceId,
    });

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found.' });
    }

    res.json({ success: true, message: 'Client deleted.' });
  } catch (err) {
    next(err);
  }
};

