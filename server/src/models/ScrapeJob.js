import mongoose from 'mongoose';

const scrapeJobSchema = new mongoose.Schema(
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
    inputType: {
      type: String,
      enum: ['urls', 'prospects', 'any_url'],
      default: 'urls',
    },
    inputs: [
      {
        type: String,
        trim: true,
      },
    ],
    prospectIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prospect',
      },
    ],
    options: {
      maxPagesPerSite: { type: Number, default: 5 },
      renderJs: { type: Boolean, default: false },
      useAI: { type: Boolean, default: false },
      fields: [{ type: String }],
    },
    mode: {
      type: String,
      enum: ['auto', 'describe', 'recipe'],
    },
    instruction: {
      type: String,
      default: '',
    },
    recipe: {
      type: mongoose.Schema.Types.Mixed,
    },
    pagination: {
      mode: {
        type: String,
        enum: ['none', 'next_link', 'url_pattern', 'sitemap', 'follow_links'],
        default: 'none',
      },
      pattern: { type: String, default: '' },
      maxPages: { type: Number, default: 50 },
      maxRows: { type: Number, default: 2000 },
    },
    status: {
      type: String,
      enum: ['queued', 'running', 'completed', 'failed', 'cancelled'],
      default: 'queued',
      index: true,
    },
    counts: {
      total: { type: Number, default: 0 },
      done: { type: Number, default: 0 },
      ok: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      blocked: { type: Number, default: 0 },
    },
    dataset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dataset',
    },
    startedAt: { type: Date },
    finishedAt: { type: Date },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

scrapeJobSchema.index({ workspace: 1, createdAt: -1 });

export default mongoose.model('ScrapeJob', scrapeJobSchema);
