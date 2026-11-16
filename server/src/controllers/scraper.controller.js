import ScrapeJob from '../models/ScrapeJob.js';
import ScrapeTask from '../models/ScrapeTask.js';
import ScrapeRecipe from '../models/ScrapeRecipe.js';
import Prospect from '../models/Prospect.js';
import {
  scrapeProspectSite,
  analyzeAnyUrl,
  describeWithAI,
  processScrapeJob,
  subscribeJobEvents,
} from '../services/scraper.service.js';

// POST /api/v1/scrape/preview
export const previewSite = async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL or domain is required.' });
    }

    const result = await scrapeProspectSite(url, { maxPagesPerSite: 3, useAI: true });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/scrape/analyze
export const analyzeUrl = async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL is required.' });
    }

    const data = await analyzeAnyUrl(url);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/scrape/describe
export const describeRecipe = async (req, res, next) => {
  try {
    const { url, instruction, columnNames = [] } = req.body;
    if (!url || !instruction) {
      return res.status(400).json({ success: false, message: 'URL and instruction are required.' });
    }

    const result = await describeWithAI({ url, instruction, columnNames });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/scrape/jobs
export const createJob = async (req, res, next) => {
  try {
    const {
      name,
      inputType = 'urls',
      inputs = [],
      prospectIds = [],
      options = {},
      mode,
      instruction,
      recipe,
      pagination,
    } = req.body;

    let targetInputs = [...inputs];

    // If prospectIds provided, populate domain/pageUrl inputs
    if (inputType === 'prospects' && prospectIds.length > 0) {
      const prospects = await Prospect.find({
        _id: { $in: prospectIds },
        workspace: req.workspaceId,
      }).lean();
      targetInputs = prospects.map((p) => p.pageUrl || p.domain).filter(Boolean);
    }

    if (targetInputs.length === 0) {
      return res.status(400).json({ success: false, message: 'No URLs or prospects provided to scrape.' });
    }

    const job = await ScrapeJob.create({
      workspace: req.workspaceId,
      name: name || `Scrape Job - ${new Date().toLocaleDateString()}`,
      inputType,
      inputs: targetInputs,
      prospectIds,
      options,
      mode,
      instruction,
      recipe,
      pagination,
      status: 'queued',
      counts: {
        total: targetInputs.length,
        done: 0,
        ok: 0,
        failed: 0,
        blocked: 0,
      },
      createdBy: req.user?._id,
    });

    // Create tasks for each input
    const taskDocs = targetInputs.map((u) => {
      let domain = '';
      try {
        domain = new URL(u.startsWith('http') ? u : `https://${u}`).hostname.replace(/^www\./, '');
      } catch {
        domain = u;
      }
      return {
        job: job._id,
        workspace: req.workspaceId,
        url: u,
        domain,
        status: 'pending',
      };
    });

    await ScrapeTask.insertMany(taskDocs);

    // Launch background worker without blocking HTTP response
    setImmediate(() => {
      processScrapeJob(job._id).catch(console.error);
    });

    res.status(201).json({ success: true, data: { job } });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/scrape/jobs
export const getJobs = async (req, res, next) => {
  try {
    const jobs = await ScrapeJob.find({ workspace: req.workspaceId })
      .populate('dataset', 'name rowCount')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: { jobs } });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/scrape/jobs/:id
export const getJobById = async (req, res, next) => {
  try {
    const job = await ScrapeJob.findOne({ _id: req.params.id, workspace: req.workspaceId })
      .populate('dataset')
      .lean();

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    const tasks = await ScrapeTask.find({ job: job._id }).sort({ updatedAt: -1 }).limit(100).lean();

    res.json({ success: true, data: { job, tasks } });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/scrape/jobs/:id/events (SSE)
export const getJobEvents = async (req, res, next) => {
  try {
    const job = await ScrapeJob.findOne({ _id: req.params.id, workspace: req.workspaceId });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Send initial status
    res.write(`data: ${JSON.stringify({ jobId: job._id, status: job.status, counts: job.counts })}\n\n`);

    subscribeJobEvents(job._id.toString(), res);
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/scrape/jobs/:id/cancel
export const cancelJob = async (req, res, next) => {
  try {
    const job = await ScrapeJob.findOne({ _id: req.params.id, workspace: req.workspaceId });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    job.status = 'cancelled';
    job.finishedAt = new Date();
    await job.save();

    await ScrapeTask.updateMany({ job: job._id, status: 'pending' }, { $set: { status: 'error', error: 'Job cancelled by user' } });

    res.json({ success: true, data: { job } });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/scrape/jobs/:id/retry-failed
export const retryFailedTasks = async (req, res, next) => {
  try {
    const job = await ScrapeJob.findOne({ _id: req.params.id, workspace: req.workspaceId });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    const failedTasks = await ScrapeTask.find({ job: job._id, status: { $in: ['error', 'timeout'] } });
    if (failedTasks.length === 0) {
      return res.json({ success: true, message: 'No failed tasks to retry.' });
    }

    await ScrapeTask.updateMany(
      { job: job._id, status: { $in: ['error', 'timeout'] } },
      { $set: { status: 'pending', error: '' } }
    );

    job.status = 'queued';
    job.counts.failed = 0;
    job.counts.done = Math.max(0, job.counts.done - failedTasks.length);
    await job.save();

    setImmediate(() => {
      processScrapeJob(job._id).catch(console.error);
    });

    res.json({ success: true, data: { retryingCount: failedTasks.length } });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/scrape/jobs/:id
export const deleteJob = async (req, res, next) => {
  try {
    const job = await ScrapeJob.findOneAndDelete({ _id: req.params.id, workspace: req.workspaceId });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    await ScrapeTask.deleteMany({ job: req.params.id });
    res.json({ success: true, message: 'Job deleted successfully. (Dataset preserved in Data Cleaning)' });
  } catch (err) {
    next(err);
  }
};

// GET /api/v1/scrape/recipes
export const getRecipes = async (req, res, next) => {
  try {
    const recipes = await ScrapeRecipe.find({ workspace: req.workspaceId }).sort({ lastWorkedAt: -1 }).lean();
    res.json({ success: true, data: { recipes } });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/scrape/recipes
export const saveRecipe = async (req, res, next) => {
  try {
    const { name, domain, instruction, recipe } = req.body;
    if (!name || !recipe) {
      return res.status(400).json({ success: false, message: 'Name and recipe object are required.' });
    }

    const saved = await ScrapeRecipe.create({
      workspace: req.workspaceId,
      name,
      domain,
      instruction,
      recipe,
      createdBy: req.user?._id,
    });

    res.status(201).json({ success: true, data: { recipe: saved } });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/scrape/recipes/:id
export const deleteRecipe = async (req, res, next) => {
  try {
    await ScrapeRecipe.findOneAndDelete({ _id: req.params.id, workspace: req.workspaceId });
    res.json({ success: true, message: 'Recipe deleted.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/prospects/scrape (Scrape selected prospects)
export const scrapeSelectedProspects = async (req, res, next) => {
  try {
    const { prospectIds = [] } = req.body;
    if (prospectIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select prospects to scrape.' });
    }

    const prospects = await Prospect.find({
      _id: { $in: prospectIds },
      workspace: req.workspaceId,
    }).lean();

    const inputs = prospects.map((p) => p.pageUrl || p.domain).filter(Boolean);

    const job = await ScrapeJob.create({
      workspace: req.workspaceId,
      name: `Enrich ${prospects.length} Prospects (${new Date().toLocaleDateString()})`,
      inputType: 'prospects',
      inputs,
      prospectIds,
      options: { maxPagesPerSite: 3, useAI: true },
      counts: { total: inputs.length, done: 0, ok: 0, failed: 0, blocked: 0 },
      createdBy: req.user?._id,
    });

    const tasks = inputs.map((u) => {
      let domain = '';
      try {
        domain = new URL(u.startsWith('http') ? u : `https://${u}`).hostname.replace(/^www\./, '');
      } catch {
        domain = u;
      }
      return {
        job: job._id,
        workspace: req.workspaceId,
        url: u,
        domain,
        status: 'pending',
      };
    });

    await ScrapeTask.insertMany(tasks);

    setImmediate(() => {
      processScrapeJob(job._id).catch(console.error);
    });

    res.status(201).json({ success: true, data: { job } });
  } catch (err) {
    next(err);
  }
};
