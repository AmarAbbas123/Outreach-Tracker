import Task from '../models/Task.js';
import Prospect from '../models/Prospect.js';

// Helper to calculate Start and End of "Today" based on user's timezone
const getTodayRange = (tz = 'UTC') => {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(now);
    const year = parts.find((p) => p.type === 'year')?.value;
    const month = parts.find((p) => p.type === 'month')?.value;
    const day = parts.find((p) => p.type === 'day')?.value;

    // Build ISO boundaries
    const startOfToday = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), 0, 0, 0, 0));
    const endOfToday = new Date(Date.UTC(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), 23, 59, 59, 999));
    return { startOfToday, endOfToday };
  } catch {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    return { startOfToday, endOfToday };
  }
};

// GET /tasks?filter=today|overdue|upcoming|done
export const listTasks = async (req, res, next) => {
  try {
    const { filter = 'today', page = 1, limit = 50 } = req.query;
    const workspaceId = req.workspaceId;
    const userTimezone = req.user?.timezone || 'UTC';

    const { startOfToday, endOfToday } = getTodayRange(userTimezone);

    const query = { workspace: workspaceId };
    let sort = { dueAt: 1 };

    switch (filter) {
      case 'today':
        query.isDone = false;
        query.dueAt = { $gte: startOfToday, $lte: endOfToday };
        sort = { dueAt: 1 };
        break;

      case 'overdue':
        // Overdue tasks: due before today's start and not done
        // Acceptance criterion: Overdue tasks are highlighted and sorted by oldest first
        query.isDone = false;
        query.dueAt = { $lt: startOfToday };
        sort = { dueAt: 1 }; // Oldest first
        break;

      case 'upcoming':
        query.isDone = false;
        query.dueAt = { $gt: endOfToday };
        sort = { dueAt: 1 };
        break;

      case 'done':
        query.isDone = true;
        sort = { doneAt: -1, updatedAt: -1 };
        break;

      default:
        query.isDone = false;
        break;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate({
          path: 'prospect',
          select: 'domain contactName contactEmail campaign pageUrl status',
          populate: { path: 'campaign', select: 'name' },
        })
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Task.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        tasks,
        filter,
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

// GET /tasks/counts
export const getTaskCounts = async (req, res, next) => {
  try {
    const workspaceId = req.workspaceId;
    const userTimezone = req.user?.timezone || 'UTC';
    const { startOfToday, endOfToday } = getTodayRange(userTimezone);

    const [todayCount, overdueCount, upcomingCount, doneCount] = await Promise.all([
      Task.countDocuments({
        workspace: workspaceId,
        isDone: false,
        dueAt: { $gte: startOfToday, $lte: endOfToday },
      }),
      Task.countDocuments({
        workspace: workspaceId,
        isDone: false,
        dueAt: { $lt: startOfToday },
      }),
      Task.countDocuments({
        workspace: workspaceId,
        isDone: false,
        dueAt: { $gt: endOfToday },
      }),
      Task.countDocuments({
        workspace: workspaceId,
        isDone: true,
      }),
    ]);

    res.json({
      success: true,
      data: {
        today: todayCount,
        overdue: overdueCount,
        upcoming: upcomingCount,
        done: doneCount,
        urgentTotal: overdueCount + todayCount,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /tasks
export const createTask = async (req, res, next) => {
  try {
    const { title, dueAt, prospect, type } = req.body;
    const workspaceId = req.workspaceId;

    let prospectId = undefined;
    if (prospect) {
      const pDoc = await Prospect.findOne({ _id: prospect, workspace: workspaceId });
      if (pDoc) prospectId = pDoc._id;
    }

    const task = await Task.create({
      workspace: workspaceId,
      title,
      dueAt: new Date(dueAt),
      prospect: prospectId,
      type: type || 'manual',
      isDone: false,
    });

    const populated = await Task.findById(task._id)
      .populate('prospect', 'domain contactName contactEmail')
      .lean();

    res.status(201).json({ success: true, data: { task: populated } });
  } catch (err) {
    next(err);
  }
};

// GET /tasks/:id
export const getTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      workspace: req.workspaceId,
    })
      .populate('prospect', 'domain contactName contactEmail campaign')
      .lean();

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    res.json({ success: true, data: { task } });
  } catch (err) {
    next(err);
  }
};

// PUT /tasks/:id
export const updateTask = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (updates.dueAt) updates.dueAt = new Date(updates.dueAt);

    if (updates.isDone !== undefined) {
      updates.doneAt = updates.isDone ? new Date() : null;
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, workspace: req.workspaceId },
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('prospect', 'domain contactName contactEmail')
      .lean();

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    res.json({ success: true, data: { task } });
  } catch (err) {
    next(err);
  }
};

// DELETE /tasks/:id
export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      workspace: req.workspaceId,
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    res.json({ success: true, message: 'Task deleted.' });
  } catch (err) {
    next(err);
  }
};

// PATCH /tasks/:id/complete
export const completeTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      workspace: req.workspaceId,
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    task.isDone = !task.isDone;
    task.doneAt = task.isDone ? new Date() : null;
    await task.save();

    const populated = await Task.findById(task._id)
      .populate('prospect', 'domain contactName contactEmail')
      .lean();

    res.json({
      success: true,
      data: { task: populated },
      message: task.isDone ? 'Task marked as completed.' : 'Task re-opened.',
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /tasks/:id/snooze
export const snoozeTask = async (req, res, next) => {
  try {
    const { days, customDate } = req.body;

    const task = await Task.findOne({
      _id: req.params.id,
      workspace: req.workspaceId,
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    let newDueAt;
    if (customDate) {
      newDueAt = new Date(customDate);
    } else {
      const daysToAdd = parseInt(days, 10) || 1;
      const baseDate = task.dueAt > new Date() ? task.dueAt : new Date();
      newDueAt = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    }

    task.dueAt = newDueAt;
    task.isDone = false;
    task.doneAt = null;
    await task.save();

    const populated = await Task.findById(task._id)
      .populate('prospect', 'domain contactName contactEmail')
      .lean();

    res.json({
      success: true,
      data: { task: populated },
      message: `Task snoozed to ${newDueAt.toLocaleDateString()}.`,
    });
  } catch (err) {
    next(err);
  }
};
