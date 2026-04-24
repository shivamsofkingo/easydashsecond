const { Schema, model } = require('mongoose');

// (embedded in Event)
const ticketsStructureSchema = new Schema({
    type: { type: String, enum: ['EARLYBIRD', 'VIP', 'VVIP', 'GENERAL'], required: true, default: 'GENERAL' },
    price: { type: Number, required: true },
    totalSeats: { type: Number, required: true },
    availableSeats: { type: Number, required: true },
    includedServices: { type: [String], default: [] },
}, { _id: false });

const eventsSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    adsId: { type: Schema.Types.ObjectId, required: true, ref: 'AdsPost' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String },
    category: [{ type: String, required: true }],
    entryType: { type: String, enum: ["Free", "Paid"], required: true },
    itemImages: { type: [String], default: [] },
    region: { type: String, default: 'NA' },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number] }
    },

    // FIXED: Separate currency fields
    country: { type: String }, // "India", "USA", "Ghana"
    currency: { type: String }, // "INR", "USD", "GHS"
    currencySymbol: { type: String }, // "₹", "$", "₵"

    closestInstitute: { type: [String], default: [] },
    name: { type: String, required: true },
    email: { type: String, ref: 'User', default: null },
    phoneNumber: { type: String, ref: 'User', default: null },
    totalViews: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 },
    totalComment: { type: Number, default: 0 },
    eventStatus: { type: String, enum: ["cancelled", "postponed", "ontime"], default: "ontime" },
    interestedUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    totalReports: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    isEventCompleted: { type: Boolean, default: false },

    // Ticket Management
    ticketsStructure: { type: [ticketsStructureSchema], default: [] },
    feeHandling: { 
        type: String, 
        required: function() { return this.entryType === 'Paid'; } 
    },
    totalSeats: { type: Number, default: 0 },
    availableSeats: { type: Number, default: 0 },
    maxTicketsPerUser: { type: Number, default: 10 },
    RevenueGenerated: { type: Number, default: 0 }, // CHANGED to Number

    // Revenue Tracking (Stripe Connect)
    platformFeeAmount: { type: Number, default: 0 }, // EzyDash's 2% fee
    organizerRevenue: { type: Number, default: 0 }, // Amount transferred to organizer
}, { timestamps: true });


eventsSchema.index({
    title: 'text',
    description: 'text',
    category: 'text',
    entryType: 'text',
});


eventsSchema.index({ location: '2dsphere' });
eventsSchema.index({ date: 1, isEventCompleted: 1 });
eventsSchema.index({ createdAt: 1 });
eventsSchema.index({ isDeleted: 1 });

module.exports = model("Event", eventsSchema); 