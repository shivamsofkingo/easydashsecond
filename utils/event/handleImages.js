const { createEventUploadUrl } = require("../fileUpload/file");
const { updateAccomodationImage } = require("../ads/ads");

const uploadEventImages = async (param) => {
  const { userId, fileNames, contentTypes } = param;
  try {
    const uploadUrls = [];
    for (let i = 0; i < fileNames.length; i++) {
      const fileName = fileNames[i];
      const contentType = contentTypes[i];
      const uploadUrl = await createEventUploadUrl(
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
    console.log("Error in uploadEventImages:", error.message);
    return false;
  }
};

// const removeGiveawayImages = async (param) => {
//   const { userId, adsId, fileNames, contentTypes } = param;
//   try {
//     const myUserId = req.user._id.toString();
//     if (myUserId !== userId) {
//       return res.status(400).json({
//         status: 0,
//         msg: "unauthorize request",
//         payload: {},
//       });
//     }
//     await deleteGiveawayImages(fileNames, userId);
//     if (adsId) {
//       const ad = await GiveawaysAndMarketplace.findOne({ adsId });
//       if (!ad) {
//         return res.status(400).json({
//           status: 0,
//           msg: "ad not found",
//           payload: {},
//         });
//       }
//       ad.itemImages = ad.itemImages.filter((imgUrl) => {
//         const baseImageName = imgUrl.split("/").pop();
//         console.log("Checking image removal:", baseImageName, fileNames);
//         return !fileNames.includes(baseImageName);
//       });
//       await ad.save();
//     }
//     res.status(200).json({
//       status: 1,
//       msg: "success",
//       payload: {},
//     });
//   } catch (error) {
//     console.log("error in removeProfileImage", error.message);
//     res.status(500).json({
//       status: 0,
//       msg: "something went wrong",
//       payload: {},
//     });
//   }
// };


module.exports = { uploadEventImages };