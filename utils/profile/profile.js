const User = require("../../models/users.js");
const Student = require("../../models/student.js");
const NonStudent = require("../../models/nonStudent.js");
const Giveaway = require("../../models/giveaways.js");
const Marketplace = require("../../models/marketplace.js");
const Accomodation = require("../../models/accomodation.js");
const Event = require("../../models/event.js");

const { createProfileUploadUrl, createProfileUploadUrlForAdmin } = require("../fileUpload/file.js");

const getUserProfile = async (param) => {
  try {
    const { id, profileType } = param;
    if (!id || !profileType) {
      console.log("Missing required parameters in getUserProfile");
      return null;
    }
    const collection = profileType === "Student" ? Student : NonStudent;
    const profileDetails = await collection.findOne(
      { userId: id },
      "-__v -createdAt -updatedAt"
    );
    console.log('hello')
    if (!profileDetails) {
      return null;
    }
    return profileDetails;
  } catch (error) {
    console.log("error in getUserProfile", error.message);
    return false;
  }
};

const updateUserProfileImage = async (param) => {
  try {
    const { userId, fileName, session } = param;
    let user;
    if (session) {
      user = await User.findById(userId);
    } else {
      user = await User.findById(userId).session(session);
    }
    if (!user) {
      throw new Error("user not found");
    }
    const imageUrl = generatePublicUrl(fileName, userId);
    user.profileImage = imageUrl;
    if (session) {
      await user.save({ session });
    } else {
      await user.save();
    }
    return user.profileImage;
  } catch (error) {
    throw new Error("error in updateUserProfileImage", error.message);
  }
};

const uploadProfileImages = async (param) => {
  const { userId, fileNames, contentTypes } = param;
  try {
    const uploadUrls = [];
    for (let i = 0; i < fileNames.length; i++) {
      const fileName = fileNames[i];
      const contentType = contentTypes[i];
      const uploadUrl = await createProfileUploadUrl(
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


const getpostByUser = async (param) => {
  try {
    const { userId, profile, perPage, page } = param;
    const pageSize = perPage;
    const skip = (page - 1) * pageSize;

    let totalCount = 0;
    const giveawayCount = await Giveaway.countDocuments({ userId, isDeleted: false });
    totalCount += giveawayCount;

    const marketplaceCount = await Marketplace.countDocuments({ userId, isDeleted: false });
    totalCount += marketplaceCount;

    let accomodationCount = 0;
    if (profile === "Property Manager" || profile === "Student") {
      accomodationCount = await Accomodation.countDocuments({ userId, isDeleted: false });
      totalCount += accomodationCount;
    }

    let eventCount = 0;
    if (profile === "Event Manager") {
      eventCount = await Event.countDocuments({ userId, isDeleted: false });
      totalCount += eventCount;
    }
    const totalPages = Math.ceil(totalCount / pageSize);
    if (page > totalPages) {
      return { ads: [], totalPages, totalCount };
    }
    const projection = {
      category: 0,
      uploadType: 0,
      shopName: 0,
      shopLocation: 0,
      closestInstitute: 0,
      name: 0,
      email: 0,
      phoneNumber: 0,
      updatedAt: 0,
      __v: 0,
    };
    const giveaways = await Giveaway.find({ userId, isDeleted: false }).select(projection).exec();
    const marketplaceAds = await Marketplace.find({ userId, isDeleted: false })
      .select(projection)
      .exec();

    const accomodationAds = profile === "Property Manager" || profile === "Student" ? await Accomodation.find({ userId, isDeleted: false }).select(projection).exec() : [];
    const eventAds = profile === "Event Manager" ? await Event.find({ userId, isDeleted: false }).select(projection).exec() : [];
    let ads = [
      ...giveaways.map((ad) => ({ ...ad.toObject(), adsType: "Giveaway" })),
      ...marketplaceAds.map((ad) => ({ ...ad.toObject(), adsType: "Marketplace" })),
      ...accomodationAds.map((ad) => ({ ...ad.toObject(), adsType: "Accomodation" })),
      ...eventAds.map((ad) => ({ ...ad.toObject(), adsType: "Event" })),
    ];
    ads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    ads = ads.slice(skip, skip + pageSize);
    return { ads, totalPages, totalCount };
  } catch (error) {
    console.error("Error in getpostByUser:", error.message);
    return false;
  }
};

module.exports = {
  getUserProfile,
  updateUserProfileImage,
  uploadProfileImages,
  getpostByUser,
};
