const { Schema, model } = require('mongoose');

const guestUserSchema = new Schema({
    guestId: { type: String, required: true },
    lastSeen: { type: Date }
}, { timestamps: true });

module.exports = model('GuestUser', guestUserSchema);