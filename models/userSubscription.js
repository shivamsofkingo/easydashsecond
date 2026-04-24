const { Schema, model } = require("mongoose");

const userSubscriptionSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    planId: { type: Schema.Types.ObjectId, ref: "SubscriptionPlan", required: true },
    stripeSubscriptionId: { type: String, required: true },
    stripeCustomerId: { type: String, required: true },
    status: { 
        type: String, 
        enum: ["ACTIVE", "CANCELED", "PAST_DUE", "UNPAID", "EXPIRED"], 
        default: "ACTIVE" 
    },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = model("UserSubscription", userSubscriptionSchema);
