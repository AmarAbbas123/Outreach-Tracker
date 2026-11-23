import mongoose from 'mongoose';

const linkSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      index: true,
    },
    prospect: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prospect',
    },
    sourceUrl: {
      type: String,
      required: true,
      trim: true,
    },
    targetUrl: {
      type: String,
      trim: true,
      default: '',
    },
    anchorText: {
      type: String,
      trim: true,
      default: '',
    },
    rel: {
      type: String,
      enum: ['dofollow', 'nofollow', 'sponsored', 'ugc'],
      default: 'dofollow',
    },
    cost: {
      type: Number,
      default: 0,
      min: 0,
    },
    liveDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'live', 'lost'],
      default: 'live',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

linkSchema.index({ workspace: 1, campaign: 1 });
linkSchema.index({ workspace: 1, status: 1 });

export default mongoose.model('Link', linkSchema);
