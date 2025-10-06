import mongoose, { mongo } from "mongoose";

const statusSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  mediaUrl: {
    type: String,
    required: true,
  },
  mediaType: {
    type: String,
    enum: ["image", "video"],
    required: true,
  },
  caption: {
    type: String,
  },
  seenBy: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      fullName: {
        type: String,
      },
      seenAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  expiredAt: { type: Date, default: () => Date.now() + 24 * 60 * 60 * 1000 }, // 24 hours
});

// Auto delete after 24 hours
statusSchema.index({ expiredAt: 1 }, { expiresAfterSeconds: 0 });

export const Status = mongoose.model("status", statusSchema);
