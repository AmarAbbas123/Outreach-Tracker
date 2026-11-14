import mongoose from 'mongoose';

const datasetRowSchema = new mongoose.Schema(
  {
    dataset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dataset',
      required: true,
      index: true,
    },
    index: {
      type: Number,
      required: true,
    },
    cells: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    original: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isAdded: {
      type: Boolean,
      default: false,
    },
    sentProspect: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prospect',
    },
  },
  { timestamps: true }
);

datasetRowSchema.index({ dataset: 1, index: 1 });
datasetRowSchema.index({ dataset: 1, isDeleted: 1 });

export default mongoose.model('DatasetRow', datasetRowSchema);

