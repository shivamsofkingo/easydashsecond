const { Schema, model } = require("mongoose");

const conversationSchema = new Schema(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    adsId: {
      type: Schema.Types.ObjectId,
      ref: "AdsPost",
      required: true,
    },
    roomId: {
      type: String,
      required: true,
    },
    messages: [
      {
        type: Schema.Types.ObjectId,
        ref: "ChatMessage",
      },
    ],
    lastMessage: [
      {
        type: Schema.Types.ObjectId,
        ref: "ChatMessage",
      },
    ],
    deletedBy: {
      type: Map,
      of: Date,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = model("Conversation", conversationSchema);
