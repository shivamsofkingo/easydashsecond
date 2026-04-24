const User = require("../../models/users.js");
const Admin = require("../../models/admin.js");
const NonStudent = require("../../models/nonStudent.js");
const Giveaway = require("../../models/giveaways.js");
const Marketplace = require("../../models/marketplace.js");
const Accomodation = require("../../models/accomodation.js");
const Event = require("../../models/event.js");
const Community = require("../../models/community.js");
const Group = require("../../models/group.js");
const AdsPost = require("../../models/adsPost.js");
const Report = require("../../models/report.js");
const Banner = require("../../models/banner.js");
const { default: mongoose } = require("mongoose");

const generateProfilePublicUrl = (fileName, myUserId) => {
  return `https://${process.env.BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/users/${myUserId}/profileImage/${fileName}`;
};

const generateProfilePublicUrlAdmin = (fileName, myUserId) => {
  return `https://${process.env.BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/admins/${myUserId}/profileImage/${fileName}`;
};

const generateCoverImagePublicUrl = (fileName, myUserId) => {
  return `https://${process.env.BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/users/${myUserId}/coverImage/${fileName}`;
};

const generateMarketplacePublicUrl = (fileName, myUserId) => {
  return `https://${process.env.BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/users/${myUserId}/marketplace/${fileName}`;
};

const generateGiveawayPublicUrl = (fileName, myUserId) => {
  return `https://${process.env.BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/users/${myUserId}/giveaways/${fileName}`;
};

const generateAccomodationPublicUrl = (fileName, myUserId) => {
  return `https://${process.env.BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/users/${myUserId}/accomodations/${fileName}`;
};

const generateEventPublicUrl = (fileName, myUserId) => {
  return `https://${process.env.BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/users/${myUserId}/events/${fileName}`;
};

const generateCommunityPublicUrl = (fileName, myUserId) => {
  return `https://${process.env.BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/users/${myUserId}/community/${fileName}`;
};

const generateGroupPublicUrl = (fileName, groupId) => {
  return `https://${process.env.BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/groups/${groupId}/${fileName}`;
};

const generateReportPublicUrl = (fileName, myUserId) => {
  return `https://${process.env.BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/users/${myUserId}/reportProblem/${fileName}`;
};

const generateBannerPublicUrl = (fileName, myUserId) => {
  return `https://${process.env.BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/banners/${myUserId}/${fileName}`;
};

const updateProfileImage = async (param) => {
  const { userId, fileNames, session } = param;
  try {
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new Error("User not found");
    }
    const imageUrl = generateProfilePublicUrl(fileNames, userId);
    user.profileImage = imageUrl;
    await user.save({ session });
    return user.profileImage;
  } catch (error) {
    console.error(`Error in updateProfileImage: ${error.message}`);
    throw new Error(`Failed to update profile image: ${error.message}`);
  }
};

const updateProfileImageAdmin = async (param) => {
  const { userId, fileNames, session } = param;
  try {
    const user = await Admin.findById(userId).session(session);
    if (!user) {
      throw new Error("User not found");
    }
    const imageUrl = generateProfilePublicUrlAdmin(fileNames, userId);
    user.profileImage = imageUrl;
    await user.save({ session });
    return user.profileImage;
  } catch (error) {
    console.error(`Error in updateProfileImageAdmin: ${error.message}`);
    throw new Error(`Failed to updateProfileImageAdmin: ${error.message}`);
  }
};

const updateCoverImage = async (param) => {
  const { userId, fileNames, session } = param;
  try {
    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new Error("User not found");
    }
    const imageUrl = generateCoverImagePublicUrl(fileNames, userId);
    user.coverImage = imageUrl;
    await user.save({ session });
    return user.profileImage;
  } catch (error) {
    console.error(`Error in updateProfileImage: ${error.message}`);
    throw new Error(`Failed to update profile image: ${error.message}`);
  }
};

