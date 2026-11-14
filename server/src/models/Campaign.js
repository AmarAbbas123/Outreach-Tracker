import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['guest_post', 'broken_link', 'resource_page', 'link_insertion', 'digital_pr', 'other'],
      default: 'guest_post',
    },
    targetUrls: [
      {
        type: String,
        trim: true,
      },
    ],
    goalLinks: {
      type: Number,
      default: 0,
      min: 0,
    },
    budget: {
      type: Number,
      default: 0,
      min: 0,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'completed'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true }
);

campaignSchema.index({ workspace: 1, client: 1 });
campaignSchema.index({ workspace: 1, status: 1 });

export default mongoose.model('Campaign', campaignSchema);

