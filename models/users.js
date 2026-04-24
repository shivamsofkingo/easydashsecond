const { Schema, model, default: mongoose } = require("mongoose");

function arrayLimit(val) {
  return val.length <= 3;
}

const userSchema = new Schema(
  {
    name: { type: String, default: "newuser" },
    email: { type: String, unique: true, lowercase: true, default: null },
    password: { type: String, unique: true },
    role: { type: [String], default: "user" },
    profileType: {
      type: String,
      enum: ["Student", "Non Student", "NONE"],
      default: "NONE",
    },
    phoneNumber: { type: String, default: null },
    countryCode: { type: String, default: null },
    place: { type: String, default: null },
    region: { type: String, default: null },
    regionUpdate: {
      type: { type: String, default: "Point" },
      coordinates: { type: [Number] },
    },
    address: { type: String, default: null },
    profileImage: { type: String, default: "NA" },
    coverImage: { type: String, default: "NA" },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    isEmailChanged: { type: Boolean, default: false },
    totalAdsPosted: { type: Number, default: 0 },
    totalGroupCreated: { type: Number, default: 0 },
    googleId: { type: String, default: null },
    appleId: { type: String, default: null },
    deviceType: {
      type: String,
      enum: ["ANDROID", "IOS", "WEB"],
      default: "WEB",
    },
    deviceId: { type: String, default: null },
    deviceToken: { type: String, default: null },
    alternateSignIn: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    isProfileCreated: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    resetOtp: { type: String, default: null },
    otpExpiration: { type: Date, default: null },
    totalReports: { type: Number, default: 0 },
    refreshToken: { type: String, default: null },

    // KYC & Subscription Features
    isKycVerified: { type: Boolean, default: false },
    isVerifiedPM: { type: Boolean, default: false }, // For Property Managers in Pro Plan
    activeSubscription: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan', default: null },
    subscriptionExpiresAt: { type: Date, default: null },

    // Property Manager specific tracking
    accommodationPlan: { type: Schema.Types.ObjectId, ref: 'AccomodationPlan', default: null },
    accommodationPlanExpiresAt: { type: Date, default: null },
    accommodationAdsPostedThisPeriod: { type: Number, default: 0 },
    accommodationBoostsUsed: { type: Number, default: 0 },

    profileLinks: { 
      type: [{ type: String, maxlength: 200 }], 
      default: [],
      validate: [arrayLimit, '{PATH} exceeds the limit of 3']
    },

    // Stripe Connect Fields (for Event Managers)
    stripeAccountId: { type: String, default: null },
    stripeOnboardingComplete: { type: Boolean, default: false },
    stripeChargesEnabled: { type: Boolean, default: false },
    stripePayoutsEnabled: { type: Boolean, default: false },
    stripeDetailsSubmitted: { type: Boolean, default: false },
    stripeAccountCountry: { type: String, default: null },
    stripeOnboardingStartedAt: { type: Date, default: null },
    stripeOnboardingCompletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = model("User", userSchema);
