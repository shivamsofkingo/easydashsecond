const mongoose = require("mongoose");

const boostPlanSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        required: true
    },
    duration: { 
        type: Number, 
        required: true,
        enum: [3, 7, 14],
        unique: true
    },
    price: { 
        type: Number, 
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

module.exports = mongoose.model("BoostPlan", boostPlanSchema);
