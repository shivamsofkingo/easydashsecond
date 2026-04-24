const { Schema, model } = require("mongoose");

const kycSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fullName: { type: String, required: true },
    accountHandle: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    nationalIdType: { type: String, required: true },
    frontImage: { type: String, required: true }, // S3 URL
    backImage: { type: String, required: true },  // S3 URL
    status: { 
        type: String, 
        enum: ["PENDING", "APPROVED", "REJECTED", "AWAITING_PAYMENT"], 
        default: "PENDING" 
    },
    pendingPlanId: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan', default: null },
    planExpiryDate: { type: Date, default: null },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "Admin", default: null },
    reviewedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = model("Kyc", kycSchema);
