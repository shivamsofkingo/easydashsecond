const Accomodation = require("../../models/accomodation.js");
const { bannerLogger } = require("../../config/loggerConfig.js");
const constants = require("../../constants/constants.js");

const updateBoostValidity = async () => {
  try {
    const currentDate = new Date();
    let skip = 0;
    let hasMore = true;
    let totalUpdated = 0;
    bannerLogger.info("Starting accommodation boost validity update job");
    
    while (hasMore) {
      const expiredBoosts = await Accomodation.find(
        {
          isBoosted: true,
          isDeleted: false,
          isSold: false,
          boostExpiresAt: { $lt: currentDate },
        },
        { _id: 1 }
      )
        .skip(skip)
        .limit(constants.batchSize.default || 100)
        .lean();

      if (expiredBoosts.length === 0) {
        hasMore = false;
        bannerLogger.info("No more expired boosted ads to update");
        break;
      }
      
      const adIds = expiredBoosts.map((ad) => ad._id);
      
      // we do not just unset isBoosted if ad is feature/Elite banner
      // Let's just unset the boost specific flags and keep priority for feature banners separately
      // Wait, isFeaturedBanner means priorityScore = 4. Regular boost has priorityScore = 1, 2, or 3.
      
      // Let's iterate using updateMany using a query that handles feature banners safely, or let's do one by one if batch size is small, but updateMany is fine.
      // Actually, if it's a feature banner, setting priorityScore to 0 is wrong, it should be 4.
      // Let's update them carefully.
      for (const adId of adIds) {
         const adDoc = await Accomodation.findById(adId);
         if (adDoc) {
             adDoc.isBoosted = false;
             adDoc.boostExpiresAt = null;
             if (adDoc.isFeaturedBanner) {
                 adDoc.priorityScore = 4;
             } else {
                 adDoc.priorityScore = 0;
             }
             await adDoc.save();
             totalUpdated += 1;
         }
      }
      skip += (constants.batchSize.default || 100);
    }
    bannerLogger.info(`Total expired boosted ads cleaned up: ${totalUpdated}`);
    return totalUpdated;
  } catch (error) {
    bannerLogger.error("Error in updateBoostValidity:", error.message);
    throw error;
  }
};

module.exports = {
  updateBoostValidity,
};
