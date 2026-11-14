import mongoose from 'mongoose';

const aiUsageSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    feature: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      default: 'gemini-1.5-flash',
    },
    inputTokens: {
      type: Number,
      default: 0,
    },
    outputTokens: {
      type: Number,
      default: 0,
    },
    costUsd: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

aiUsageSchema.index({ workspace: 1, createdAt: -1 });

export default mongoose.model('AiUsage', aiUsageSchema);
