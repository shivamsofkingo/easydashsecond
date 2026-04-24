const { default: mongoose } = require("mongoose");
const Accomodation = require("../../models/accomodation.js");
const constants = require("../../constants/constants.js");

/**
 * Builds a filter object that restricts ads to the user's country OR a specific radius.
 * @param {Object} param - Contains latitude, longitude, and country.
 * @returns {Object} - MongoDB filter part.
 */
const buildLocationFilter = (param) => {
  const { latitude, longitude, country } = param;
  // If no location info is provided, we return a filter that matches nothing 
  // to enforce strict local-only visibility as per user request.
  if (!latitude && !longitude && !country) {
    return { _id: null }; 
  }

  const orConditions = [];
  if (country) {
    orConditions.push({ country: country });
  }
  if (latitude && longitude) {
    const userLocation = [parseFloat(longitude), parseFloat(latitude)];
    const maxDistanceInRadians = constants.location.reach / constants.location.radian;
    orConditions.push({
      "location.coordinates": {
        $geoWithin: {
          $centerSphere: [userLocation, maxDistanceInRadians],
        },
      },
    });
  }

  return orConditions.length > 0 ? { $or: orConditions } : { _id: null };
};

const getAllPostByPropertyType = async (req, param) => {
  try {
    const propertyType = param.propertyType;
    const pageSize = param.perPage;
    const page = param.page;

    const locationFilter = buildLocationFilter(param);

    const filter = {
      propertyType: propertyType,
      isDeleted: false,
      isSold: false,
      ...locationFilter,
      ...(Array.isArray(req.blockedUserIds) && req.blockedUserIds.length > 0
        ? { userId: { $nin: req.blockedUserIds.map(id => new mongoose.Types.ObjectId(id)) } }
        : {})
    }
    const totalCount = await Accomodation.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / pageSize);
    if (page > totalPages) {
      return { accomodations: [], totalPages };
    }
    const skip = (page - 1) * pageSize;
    const accomodations = await Accomodation.find(filter)
      .sort({ priorityScore: -1, createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .exec();

    return { accomodations, totalPages, totalCount };
  } catch (error) {
    console.log("error in getAllPostByPropertyType", error.message);
    return false;
  }
};

const getAllPostByRoomType = async (req, param) => {
  try {
    const roomType = param.roomType;
    const pageSize = param.perPage;
    const page = param.page;

    const locationFilter = buildLocationFilter(param);

    const filter = {
      roomType: { $in: Array.isArray(roomType) ? roomType : [roomType] },
      isDeleted: false,
      isSold: false,
      ...locationFilter,
      ...(Array.isArray(req.blockedUserIds) && req.blockedUserIds.length > 0
        ? { userId: { $nin: req.blockedUserIds.map(id => new mongoose.Types.ObjectId(id)) } }
        : {})
    }
    const totalCount = await Accomodation.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / pageSize);
    if (page > totalPages) {
      return { accomodations: [], totalPages };
    }
    const skip = (page - 1) * pageSize;
    const accomodations = await Accomodation.find(filter)
      .sort({ priorityScore: -1, createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .exec();

    return { accomodations, totalPages, totalCount };
  } catch (error) {
    console.log("error in getAllPostByRoomType", error.message);
    return false;
  }
};

const getAllPostByBedType = async (req, param) => {
  try {
    const bedType = param.bedType;
    const pageSize = param.perPage;
    const page = param.page;

    const locationFilter = buildLocationFilter(param);

    const filter = {
      bedType: { $in: Array.isArray(bedType) ? bedType : [bedType] },
      isDeleted: false,
      isSold: false,
      ...locationFilter,
      ...(Array.isArray(req.blockedUserIds) && req.blockedUserIds.length > 0
        ? { userId: { $nin: req.blockedUserIds.map(id => new mongoose.Types.ObjectId(id)) } }
        : {})
    }
    const totalCount = await Accomodation.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / pageSize);
    if (page > totalPages) {
      return { accomodations: [], totalPages };
    }
    const skip = (page - 1) * pageSize;
    const accomodations = await Accomodation.find(filter)
      .sort({ priorityScore: -1, createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .exec();

    return { accomodations, totalPages, totalCount };
  } catch (error) {
    console.log("error in getAllPostByBedType", error.message);
    return false;
  }
};

const getFeaturedBannerPosts = async (param) => {
  try {
    const pageSize = param.perPage;
    const page = param.page;

    const locationFilter = buildLocationFilter(param);

    const filter = {
      isFeaturedBanner: true,
      isDeleted: false,
      isSold: false,
      ...locationFilter
    };
    const totalCount = await Accomodation.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / pageSize);
    if (page > totalPages) {
      return { accomodations: [], totalPages };
    }
    const skip = (page - 1) * pageSize;
    const accomodations = await Accomodation.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .exec();

    return { accomodations, totalPages, totalCount };
  } catch (error) {
    console.log("error in getFeaturedBannerPosts", error.message);
    return false;
  }
};

const getBoostedAdsPosts = async (param) => {
  try {
    const pageSize = param.perPage;
    const page = param.page;

    const locationFilter = buildLocationFilter(param);

    const filter = {
      isBoosted: true,
      isDeleted: false,
      isSold: false,
      boostExpiresAt: { $gt: new Date() },
      ...locationFilter
    };
    const totalCount = await Accomodation.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / pageSize);
    if (page > totalPages) {
      return { accomodations: [], totalPages };
    }
    const skip = (page - 1) * pageSize;
    // Boosted ads sorted by priority score then date
    const accomodations = await Accomodation.find(filter)
      .sort({ priorityScore: -1, createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .exec();

    return { accomodations, totalPages, totalCount };
  } catch (error) {
    console.log("error in getBoostedAdsPosts", error.message);
    return false;
  }
};

module.exports = {
  getAllPostByPropertyType,
  getAllPostByRoomType,
  getAllPostByBedType,
  getFeaturedBannerPosts,
  getBoostedAdsPosts
};
