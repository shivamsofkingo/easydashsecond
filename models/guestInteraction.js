const { Schema, model } = require('mongoose');

const guestInteractionSchema = new Schema({
    guestId: {type: String, required: true, ref: 'GuestUser'},
    action: { type: String, default: null }, // could be search, navigate to a page etc..
    metadata: { type: Schema.Types.Mixed, default: null }
}, { timestamps: true });
  
module.exports = model('GuestInteraction', guestInteractionSchema);
  