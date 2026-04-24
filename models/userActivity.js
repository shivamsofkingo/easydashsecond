const { Schema, model } = require("mongoose");

const userActivitySchema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    events: [{ type: Schema.Types.ObjectId, ref: "Event" }],
}, {
    timestamps: true
});

module.exports = model("UserActivity", userActivitySchema);