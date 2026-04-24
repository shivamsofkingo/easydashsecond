const { Schema, model } = require("mongoose");

const notificationSchema = new Schema({
    senderId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    recieverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    adsId: { type: Schema.Types.ObjectId, default: null },
    adsType: { type: String, default: null },
    images: { type: String, default: "NA" },
    notificationType: { type: String, enum: ["Follow", "Ads", "Other"], required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
}, {timestamps: true});

module.exports = model("Notification", notificationSchema);
