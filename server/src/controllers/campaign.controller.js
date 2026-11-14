import Campaign from '../models/Campaign.js';
import Client from '../models/Client.js';

// GET /campaigns?client=&status=&search=
export const listCampaigns = async (req, res, next) => {
  try {
    const { client, status, search = '', page = 1, limit = 50 } = req.query;
    const workspaceId = req.workspaceId;

    const filter = { workspace: workspaceId };

    if (client) filter.client = client;
    if (status && status !== 'all') filter.status = status;
    if (search.trim()) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [campaigns, total] = await Promise.all([
      Campaign.find(filter)
        .populate('client', 'name domain')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Campaign.countDocuments(filter),
    ]);

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

    res.status(201).json({ success: true, data: { campaign } });
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

// PUT /campaigns/:id
export const updateCampaign = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.endDate) updates.endDate = new Date(updates.endDate);

    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, workspace: req.workspaceId },
      { $set: updates },
      { new: true, runValidators: true }
    )
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
