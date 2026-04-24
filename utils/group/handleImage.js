const { createGroupUploadUrl, createCommunityUploadUrl } = require("../fileUpload/file.js");

const uploadCommunityImages = async (param) => {
  const { userId, fileNames, contentTypes } = param;
  try {
    const uploadUrls = [];
    for (let i = 0; i < fileNames.length; i++) {
      const fileName = fileNames[i];
      const contentType = contentTypes[i];
      const uploadUrl = await createCommunityUploadUrl(
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
    console.log("Error in uploadProfileImages:", error.message);
    return false;
  }
};

const uploadGroupImages = async (param) => {
  const { groupId, fileNames, contentTypes } = param;
  try {
    const uploadUrls = [];
    for (let i = 0; i < fileNames.length; i++) {
      const fileName = fileNames[i];
      const contentType = contentTypes[i];
      const uploadUrl = await createGroupUploadUrl(
        fileName,
        contentType,
        groupId
      );
      uploadUrls.push({
        fileName,
        uploadUrl,
      });
    }
    return uploadUrls;
  } catch (error) {
    console.log("Error in uploadGroupImages:", error.message);
    return false;
  }
};

module.exports = { uploadGroupImages, uploadCommunityImages };