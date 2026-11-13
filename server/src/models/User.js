import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: 'owner',
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    signature: {
      type: String,
      default: '',
    },
    followUpDays: {
      type: Number,
      default: 3,
    },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);

