import mongoose from 'mongoose';

const columnSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['text', 'number', 'date'], default: 'text' },
    order: { type: Number, default: 0 },
    hidden: { type: Boolean, default: false },
  },
  { _id: false }
);

const stepSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    operation: { type: mongoose.Schema.Types.Mixed },
    rowsAffected: { type: Number, default: 0 },
    at: { type: Date, default: Date.now },
    byAI: { type: Boolean, default: false },
  },
  { _id: false }
);

const datasetSchema = new mongoose.Schema(
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
    originalFileName: {
      type: String,
      trim: true,
      default: '',
    },
    sheetName: {
      type: String,
      trim: true,
      default: 'Sheet1',
    },
    columns: [columnSchema],
    rowCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['uploading', 'ready', 'sent'],
      default: 'ready',
    },
    steps: [stepSchema],
    sentToCampaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
    },
    lastSentAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

datasetSchema.index({ workspace: 1, createdAt: -1 });

export default mongoose.model('Dataset', datasetSchema);
