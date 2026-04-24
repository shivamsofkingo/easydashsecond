const { Schema, model } = require("mongoose");

const groupSchema = new Schema(
  {
    groupName: { type: String, required: true },
    groupDescription: { type: String, required: true },
    communityCategory: { type: String, required: true },
    groupCategory: { type: String, required: true},
    isCreatedByAdmin: { type: Boolean, default: false },
    isPrivate: { type: Boolean, default: false },
    groupImage: { type: String, default: "NA"},
    name: { type: String, required: true },
    email: { type: String, default: null },
    phoneNumber: { type: String, default: null }, 
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    communityId: { type: Schema.Types.ObjectId, ref: "Community", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    pendingRequests: [{ type: Schema.Types.ObjectId, ref: "User" }],
    roomId: { type: String, default: null },
    totalMembers: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = model("Group", groupSchema);
