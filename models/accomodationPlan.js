const { Schema, model } = require("mongoose");

const accomodationPlanSchema = new Schema(
  {
    tier: {
      type: String,
      enum: ["Starter", "Pro", "Elite"],
      required: true,
      unique: true,
    },
    price: {
      type: Number,
      required: true,
    },
    adsLimit: {
      type: Number,
      default: 0,
    },
    boostLimit: {
      type: Number,
      default: 0,
    },
    hasVerificationBadge: {
      type: Boolean,
      default: false,
    },
    hasFeaturedBanner: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

/**
 * Pre-save hook to enforce fixed features based on the tier.
 * Admins can change the price, but the system locks the capabilities.
 */
accomodationPlanSchema.pre("save", function (next) {
  if (this.tier === "Starter") {
    this.adsLimit = 5;
    this.boostLimit = 3;
    this.hasVerificationBadge = false;
    this.hasFeaturedBanner = false;
  } else if (this.tier === "Pro") {
    this.adsLimit = 8;
    this.boostLimit = 10;
    this.hasVerificationBadge = true;
    this.hasFeaturedBanner = false;
  } else if (this.tier === "Elite") {
    this.adsLimit = -1; // -1 represents Unlimited
    this.boostLimit = -1; // -1 represents Unlimited
    this.hasVerificationBadge = false; // Only in Pro as per user feedback
    this.hasFeaturedBanner = true;
  }
  next();
});

module.exports = model("AccomodationPlan", accomodationPlanSchema);
