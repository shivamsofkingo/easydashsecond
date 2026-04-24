const { Schema, model } = require("mongoose");

const accomodationSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    adsId: { type: Schema.Types.ObjectId, required: true, ref: 'AdsPost'},
    title: { type: String, required: true },
    description: { type: String, required: true },
    propertyType: { type: String, enum: ["Hostel", "Dormitory", "Shared House", "Hotel", "Private House"], required: true },
    roomType: [{ type: String, required: true }],
    bedType: [{ type: String, default: null }],
    rentSchedule: { type: String, default: null },
    nearbyFacilities: [{ type: String, default: null }],
    amenities: [{ type: String, default: null }],
    price: { type: String, required: true },
    itemImages: { type: [String], default: [] },
    region: { type: String, default: 'NA' },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number] }
    },
    country: { type: String, default: 'NA', index: true },
    closestInstitute: { type: [String], default: [] },
    name: { type: String, required: true },
    email: { type: String, ref: 'User', default: null},
    phoneNumber: { type: String, ref: 'User', default: null },
    totalViews: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0},
    totalRatings: { type: Number, default: 0 },
    averageRatings: { type: Number, default: 0 },
    ratingScore: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    totalReports: { type: Number, default: 0 },
    isSold: { type: Boolean, default: false },
    isBoosted: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    isFeaturedBanner: { type: Boolean, default: false }, // For Elite users
    priorityScore: { type: Number, default: 0 }, // Tracks sorting priority (Elite>Pro>Starter)
    boostExpiresAt: { type: Date, default: null } // Explicit expiry time for standard 3-day boost
}, {timestamps: true});

accomodationSchema.index({
    adsId: 'text', 
    title: 'text', 
    description: 'text', 
    propertyType: 'text',
    roomType: 'text', 
    bedType: 'text',
    nearbyFacilities: 'text',
    features: 'text',
    location: "2dsphere",
    createdAt: 1, 
    isDeleted: 1
});

module.exports = model('Accomodation', accomodationSchema);