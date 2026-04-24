const { createMarketplaceUploadUrl, createGiveawayUploadUrl } = require("../fileUpload/file.js");

const uploadMarketplaceImages = async (param) => {
  const { userId, fileNames, contentTypes } = param;
  try {
    const uploadUrls = [];
    for (let i = 0; i < fileNames.length; i++) {
      const fileName = fileNames[i];
      const contentType = contentTypes[i];
      const uploadUrl = await createMarketplaceUploadUrl(
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
    console.log("Error in uploadMarketplaceImages:", error.message);
    return false;
  }
};

const uploadGiveawayImages = async (param) => {
    const { userId, fileNames, contentTypes } = param;
    try {
      const uploadUrls = [];
      for (let i = 0; i < fileNames.length; i++) {
        const fileName = fileNames[i];
        const contentType = contentTypes[i];
        const uploadUrl = await createGiveawayUploadUrl(
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
      console.log("Error in uploadGiveawayImages:", error.message);
      return false;
    }
  };

module.exports = { uploadMarketplaceImages, uploadGiveawayImages };