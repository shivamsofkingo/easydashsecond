const User = require("../../models/users.js");
const Accomodation = require("../../models/accomodation.js");
const { bannerLogger } = require("../../config/loggerConfig.js");
const constants = require("../../constants/constants.js");

const updateSubscriptionValidity = async () => {
  try {
    const currentDate = new Date();
    let skip = 0;
    let hasMore = true;
    let totalUpdated = 0;
    bannerLogger.info("Starting accommodation subscription validity sweep");
    
    while (hasMore) {
      // Find users whose subscription has naturally expired
      const expiredUsers = await User.find(
        {
          accommodationPlan: { $ne: null },
          accommodationPlanExpiresAt: { $lt: currentDate },
        },
        { _id: 1 }
      )
        .skip(skip)
        .limit(constants.batchSize.default || 100)
        .lean();

      if (expiredUsers.length === 0) {
        hasMore = false;
        bannerLogger.info("No more expired users found in sweep");
        break;
      }
      
      const userIds = expiredUsers.map((user) => user._id);
      
      for (const userId of userIds) {
          // 1. Revoke the verification badge and clear plan info
          await User.findByIdAndUpdate(userId, {
              accommodationPlan: null,
              accommodationPlanExpiresAt: null,
              isVerifiedPM: false
          });

          // 2. Revoke all premium accommodation flags (Boosts and Featured Banners)
          await Accomodation.updateMany(
              { userId: userId },
              { $set: { isBoosted: false, isFeaturedBanner: false, priorityScore: 0, boostExpiresAt: null } }
          );

          totalUpdated += 1;
      }
      
      skip += (constants.batchSize.default || 100);
    }
    
    bannerLogger.info(`Total users whose expired subscription features were revoked: ${totalUpdated}`);
    return totalUpdated;
  } catch (error) {
    bannerLogger.error("Error in updateSubscriptionValidity:", error.message);
    throw error;
  }
};

module.exports = {
  updateSubscriptionValidity,
};
