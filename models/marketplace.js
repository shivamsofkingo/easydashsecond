const { Schema, model } = require('mongoose');

const marketplaceSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    adsId: { type: Schema.Types.ObjectId, required: true, ref: 'AdsPost'},
    category: { type: String, enum: ['Study Materials', 'Electronics', 'Furniture', 'Stationary & Supplies', 'Services', 'Other'], default: 'Other' },
    uploadType: { type: String, enum: ['Individual', 'Shop'], default: 'Individual' },
    shopName: { type: String, default: "NA" },
    shopLocation: { type: String, default: "NA" },
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: String, required: true },
    itemImages: { type: [String], default: [] },
    region: { type: String, default: 'NA' },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number] }
    },
    closestInstitute: { type: [String], default: 'NA' },
    name: { type: String, required: true },
    email: { type: String, ref: 'User', default: null},
    phoneNumber: { type: String, ref: 'User', default: null },
    totalViews: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    totalReports: { type: Number, default: 0 },
    isSold: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

marketplaceSchema.index({
    adsId: 'text', 
    title: 'text', 
    description: 'text', 
    propertyType: 'text',
    roomType: 'text', 
    bedType: 'text',
    features: 'text',
    location: "2dsphere",
    createdAt: 1,
    isDeleted: 1
});

module.exports = model('Marketplace', marketplaceSchema);