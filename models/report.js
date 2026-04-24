const { Schema, model } = require('mongoose');

const reportSchema = new Schema({
    reportedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reportedTo: { type: Schema.Types.ObjectId, ref: "User", default: null },
    adsId: { type: Schema.Types.ObjectId },
    adsType: { type: String },
    itemImages: { type: [String], default: [] },
    reportType: { type: String, enum: ["user", "ads", "other"], default: "other"},
    reason: { type: String, required: true },
    comment: { type: String },
    isDeleted: { type: Boolean, default: false }  // corresponds whether user or ad is active or not
}, {timestamps: true});

module.exports = model('Report', reportSchema);