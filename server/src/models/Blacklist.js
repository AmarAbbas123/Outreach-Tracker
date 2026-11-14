import mongoose from 'mongoose';

const blacklistSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    domain: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

blacklistSchema.index({ workspace: 1, domain: 1 }, { unique: true });

export default mongoose.model('Blacklist', blacklistSchema);

