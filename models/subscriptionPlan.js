const mongoose = require("mongoose");

const subscriptionPlanSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        required: true
    },
    planName: { 
        type: String, 
        required: true,
        enum: ["Monthly", "Annually", "Yearly", "Weekly"],
        default: "Monthly"
    },
    price: { 
        type: Number, 
        required: true 
    },
    discountText: { 
        type: String, 
        default: null 
    },
    features: { 
        type: [String], 
        default: [],
        required: true
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
