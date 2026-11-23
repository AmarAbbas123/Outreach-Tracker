import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    prospect: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prospect',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    dueAt: {
      type: Date,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['follow_up', 'manual'],
      default: 'manual',
    },
    isDone: {
      type: Boolean,
      default: false,
      index: true,
    },
    doneAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

taskSchema.index({ workspace: 1, dueAt: 1, isDone: 1 });
taskSchema.index({ workspace: 1, prospect: 1 });

export default mongoose.model('Task', taskSchema);