const updateGiveawayImage = async (param) => {
  const { userId, adsId, fileNames, session } = param;
  try {
    const giveaway = await Giveaway.findOne({
      userId,
      adsId,
    }).session(session);
    if (!giveaway) {
      throw new Error("Marketplace ad post not found for the user.");
    }
    const imageUrl = generateGiveawayPublicUrl(fileNames, userId);
    giveaway.itemImages.push(imageUrl);
    await giveaway.save({ session });
    return giveaway.itemImages;
  } catch (error) {
    console.error(`Error in updateGiveawayImage: ${error.message}`);
    throw new Error(`Failed to update giveaway image: ${error.message}`);
  }
};

const updateMarketplaceImage = async (param) => {
  const { userId, adsId, fileNames, session } = param;
  try {
    const marketplace = await Marketplace.findOne({
      userId,
      adsId,
    }).session(session);
    if (!marketplace) {
      throw new Error("Marketplace ad post not found for the user.");
    }
    const imageUrl = generateMarketplacePublicUrl(fileNames, userId);
    marketplace.itemImages.push(imageUrl);
    await marketplace.save({ session });
    return marketplace.itemImages;
  } catch (error) {
    console.error(`Error in updateMarketplaceImage: ${error.message}`);
    throw new Error(`Failed to update marketplace image: ${error.message}`);
  }
};

const updateAccomodationImage = async (param) => {
  const { userId, adsId, fileNames, session } = param;
  try {
    const accomodation = await Accomodation.findOne({
      userId,
      adsId,
    }).session(session);
    if (!accomodation) {
      throw new Error("Accommodation not found for the user.");
    }
    const imageUrl = generateAccomodationPublicUrl(fileNames, userId);
    accomodation.itemImages.push(imageUrl);
    await accomodation.save({ session });
    return accomodation.itemImages;
  } catch (error) {
    console.error(`Error in updateAccomodationImage: ${error.message}`);
    throw new Error(`Failed to update accommodation image: ${error.message}`);
  }
};

const updateEventImage = async (param) => {
  const { userId, adsId, fileNames, session } = param;
  try {
    const event = await Event.findOne({
      userId,
      adsId,
    }).session(session);
    if (!event) {
      throw new Error("Event not found for the user.");
    }
    const imageUrl = generateEventPublicUrl(fileNames, userId);
    event.itemImages.push(imageUrl);
    await event.save({ session });
    return event.itemImages;
  } catch (error) {
    console.error(`Error in updateEventImage: ${error.message}`);
    throw new Error(`Failed to update event image: ${error.message}`);
  }
};

const updateCommunityImage = async (param) => {
  const { userId, communityId, fileNames, session } = param;
  console.log("fileNames", fileNames);
  try {
    const community = await Community.findOne({
      _id: communityId,
      communityAdminId: userId,
    }).session(session);
    if (!community) {
      throw new Error("Community not found");
    }
    const imageUrl = generateCommunityPublicUrl(fileNames, userId);
    community.communityImage = imageUrl;
    await community.save({ session });
    return community.communityImage;
  } catch (error) {
    console.error(`Error in updateCommunityImage: ${error.message}`);
    throw new Error(`Failed to update community image: ${error.message}`);
  }
};

const updateGroupImage = async (param) => {
  const { groupId, fileNames, session } = param;
  try {
    const group = await Group.findById(groupId).session(session);
    if (!group) {
      throw new Error("Group not found for the user.");
    }
    const imageUrl = generateGroupPublicUrl(fileNames, groupId);
    group.groupImage = imageUrl;
    await group.save({ session });
    return group.groupImage;
  } catch (error) {
    console.error(`Error in updateGroupImage: ${error.message}`);
    throw new Error(`Failed to update group image: ${error.message}`);
  }
};

const updateReportProblemImage = async (param) => {
  const { userId, reportId, fileNames, session } = param;
  try {
    const report = await Report.findOne({
      _id: reportId,
      userId,
      reportType: "other",
    }).session(session);
    if (!report) {
      throw new Error("report not found for the user.");
    }
    const imageUrl = generateReportPublicUrl(fileNames, userId);
    report.itemImages.push(imageUrl);
    await report.save({ session });
    return report.itemImages;
  } catch (error) {
    console.error(`Error in updateReportProblemImage: ${error.message}`);
    throw new Error(`Failed to update reportProblem image: ${error.message}`);
  }
};

