import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    domain: {
      type: String,
      trim: true,
      lowercase: true,
    },
    niche: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

clientSchema.index({ workspace: 1, name: 1 });

export default mongoose.model('Client', clientSchema);
