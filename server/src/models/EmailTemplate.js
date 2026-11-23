import mongoose from 'mongoose';

const emailTemplateSchema = new mongoose.Schema(
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
    campaignType: {
      type: String,
      enum: ['guest_post', 'broken_link', 'resource_page', 'link_insertion', 'digital_pr', 'other', 'general'],
      default: 'guest_post',
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
    },
    stats: {
      used: {
        type: Number,
        default: 0,
        min: 0,
      },
      replied: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  },
  { timestamps: true }
);

emailTemplateSchema.index({ workspace: 1, name: 1 });
emailTemplateSchema.index({ workspace: 1, campaignType: 1 });

export default mongoose.model('EmailTemplate', emailTemplateSchema);