const updateBannerImage = async (param) => {
  const { userId, bannerId, fileNames, session } = param;
  try {
    const banner = await Banner.findOne({
      _id: bannerId,
      userId,
    }).session(session);
    if (!banner) {
      throw new Error("Banner not found");
    }
    const imageUrl = generateBannerPublicUrl(fileNames, userId);
    banner.bannerImage = imageUrl;
    await banner.save({ session });
    return banner.bannerImage;
  } catch (error) {
    console.error(`Error in updateBannerImage: ${error.message}`);
    throw new Error(`Failed to update banner image: ${error.message}`);
  }
};

const getAllGiveawaysPost = async (req, param) => {
  try {
    const pageSize = param.perPage;
    const page = param.page;
    const baseQuery = {
      isSold: false,
      isDeleted: false,
      ...(Array.isArray(req.blockedUserIds) && req.blockedUserIds.length > 0
        ? { userId: { $nin: req.blockedUserIds.map(id => new mongoose.Types.ObjectId(id)) } }
        : {}),
    };

    const totalCount = await Giveaway.countDocuments(baseQuery);
    const totalPages = Math.ceil(totalCount / pageSize);
    if (page > totalPages) {
      return { giveaways: [], totalPages };
    }
    const skip = (page - 1) * pageSize;
    const giveaways = await Giveaway.find(baseQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .select("_id userId adsId title description itemImages region totalViews name createdAt")
      .exec();

    return { giveaways, totalPages, totalCount };
  } catch (error) {
    console.log("error in getAllGiveawayPost", error.message);
    return false;
  }
};

const getAllMarketPlacePost = async (req, param) => {
  try {
    const pageSize = param.perPage;
    const page = param.page;

    const baseQuery = {
      isSold: false,
      isDeleted: false,
      ...(Array.isArray(req.blockedUserIds) && req.blockedUserIds.length > 0
        ? { userId: { $nin: req.blockedUserIds.map(id => new mongoose.Types.ObjectId(id)) } }
        : {}),
    };
    const totalCount = await Marketplace.countDocuments(baseQuery);

    const totalPages = Math.ceil(totalCount / pageSize);
    if (page > totalPages) {
      return { marketplaces: [], totalPages };
    }
    const skip = (page - 1) * pageSize;
    const marketplaces = await Marketplace.find(baseQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .select(
        "_id userId adsId title description itemImages region totalViews price name createdAt"
      )
      .exec();

    return { marketplaces, totalPages, totalCount };
  } catch (error) {
    console.log("error in getAllMarketplacePost", error.message);
    return false;
  }
};

/**
 * Builds a filter object that restricts ads to the user's country OR a specific radius.
 */
const buildLocationFilter = (param) => {
  const constants = require("../../constants/constants.js");
  const { latitude, longitude, country } = param;
  if (!latitude && !longitude && !country) return { _id: null };

  const orConditions = [];
  if (country) orConditions.push({ country: country });
  if (latitude && longitude) {
    const userLocation = [parseFloat(longitude), parseFloat(latitude)];
    const maxDistanceInRadians = constants.location.reach / constants.location.radian;
    orConditions.push({
      "location.coordinates": { $geoWithin: { $centerSphere: [userLocation, maxDistanceInRadians] } },
    });
  }
  return orConditions.length > 0 ? { $or: orConditions } : { _id: null };
};

const getAllAccomodationPost = async (req, param) => {
  try {
    const pageSize = param.perPage;
    const page = param.page;

    const locationFilter = buildLocationFilter(param);

    const baseQuery = {
      isSold: false,
      isDeleted: false,
      ...locationFilter,
      ...(Array.isArray(req.blockedUserIds) && req.blockedUserIds.length > 0
        ? { userId: { $nin: req.blockedUserIds.map(id => new mongoose.Types.ObjectId(id)) } }
        : {}),
    };
    const totalCount = await Accomodation.countDocuments(baseQuery);
    const totalPages = Math.ceil(totalCount / pageSize);
    if (page > totalPages) {
      return { accomodations: [], totalPages };
    }
    const skip = (page - 1) * pageSize;
    const accomodations = await Accomodation.find(baseQuery)
      .sort({ priorityScore: -1, createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .select(
        "_id userId adsId title description propertyType itemImages bedType price region totalViews name createdAt isBoosted isFeaturedBanner priorityScore"
      )
      .exec();

    return { accomodations, totalPages, totalCount };
  } catch (error) {
    console.log("error in getAllAccomodationPost", error.message);
    return false;
  }
};

const getAllEventPost = async (req, param) => {
  try {
    const pageSize = param.perPage;
    const page = param.page;

    const filter = {
      isEventCompleted: false,
      isDeleted: false,
      ...(Array.isArray(req.blockedUserIds) && req.blockedUserIds.length > 0
        ? { userId: { $nin: req.blockedUserIds.map(id => new mongoose.Types.ObjectId(id)) } }
        : {})

    }
    const totalCount = await Event.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / pageSize);
    if (page > totalPages) {
      return { events: [], totalPages };
    }
    const skip = (page - 1) * pageSize;
    const events = await Event.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .select(
        "_id userId adsId title description itemImages date eventStatus entryType amount region totalViews totalParticipants name createdAt"
      )
      .exec();

    return { events, totalPages, totalCount };
  } catch (error) {
    console.log("error in getAllEventPost", error.message);
    return false;
  }
};

const getAllGroup = async (param) => {
  try {
    const pageSize = param.perPage;
    const page = param.page;
    const communityId = param.communityId;
    const myUserId = param.myUserId;
    const totalGroups = await Group.countDocuments({ isDeleted: false });
    const totalPages = Math.ceil(totalGroups / pageSize);
    if (page > totalPages) {
      return { groups: [], totalPages };
    }
    const skip = (page - 1) * pageSize;
    // const groups = await Group.find({ communityId, members: {$nin: [myUserId]}, isDeleted: false })
    //   .sort({ isCreatedByAdmin: -1, createdAt: -1 })
    //   .select("_id name groupName groupDescription communityCategory groupCategory isPrivate groupImage adminId communityId totalMembers createdAt")
    //   .skip(skip)
    //   .limit(pageSize)
    //   .exec();

    const adminGroups = await Group.find({
      communityId,
      members: { $nin: [myUserId] },
      isDeleted: false,
      isCreatedByAdmin: true,
    })
      .select(
        "_id name groupName groupDescription communityCategory groupCategory isPrivate groupImage adminId communityId totalMembers createdAt"
      )
      .exec();

    const otherGroups = await Group.find({
      communityId,
      members: { $nin: [myUserId] },
      isDeleted: false,
      isCreatedByAdmin: false,
    })
      .sort({ createdAt: -1 })
      .select(
        "_id name groupName groupDescription communityCategory groupCategory isPrivate groupImage adminId communityId totalMembers createdAt"
      )
      .skip(skip)
      .limit(pageSize - adminGroups.length)
      .exec();

    const groups = [...adminGroups, ...otherGroups];

    return { groups, totalGroups, totalPages };
  } catch (error) {
    console.log("error in getAllGroups", error.message);
    return false;
  }
};

const getNotifyAdsId = async (adsId) => {
  try {
    const adsPost = await AdsPost.findById(adsId);
    if (!adsPost) {
      return false;
    }
    let post;
    if (adsPost.adsType === "Giveaway") {
      post = await Giveaway.findOne({ adsId });
    } else if (adsPost.adsType === "Marketplace") {
      post = await Marketplace.findOne({ adsId });
    } else if (adsPost.adsType === "Accomodation") {
      post = await Accomodation.findOne({ adsId });
    } else if (adsPost.adsType === "Event") {
      post = await Event.findOne({ adsId });
    } else {
      return false;
    }
    const adsNotifyId = post._id;
    return adsNotifyId;
  } catch (error) {
    return false;
  }
};

module.exports = {
  getAllGiveawaysPost,
  getAllMarketPlacePost,
  getAllAccomodationPost,
  getAllEventPost,
  getAllGroup,
  updateProfileImage,
  updateProfileImageAdmin,
  updateCoverImage,
  updateGiveawayImage,
  updateMarketplaceImage,
  updateAccomodationImage,
  updateEventImage,
  updateCommunityImage,
  updateGroupImage,
  updateReportProblemImage,
  updateBannerImage,
  getNotifyAdsId,
};
