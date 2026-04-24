const { Schema, model } = require("mongoose");

const followSchema = new Schema(
  {
    followerId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // The user who is following
    followeeId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // The user being followed
  },
  { timestamps: true }
);

followSchema.index({ followerId: 1, followeeId: 1 }, { unique: true });

module.exports = model("Follow", followSchema);
