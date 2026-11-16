import mongoose from 'mongoose';

const scrapeTaskSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ScrapeJob',
      required: true,
      index: true,
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    domain: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'ok', 'no_contact', 'blocked', 'timeout', 'error'],
      default: 'pending',
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    error: {
      type: String,
      default: '',
    },
    pagesVisited: [
      {
        type: String,
        trim: true,
      },
    ],
    resultRowIndex: {
      type: Number,
    },
    extractedData: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

scrapeTaskSchema.index({ job: 1, status: 1 });

export default mongoose.model('ScrapeTask', scrapeTaskSchema);
