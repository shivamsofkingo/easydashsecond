const { Schema, model } = require('mongoose');

const reviewsSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    adsId: { type: Schema.Types.ObjectId, required: true },
    // adsType: { type: String, enum: ["Giveaway", "Marketplace", "Accomodation", "Events"], required: true },
    review: { type: String },
    ratings: { type: Number },
}, {timestamps: true});

module.exports = model('Reviews', reviewsSchema);