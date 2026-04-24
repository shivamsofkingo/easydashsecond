const { Schema, model } = require('mongoose');


const BookingSchema = new Schema({
    bookingReference: { type: String, required: true, unique: true },
    eventId: { type: Schema.Types.ObjectId, required: true, ref: 'Event' },
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    //unique: true,

    // Ticket Details (Now supports multiple types)
    tickets: [{
        type: { type: String, enum: ['EARLYBIRD', 'VIP', 'VVIP', 'GENERAL'], required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true }
    }],

    // ADD: Currency fields
    country: { type: String },
    currency: { type: String, required: true }, // "INR", "USD", "GHS"
    currencySymbol: { type: String }, // "₹", "$", "₵"

    // Pricing (ALL NUMBERS - format to string only in response)
    convenienceFee: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    discount_amount: { type: Number, default: 0 },
    final_amount: { type: Number, required: true },
    coupon_code: { type: String, default: null },

    // Event Info
    eventTitle: { type: String },
    eventDate: { type: Date },
    eventTime: { type: String },
    eventVenue: { type: String },

    bookingStatus: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'expired', 'refunded'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },

    // Stripe Connect Payment Split Tracking
    platformFee: { type: Number, default: 0 }, // EzyDash's 2% cut
    organizerAmount: { type: Number, default: 0 }, // Amount transferred to organizer
    stripeConnectedAccountId: { type: String, default: null }, // Snapshot of organizer's Stripe account

    expiresAt: { type: Date },
}, { timestamps: true });

BookingSchema.index({ eventId: 1, userId: 1 });
BookingSchema.index({ bookingStatus: 1, paymentStatus: 1 });
BookingSchema.index({ createdAt: -1 });
//BookingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); TTL

module.exports = model("Booking", BookingSchema); 
