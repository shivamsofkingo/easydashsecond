const { logger } = require("../../config/loggerConfig.js");
const { createBannerUploadUrl } = require("../fileUpload/file.js");

const uploadBannerImages = async (param) => {
  const { userId, fileNames, contentTypes } = param;
  try {
    const uploadUrls = [];
    for (let i = 0; i < fileNames.length; i++) {
      const fileName = fileNames[i];
      const contentType = contentTypes[i];
      const uploadUrl = await createBannerUploadUrl(
        fileName,
        contentType,
        userId
      );
      uploadUrls.push({
        fileName,
        uploadUrl,
      });
    }
    return uploadUrls;
  } catch (error) {
    logger.error(`error in uploadBannerImages: ${error.message}`, { error });
    return false;
  }
};

module.exports = { uploadBannerImages };