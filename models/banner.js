const { Schema, model } = require('mongoose');

const bannerSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Admin"
    },
    title: {
        type: String,
        default: "NA"
    },
    description: {
        type: String,
        default: "NA"      
    },
    bannerImage: {
        type: String,
        default: "NA"
    },
    visibility: {
        type: Boolean,
        required: true,
    },
    validity: {
        type: Number,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

bannerSchema.index({ 
    expiryDate: 1,
    visibility: 1,
    isDeleted: 1 
});

module.exports = model('Banner', bannerSchema);