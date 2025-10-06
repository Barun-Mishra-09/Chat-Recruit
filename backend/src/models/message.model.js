import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
    },
    media: {
      type: Object,
      default: null,
      properties: {
        url: { type: String },
        type: { type: String } // 'image', 'video', 'file', etc.
      }
    },
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
