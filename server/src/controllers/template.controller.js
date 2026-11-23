import EmailTemplate from '../models/EmailTemplate.js';
import Prospect from '../models/Prospect.js';
import User from '../models/User.js';

// GET /templates?search=&campaignType=
export const listTemplates = async (req, res, next) => {
  try {
    const { search = '', campaignType, page = 1, limit = 50 } = req.query;
    const workspaceId = req.workspaceId;

    const filter = { workspace: workspaceId };

    if (campaignType && campaignType !== 'all') {
      filter.campaignType = campaignType;
    }

    if (search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { subject: { $regex: search.trim(), $options: 'i' } },
        { body: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [templates, total] = await Promise.all([
      EmailTemplate.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      EmailTemplate.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        templates,
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

// POST /templates
export const createTemplate = async (req, res, next) => {
  try {
    const { name, campaignType, subject, body } = req.body;
    const workspaceId = req.workspaceId;

    const template = await EmailTemplate.create({
      workspace: workspaceId,
      name,
      campaignType: campaignType || 'guest_post',
      subject,
      body,
      stats: { used: 0, replied: 0 },
    });

    res.status(201).json({ success: true, data: { template } });
  } catch (err) {
    next(err);
  }
};

// GET /templates/:id
export const getTemplate = async (req, res, next) => {
  try {
    const template = await EmailTemplate.findOne({
      _id: req.params.id,
      workspace: req.workspaceId,
    }).lean();

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }

    res.json({ success: true, data: { template } });
  } catch (err) {
    next(err);
  }
};

// PUT /templates/:id
export const updateTemplate = async (req, res, next) => {
  try {
    const updates = { ...req.body };

    const template = await EmailTemplate.findOneAndUpdate(
      { _id: req.params.id, workspace: req.workspaceId },
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }

    res.json({ success: true, data: { template } });
  } catch (err) {
    next(err);
  }
};

// DELETE /templates/:id
export const deleteTemplate = async (req, res, next) => {
  try {
    const template = await EmailTemplate.findOneAndDelete({
      _id: req.params.id,
      workspace: req.workspaceId,
    });

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }

    res.json({ success: true, message: 'Template deleted.' });
  } catch (err) {
    next(err);
  }
};

// POST /templates/:id/duplicate
export const duplicateTemplate = async (req, res, next) => {
  try {
    const original = await EmailTemplate.findOne({
      _id: req.params.id,
      workspace: req.workspaceId,
    }).lean();

    if (!original) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }

    const cloned = await EmailTemplate.create({
      workspace: req.workspaceId,
      name: `${original.name} (Copy)`,
      campaignType: original.campaignType,
      subject: original.subject,
      body: original.body,
      stats: { used: 0, replied: 0 },
    });

    res.status(201).json({ success: true, data: { template: cloned } });
  } catch (err) {
    next(err);
  }
};

// POST /templates/:id/preview
export const previewTemplate = async (req, res, next) => {
  try {
    const { prospectId, customVars = {} } = req.body;

    const template = await EmailTemplate.findOne({
      _id: req.params.id,
      workspace: req.workspaceId,
    }).lean();

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found.' });
    }

    let prospect = null;
    if (prospectId) {
      prospect = await Prospect.findOne({
        _id: prospectId,
        workspace: req.workspaceId,
      })
        .populate({
          path: 'campaign',
          select: 'name targetUrls client',
          populate: { path: 'client', select: 'name domain' },
        })
        .lean();
    }

    const user = req.user || (await User.findById(req.user?._id).lean());

    // Build standard variable mapping
    const contactName = prospect?.contactName || customVars.contact_name || '';
    const firstName = contactName ? contactName.trim().split(' ')[0] : (customVars.first_name || '');
    const domain = prospect?.domain || customVars.domain || 'example.com';
    const pageUrl = prospect?.pageUrl || customVars.page_url || `https://${domain}/article`;
    const targetUrl = prospect?.campaign?.targetUrls?.[0] || customVars.target_url || 'https://myclient.com';
    const clientName = prospect?.campaign?.client?.name || customVars.client_name || 'My Client';
    const myName = user?.name || customVars.my_name || 'Your Name';

    const resolvedVars = {
      contact_name: contactName,
      first_name: firstName,
      domain,
      page_url: pageUrl,
      target_url: targetUrl,
      client_name: clientName,
      my_name: myName,
      ...customVars,
    };

    const warnings = [];

    // Check for missing contact name requirement:
    // "A missing contact name shows a warning rather than blank text"
    const hasContactNameVar =
      template.subject.includes('{{contact_name}}') ||
      template.body.includes('{{contact_name}}') ||
      template.subject.includes('{{first_name}}') ||
      template.body.includes('{{first_name}}');

    if (hasContactNameVar && !contactName) {
      warnings.push('Missing contact name: Prospect has no contact name recorded.');
    }

    // Helper to render text with known variables
    const renderWithHighlight = (text) => {
      let result = text;

      // Replace known variables
      for (const [key, val] of Object.entries(resolvedVars)) {
        const pattern = new RegExp(`{{${key}}}`, 'g');
        if (val) {
          result = result.replace(pattern, val);
        } else if (key === 'contact_name' || key === 'first_name') {
          // Acceptance criterion: A missing contact name shows a warning rather than blank text
          result = result.replace(pattern, '[MISSING: Contact Name]');
        } else {
          result = result.replace(pattern, `[MISSING: ${key}]`);
        }
      }

      // Note: Unknown variables are left visible (e.g. {{unknown_tag}})
      return result;
    };

    const renderedSubject = renderWithHighlight(template.subject);
    const renderedBody = renderWithHighlight(template.body);

    // Collect any remaining {{var}} tokens as unrecognised variables
    const remainingInSubject = template.subject.match(/{{([^}]+)}}/g) || [];
    const remainingInBody = template.body.match(/{{([^}]+)}}/g) || [];
    const allTokens = Array.from(new Set([...remainingInSubject, ...remainingInBody]));
    const unknownVariables = allTokens.filter((token) => {
      const cleanKey = token.replace(/[{}]/g, '');
      return !(cleanKey in resolvedVars);
    });

    if (unknownVariables.length > 0) {
      warnings.push(`Unrecognized variable(s) found: ${unknownVariables.join(', ')}`);
    }

    res.json({
      success: true,
      data: {
        template,
        renderedSubject,
        renderedBody,
        resolvedVars,
        warnings,
        unknownVariables,
        hasMissing: warnings.length > 0,
      },
    });
  } catch (err) {
    next(err);
  }
};
