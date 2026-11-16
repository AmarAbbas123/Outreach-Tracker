import mongoose from 'mongoose';

const scrapeRecipeSchema = new mongoose.Schema(
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
      default: '',
    },
    instruction: {
      type: String,
      default: '',
    },
    recipe: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    lastWorkedAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

scrapeRecipeSchema.index({ workspace: 1, createdAt: -1 });

export default mongoose.model('ScrapeRecipe', scrapeRecipeSchema);
