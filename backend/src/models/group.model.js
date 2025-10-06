import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    members: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],
    groupIcon: { type: String, default: "" },
    isGroup: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Group = mongoose.model("Group", groupSchema);
