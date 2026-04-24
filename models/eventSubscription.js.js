const { Schema, model, default: mongoose } = require('mongoose');


const eventSubscriptionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    country: { type: String },
    currency: { type: String },
    currencySymbol: { type: String },
    features: [String],
    isActive: { type: Boolean, default: true }
});
module.exports = model("EventSubscription", eventSubscriptionSchema);

