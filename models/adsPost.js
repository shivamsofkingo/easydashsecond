const { Schema, model } = require('mongoose');

const adsPostSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    adsType: { type: String, enum: ['Giveaway', 'Marketplace', 'Accomodation', 'Event'], required: true }
}, { timestamps: true });

module.exports = model('AdsPost', adsPostSchema);