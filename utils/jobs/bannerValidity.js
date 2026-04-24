const Banner = require("../../models/banner.js");
const { bannerLogger } = require("../../config/loggerConfig.js");
const constants = require("../../constants/constants.js");

const updateBannerVisibility = async () => {
  try {
    const currentDate = new Date();
    let skip = 0;
    let hasMore = true;
    let totalUpdated = 0;
    bannerLogger.info("Starting banner visibility update job");
    while (hasMore) {
      const banners = await Banner.find(
        {
          expiryDate: { $lt: currentDate },
          visibility: true,
          isDeleted: false,
        },
        { _id: 1 }
      )
        .skip(skip)
        .limit(constants.batchSize.default)
        .lean();

      if (banners.length === 0) {
        hasMore = false;
        bannerLogger.info("No more banners to update");
        break;
      }
      const bannerIds = banners.map((banner) => banner._id);
      const result = await Banner.updateMany(
        { _id: { $in: bannerIds } },
        { $set: { visibility: false, isDeleted: true } }
      );
      totalUpdated += result.modifiedCount;
      bannerLogger.info(
        `Banner visibility batch updated: ${result.modifiedCount} out of ${result.matchedCount}`
      );
      skip += constants.batchSize.default;
    }
    bannerLogger.info(`Total banners updated to invisible: ${totalUpdated}`);
    return totalUpdated;
  } catch (error) {
    bannerLogger.error("Error in updateBannerVisibility:", error.message);
    throw error;
  }
};

module.exports = {
  updateBannerVisibility,
};
