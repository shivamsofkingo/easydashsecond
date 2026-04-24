const { Schema, model } = require("mongoose");
const Group = require("../models/group.js");

const communitySchema = new Schema({
  communityAdminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  communityImage: { type: String, default: "NA" },
  communityName: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ["academic", "social", "cultural", "popCulture", "creative", "hybrid"], required: true },
  groups: [
    {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      default: "NA",
    },
  ],
  totalGroups: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false }
}, {timestamps: true});


communitySchema.pre("findOneAndDelete", async function (next) {
  const communityId = this.getQuery()._id;
  try {
    await Group.deleteMany({ communityId });
    console.log(`All groups associated with community ${communityId} deleted.`);
    next();
  } catch (error) {
    console.error("Error deleting associated groups:", error);
    next(error);
  }
});

module.exports = model("Community", communitySchema);
