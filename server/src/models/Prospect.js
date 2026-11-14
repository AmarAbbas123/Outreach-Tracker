import mongoose from 'mongoose';

export const PROSPECT_STATUSES = [
  'new',
  'contact_found',
  'email_sent',
  'followup_sent',
  'replied',
  'negotiating',
  'agreed',
  'link_live',
  'lost',
];

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: PROSPECT_STATUSES,
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { _id: false }
);

const prospectSchema = new mongoose.Schema(
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
    domain: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    pageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    contactName: {
      type: String,
      trim: true,
      default: '',
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    niche: {
      type: String,
      trim: true,
      default: '',
    },
    country: {
      type: String,
      trim: true,
      default: '',
    },
    metrics: {
      dr: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      traffic: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    notes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: PROSPECT_STATUSES,
      default: 'new',
      index: true,
    },
    statusHistory: [statusHistorySchema],
    lastContactedAt: {
      type: Date,
    },
    nextFollowUpAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Compound indexes
prospectSchema.index({ workspace: 1, campaign: 1, domain: 1 }, { unique: true });
prospectSchema.index({ workspace: 1, status: 1 });
prospectSchema.index({ workspace: 1, domain: 1 });

export default mongoose.model('Prospect', prospectSchema);
