const Giveaway = require("../../models/giveaways.js");
const Marketplace = require("../../models/marketplace.js");
const Accommodation = require("../../models/accomodation.js");
const Event = require("../../models/event.js");
const AdsPost = require("../../models/adsPost.js");
const User = require("../../models/users.js");
const Report = require("../../models/report.js");
const Community = require("../../models/community.js");
const Admin = require("../../models/admin.js");
const Booking = require("../../models/Booking.js");
const Reviews = require("../../models/reviews.js");
const {
  hasPermission,
  getAllGiveawaysPost,
  getAllMarketPlacePost,
  getAllAccomodationPost,
  getAllEventPost,
  isValidObjectId,
  getDeletedGiveaways,
  getDeletedAccommodation,
  getDeletedMarketplace,
  getDeletedEvents,
  getBoostedAccommodations
} = require("../utilities.js");

const constants = require("../../constants/constants.js");
const { adminLogger } = require("../../config/loggerConfig.js");
const { deleteGiveawayImages } = require("../../utils/fileUpload/file.js");

const getGiveawaysCount = async (req, res) => {
  const myUserId = req.user._id;
  try {
    if (!myUserId) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const totalGiveaways = await Giveaway.countDocuments({ isDeleted: false });
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        totalGiveaways,
      },
    });
  } catch (error) {
    adminLogger.error(`error in getGiveawaysCount: ${error.message}`, {error});
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getMarketplaceCount = async (req, res) => {
  const myUserId = req.user._id;
  try {
    if (!myUserId) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const totalMarketplace = await Marketplace.countDocuments({ isDeleted: false });
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        totalMarketplace,
      },
    });
  } catch (error) {
    adminLogger.error(`error in getMarketplaceCount: ${error.message}`, {error});
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getAccommodationCount = async (req, res) => {
  const myUserId = req.user._id;
  try {
    if (!myUserId) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const totalAccommodation = await Accommodation.countDocuments({ isDeleted: false });
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        totalAccommodation,
      },
    });
  } catch (error) {
    adminLogger.error(`error in getAccommodation: ${error.message}`, {error});
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getEventCount = async (req, res) => {
  const myUserId = req.user._id;
  try {
    if (!myUserId) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const totalEvent = await Event.countDocuments({ isDeleted: false });
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        totalEvent,
      },
    });
  } catch (error) {
    adminLogger.error(`error in getEventCount: ${error.message}`, {error});
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getTotalAds = async (req, res) => {
  const myUserId = req.user._id;
  try {
    if (!myUserId) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    let givaewayCount = await Giveaway.countDocuments({ isDeleted: false });
    let marketplaceCount = await Marketplace.countDocuments({ isDeleted: false });
    let accommodationCount = await Accommodation.countDocuments({ isDeleted: false });
    let eventCount = await Event.countDocuments({ isDeleted: false });
    let totalAdsCount =
      givaewayCount + marketplaceCount + accommodationCount + eventCount;
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        totalAdsCount,
      },
    });
  } catch (error) {
    adminLogger.error(`error in getTotalAds: ${error.message}`, {error});
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getAdsCountByMonths = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const myUserId = req.user?._id;
  try {
    if (!myUserId) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "Unauthorized request",
        payload: {},
      });
    }
    const skip = (page - 1) * limit;
    const pipeline = [
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
    ];
    const [accommodationData, giveawayData, marketplaceData, eventData] =
      await Promise.all([
        Accommodation.aggregate(pipeline),
        Giveaway.aggregate(pipeline),
        Marketplace.aggregate(pipeline),
        Event.aggregate(pipeline),
      ]);
    const combinedData = [
      ...accommodationData,
      ...giveawayData,
      ...marketplaceData,
      ...eventData,
    ];
    const groupedData = combinedData.reduce((acc, item) => {
      const key = `${item._id.year}-${item._id.month}`;
      if (!acc[key]) {
        acc[key] = { year: item._id.year, month: item._id.month, count: 0 };
      }
      acc[key].count += item.count;
      return acc;
    }, {});
    const sortedData = Object.values(groupedData).sort((a, b) => {
      return b.year === a.year ? b.month - a.month : b.year - a.year;
    });
    const paginatedData = sortedData.slice(skip, skip + parseInt(limit));
    return res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "Success",
      payload: {
        data: paginatedData,
        meta: {
          total: sortedData.length,
          page: parseInt(page),
          limit: parseInt(limit),
        },
      },
    });
  } catch (error) {
    adminLogger.error(`error in getAdsCountByMonths: ${error.message}`, {error});
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Internal Server Error",
      payload: {},
    });
  }
};

const getAllAds = async (req, res) => {
  const {
    pages = 1,
    limit = 10,
    type = "all",
    search = "",
    region = "",
    sortBy = "createdAt",
    order = "desc",
  } = req.query;
  const adsPerPage = parseInt(limit, 10);
  const pageNumber = parseInt(pages, 10);
  const sortOrder = order === "desc" ? -1 : 1;
  const myUserId = req.user._id;
  try {
    if (!myUserId) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "Unauthorized request",
        payload: {},
      });
    }
    if (
      isNaN(pageNumber) ||
      isNaN(adsPerPage) ||
      pageNumber < 1 ||
      adsPerPage < 1
    ) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Invalid pagination parameters",
        payload: {},
      });
    }

    const filter = {};
    if (region) {
      filter.region = region;
    }
    if (search) {
      filter.$text = { $search: search };
    }

    const projection = {
      title: 1,
      description: 1,
      itemImages: 1,
      price: 1,
      region: 1,
      userId: 1,
      email: 1,
      createdAt: 1,
    };

    let ads = [];

    if (type === "all" || type === "giveaways") {
      const giveaways = await Giveaway.find(filter).select(projection).lean();
      ads = ads.concat(giveaways.map((ad) => ({ ...ad, adType: "giveaways" })));
    }
    if (type === "all" || type === "marketplace") {
      const marketplaceAds = await Marketplace.find(filter)
        .select(projection)
        .lean();
      ads = ads.concat(
        marketplaceAds.map((ad) => ({ ...ad, adType: "marketplace" }))
      );
    }
    if (type === "all" || type === "accommodation") {
      const accommodations = await Accommodation.find(filter)
        .select(projection)
        .lean();
      ads = ads.concat(
        accommodations.map((ad) => ({ ...ad, adType: "accommodation" }))
      );
    }
    if (type === "all" || type === "event") {
      const events = await Event.find(filter).select(projection).lean();
      ads = ads.concat(events.map((ad) => ({ ...ad, adType: "event" })));
    }

    ads.sort((a, b) => {
      if (sortBy === "createdAt") {
        return sortOrder * (new Date(b.createdAt) - new Date(a.createdAt));
      }
      return sortOrder * (b[sortBy] - a[sortBy]);
    });

    const startIndex = (pageNumber - 1) * adsPerPage;
    const totalAds = ads.length;
    const totalPages = Math.ceil(totalAds / adsPerPage);
    const paginatedAds = ads.slice(startIndex, startIndex + adsPerPage);
    return res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        ads: paginatedAds,
        meta: {
          currentPage: pageNumber,
          adsPerPage,
          totalAds: ads.length,
          totalPages,
        },
      },
    });
  } catch (error) {
    adminLogger.error(`error in getAllAds: ${error.message}`, {error});
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

const getAllGiveaways = async (req, res) => {
  const { pages } = req.query;
  const myUserId = req.user._id;
  try {
    const param = {
      perPage: 16,
      page: parseInt(pages, 10) || 1,
    };
    if (param.page < 1) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Invalid page number",
        payload: {},
      });
    }
    const data = await getAllGiveawaysPost(param);
    if (data === false) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "internal server error",
        payload: {},
      });
    }
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        giveaways: data.giveaways,
        meta: {
          totalPages: data.totalPages,
          totalCount: data.totalCount,
          currentPage: param.page,
        },
      },
    });
  } catch (error) {
    adminLogger.error(`error in getAllGiveaways: ${error.message}`, {error});
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      paylaod: {},
    });
  }
};

const searchAds = async (req, res) => {
  const { adsType, keyword, page = 1, limit = 15 } = req.query;
  const myUserId = req.user._id;

  try {
    if (!keyword) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        message: "Keyword is required for search",
        payload: {},
      });
    }
    const searchCriteria = {
      isDeleted: false,
      $or: [
        { title: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } },
        ...(isValidObjectId(keyword) ? [{ _id: keyword }] : []),
      ],
    };
    const options = {
      skip: (page - 1) * limit,
      limit: parseInt(limit),
    };
    let post;
    if (adsType === "Giveaway") {
      post = await Giveaway.find(searchCriteria, null, options).lean();
    } else if (adsType === "Marketplace") {
      post = await Marketplace.find(searchCriteria, null, options).lean();
    } else if (adsType === "Accommodation") {
      post = await Accommodation.find(searchCriteria, null, options).lean();
    } else if (adsType === "Event") {
      post = await Event.find(searchCriteria, null, options).lean();
    } else {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Invalid adsType",
        payload: {},
      });
    }

    const totalCount = await (adsType === "Giveaway"
      ? Giveaway
      : adsType === "Marketplace"
      ? Marketplace
      : adsType === "Accommodation"
      ? Accommodation
      : Event
    ).countDocuments(searchCriteria);

    return res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "Success",
      payload: {
        results: post,
        meta: {
          currentPage: parseInt(page),
          adsPerPage: parseInt(limit),
          totalResults: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    adminLogger.error(`error in searchAds: ${error.message}`, {error});
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

const deleteGiveawayPost = async (req, res) => {
  const session = await Giveaway.startSession();
  session.startTransaction();
  const { adsId } = req.query;
  const myUserId = req.user._id;
  try {
    if (!adsId) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    if (!myUserId) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const adsPost = await AdsPost.findById(adsId).session(session);
    if (!adsPost) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "ad not found",
        payload: {},
      });
    }
    const post = await Giveaway.findOne({ adsId }).session(session);
    if (!post) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "post not found",
        payload: {},
      });
    }
    const user = await Admin.findById(myUserId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "user not found",
        payload: {},
      });
    }
    const report = await Report.findOne({ adsId: post._id }).session(session);
    if (report) {
      report.isDeleted = true
      await report.save({ session });
    }
    // await Giveaway.findOneAndDelete({ adsId }).session(session);
    post.isDeleted = true;
    user.totalAdsPosted = user.totalAdsPosted - 1;
    await post.save({ session });
    await user.save({ session });
    await session.commitTransaction();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {},
    });
  } catch (error) {
    await session.abortTransaction();
    adminLogger.error(`error in deleteGiveawayPost: ${error.message}`, {error});
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  } finally {
    session.endSession();
  }
};

const getAllMarketplace = async (req, res) => {
  const { pages } = req.query;
  try {
    const param = {
      perPage: 16,
      page: parseInt(pages, 10) || 1,
    };
    if (param.page < 1) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Invalid page number",
        payload: {},
      });
    }
    const data = await getAllMarketPlacePost(param);
    if (data === false) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "internal server error",
        payload: {},
      });
    }
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        marketplaces: data.marketplaces,
        meta: {
          totalPages: data.totalPages,
          totalCount: data.totalCount,
          currentPage: param.page,
        },
      },
    });
  } catch (error) {
    adminLogger.error(`error in getAllMarketplace: ${error.message}`, {error});
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      paylaod: {},
    });
  }
};

const deleteMarketplacePost = async (req, res) => {
  const session = await Marketplace.startSession();
  session.startTransaction();
  const { adsId } = req.query;
  const myUserId = req.user._id;
  try {
    if (!adsId) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    if (!myUserId) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const adsPost = await AdsPost.findById(adsId).session(session);
    if (!adsPost) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "ad not found",
        payload: {},
      });
    }
    const post = await Marketplace.findOne({ adsId }).session(session);
    if (!post) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "post not found",
        payload: {},
      });
    }
    const user = await Admin.findById(myUserId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "user not found",
        payload: {},
      });
    }
    const report = await Report.findOne({ adsId: post._id }).session(session);
    if (report) {
      report.isDeleted = true;
      await report.save({ session });
    }
    // await Marketplace.findOneAndDelete({ adsId }).session(session);
    // await AdsPost.findByIdAndDelete(adsPost._id).session(session);
    post.isDeleted = true;
    user.totalAdsPosted = user.totalAdsPosted - 1;
    await post.save({ session });
    await user.save({ session });
    await session.commitTransaction();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {},
    });
  } catch (error) {
    adminLogger.error(`error in deleteMarketplacePost: ${error.message}`, {error});
    await session.abortTransaction();
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  } finally {
    session.endSession();
  }
};

const getAllAccommodation = async (req, res) => {
  const { pages, region } = req.query;
  try {
    const param = {
      perPage: 16,
      page: parseInt(pages, 10) || 1,
      region
    };
    if (param.page < 1) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Invalid page number",
        payload: {},
      });
    }
    const data = await getAllAccomodationPost(param);
    
    if (data === false) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "internal server error",
        payload: {},
      });
    }
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        accommodations: data.accomodations,
        meta: {
          totalPages: data.totalPages,
          totalCount: data.totalCount,
          currentPage: param.page,
        },
      },
    });
  } catch (error) {
    console.log("error in getAllAccomodation", error.message);
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      paylaod: {},
    });
  }
};

const getAccommodationRegions = async (req, res) => {
  try {
    const regions = await Accommodation.distinct("region", { isDeleted: false, isSold: false });
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        regions: regions.filter(r => r) // Remove empty/null values
      }
    });
  } catch (error) {
    adminLogger.error(`error in getAccommodationRegions: ${error.message}`, {error});
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const deleteAccommodationPost = async (req, res) => {
  const session = await Accommodation.startSession();
  session.startTransaction();
  const { adsId } = req.query;
  const myUserId = req.user._id;
  try {
    if (!adsId) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    if (!myUserId) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const adsPost = await AdsPost.findById(adsId).session(session);
    if (!adsPost) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "ad not found",
        payload: {},
      });
    }
    const post = await Accommodation.findOne({ adsId }).session(session);
    if (!post) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "post not found",
        payload: {},
      });
    }
    const user = await Admin.findById(myUserId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "user not found",
        payload: {},
      });
    }
    const report = await Report.findOne({ adsId: post._id }).session(session);
    if(report) {
      report.isDeleted = true
      await report.save({ session });
    }
    post.isDeleted = true;
    user.totalAdsPosted = user.totalAdsPosted - 1;
    await post.save({ session });
    await user.save({ session });
    await session.commitTransaction();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {},
    });
  } catch (error) {
    await session.abortTransaction();
    adminLogger.error(`error in deleteAccommodationPost: ${error.message}`, {error});
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  } finally {
    session.endSession();
  }
};

const getAllEvent = async (req, res) => {
  const { pages } = req.query;
  try {
    const param = {
      perPage: 16,
      page: parseInt(pages, 10) || 1,
    };
    if (param.page < 1) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Invalid page number",
        payload: {},
      });
    }
    const data = await getAllEventPost(param);
    if (data === false) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "internal server error",
        payload: {},
      });
    }
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        events: data.events,
        meta: {
          totalPages: data.totalPages,
          totalCount: data.totalCount,
          currentPage: param.page,
        },
      },
    });
  } catch (error) {
    console.log("error in getAllEventPostList", error.message);
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const deleteEventPost = async (req, res) => {
  const session = await Event.startSession();
  session.startTransaction();
  const { adsId } = req.query;
  const myUserId = req.user._id;
  try {
    if (!adsId) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    if (!myUserId) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const adsPost = await AdsPost.findById(adsId).session(session);
    if (!adsPost) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "ad not found",
        payload: {},
      });
    }
    const post = await Event.findOne({ adsId }).session(session);
    if (!post) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "post not found",
        payload: {},
      });
    }
    const user = await Admin.findById(myUserId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "user not found",
        payload: {},
      });
    }
    const report = await Report.findOne({ adsId: post._id }).session(session);
    if(report) {
      report.isDeleted = true
      await report.save({ session });
    }
    post.isDeleted = true;
    user.totalAdsPosted = user.totalAdsPosted - 1;
    await post.save({ session });
    await user.save({ session });
    await session.commitTransaction();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {},
    });
  } catch (error) {
    await session.abortTransaction();
    adminLogger.error(`error in deleteEvents: ${error.message}`, {error});
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  } finally {
    session.endSession();
  }
};

const getGroupsCountInCoummunitites = async (req, res) => {
  const myUserId = req.user._id;
  try {
    if (!myUserId) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const communities = await Community.find().select("category totalGroups");
    if (!communities) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "internal server error",
        payload: {},
      });
    }
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        results: communities,
      },
    });
  } catch (error) {
    adminLogger.error(`error in getGroupCountInCommunities: ${error.message}`, {error});
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getDeletedGiveawayAds = async (req, res) => {
  const { pages = 1, limit = 16 } = req.query;
  const myUserId = req.user._id;
  try {
    if (!myUserId) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const param = {
      perPage: parseInt(limit, 10) || 16,
      page: parseInt(pages, 10) || 1,
    };
    const data = await getDeletedGiveaways(param);
    if (data === false) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "internal server error",
        payload: {},
      });
    }
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        giveaways: data.giveaways,
        meta: {
          currentPage: param.page,
          totalCount: data.totalCount,
          totalPages: data.totalPages,
        },
      },
    });
  } catch (error) {
    adminLogger.error(`error in getDeletedGiveawayAds: ${error.message}`, {error});
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getDeletedMarketplaceAds = async (req, res) => {
  const { pages = 1, limit = 16 } = req.query;
  const myUserId = req.user._id;
  try {
    if (!myUserId) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const param = {
      perPage: parseInt(limit, 10) || 16,
      page: parseInt(pages, 10) || 1,
    };
    const data = await getDeletedMarketplace(param);
    if (data === false) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "internal server error",
        paylaod: {},
      });
    }
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        marketplaces: data.marketplaces,
        meta: {
          currentPage: param.page,
          totalCount: data.totalCount,
          totalPages: data.totalPages,
        },
      },
    });
  } catch (error) {
    adminLogger.error(`error in getDeletedMarketplaceAds: ${error.message}`, {error});
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getDeletedAccommodationAds = async (req, res) => {
  const { pages = 1, limit = 16 } = req.query;
  const myUserId = req.user._id;
  try {
    if (!myUserId) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const param = {
      perPage: parseInt(limit, 10) || 16,
      page: parseInt(pages, 10) || 1,
    };
    const data = await getDeletedAccommodation(param);
    if (data === false) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "internal server error",
        payload: {},
      });
    }
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        accommodations: data.accommodations,
        meta: {
          currentPage: param.page,
          totalCount: data.totalCount,
          totalPages: data.totalPages,
        },
      },
    });
  } catch (error) {
    adminLogger.error(`error in getDeletedAccommodations: ${error.message}`, {error});
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getDeletedEventsAds = async (req, res) => {
  const { pages = 1, limit = constants.perPage.pageLimit16 } = req.query;
  const myUserId = req.user._id;
  try {
    if (!myUserId) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const param = {
      perPage: parseInt(limit, 10) || 16,
      page: parseInt(pages, 10) || 1,
    };
    const data = await getDeletedEvents(param);
    if (data === false) {
      res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "internal server error",
        payload: {},
      });
    }
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        events: data.events,
        meta: {
          currentPage: param.page,
          totalCount: data.totalCount,
          totalPages: data.totalPages,
        },
      },
    });
  } catch (error) {
    adminLogger.error(`error in getDeletedEventsAds: ${error.message}`, {error});
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const restoreAds = async (req, res) => {
  const { postId, adsType } = req.body;
  try {
    if(!postId || !adsType) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {}
      });
    }
    let post;
    if(adsType === "Giveaway") {
      post = await Giveaway.findById(postId);
    } else if(adsType === "Marketplace") {
      post = await Marketplace.findById(postId);
    } else if(adsType === "Accommodation") {
      post = await Accommodation.findById(postId);
    } else if(adsType === "Event") {
      post = await Event.findById(postId);
    } else {
      return res.status(constants.httpStatus.validationError).json({
        status: 0,
        msg: "invalid ads type",
        payload: {}
      });
    }
    if(!post || post === null) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "ad post not found"
      });
    }
    if(post.isDeleted === false) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "ad already restored",
        paylaod: {}
      });
    }
    post.isDeleted = false;
    await post.save();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {}
    });
  } catch (error) {
    adminLogger.error(`error in restoreAds: ${error.message}`, {error});
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
}

const removeAds = async (req, res) => {
  const session = await AdsPost.startSession();
  session.startTransaction();
  const { adsId, adsType } = req.query;
  try {
    if(!adsId || !adsType) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const adsPost = await AdsPost.findById(adsId).session(session);
    if(!adsPost) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "adPost not found",
        payload: {},
      });
    }
    let post;
    if(adsType === constants.adsType.giveaway) {
      post = await Giveaway.findOne({ adsId }).session(session);
    } else if(adsType === constants.adsType.marketplace) {
      post = await Marketplace.findOne({ adsId }).session(session);
    } else if(adsType === constants.adsType.accommodation) {
      post = await Accommodation.findOne({ adsId }).session(session);
    } else if(adsType === constants.adsType.event) {
      post = await Event.findOne({ adsId }).session(session);
    } else {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "adPost not found",
        payload: {},
      });
    }
    if(!post || post === null) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "post not found",
        payload: {},
      });
    }
    await adsPost.deleteOne({ session });
    await post.deleteOne({ session });
    await session.commitTransaction();
    await deleteGiveawayImages(post.itemImages, post.userId);
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {}
    });
  } catch (error) {
    await session.abortTransaction();
    adminLogger.error(`error in removeGiveawayAds: ${error.message}`, {error});
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  } finally {
    session.endSession();
  }
}

const getEventDashboardStats = async (req, res) => {
  const myUserId = req.user._id;
  try {
    if (!myUserId) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }

    const today = new Date();
    
    const [
      totalEvents,
      upcomingEvents,
      canceledEvents,
      ticketsData,
      refundData
    ] = await Promise.all([
      Event.countDocuments({ isDeleted: false }),
      Event.countDocuments({ isDeleted: false, date: { $gt: today } }),
      Event.countDocuments({ isDeleted: false, eventStatus: 'cancelled' }),
      Booking.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $unwind: "$tickets" },
        { $group: { _id: null, totalSold: { $sum: "$tickets.quantity" } } }
      ]),
      Booking.aggregate([
        { $match: { bookingStatus: 'refunded' } },
        { $group: { _id: null, totalRefunded: { $sum: "$final_amount" } } }
      ])
    ]);

    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        totalEvents,
        totalTicketsSold: ticketsData[0]?.totalSold || 0,
        pendingReview: 0, // Placeholder
        upcomingEvents,
        totalRefunds: refundData[0]?.totalRefunded || 0,
        canceledEvents
      },
    });
  } catch (error) {
    adminLogger.error(`error in getEventDashboardStats: ${error.message}`, {error});
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getAllEvents = async (req, res) => {
  const { pages = 1, type = "all" } = req.query;
  const myUserId = req.user._id;
  try {
    if (!myUserId) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const param = {
      perPage: 10,
      page: parseInt(pages, 10) || 1,
    };

    let filter = { isDeleted: false };
    const today = new Date();

    if (type === "upcoming") {
      filter.date = { $gt: today };
      filter.isEventCompleted = false;
    } else if (type === "past") {
      filter.$or = [
        { date: { $lt: today } },
        { isEventCompleted: true }
      ];
    } else if (type === "deleted") {
      filter.isDeleted = true;
    }

    const totalCount = await Event.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / param.perPage);
    const skip = (param.page - 1) * param.perPage;

    const events = await Event.find(filter)
      .populate({ path: 'userId', select: 'name' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(param.perPage)
      .lean();

    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        events,
        meta: {
          totalPages,
          totalCount,
          currentPage: param.page,
        },
      },
    });
  } catch (error) {
    adminLogger.error(`error in getAllEvents: ${error.message}`, {error});
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getAdDetailsById = async (req, res) => {
  const { adsId, adsType } = req.query;
  const myUserId = req.user._id;
  try {
    if (!myUserId) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    if (!adsId || !adsType) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }

    let ad;
    if (adsType === "Accommodation") {
      ad = await Accommodation.findOne({ adsId }).populate('userId', 'name email profileImage createdAt totalAdsPosted totalReports isActive isVerifiedPM');
    } else if (adsType === "Giveaway") {
      ad = await Giveaway.findOne({ adsId }).populate('userId', 'name email profileImage createdAt totalAdsPosted totalReports isActive');
    } else if (adsType === "Marketplace") {
      ad = await Marketplace.findOne({ adsId }).populate('userId', 'name email profileImage createdAt totalAdsPosted totalReports isActive');
    } else if (adsType === "Event") {
      ad = await Event.findOne({ adsId }).populate('userId', 'name email profileImage createdAt totalAdsPosted totalReports isActive');
    } else {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "invalid ads type",
        payload: {},
      });
    }

    if (!ad) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "ad not found",
        payload: {},
      });
    }

    // Fetch Reports for this Ad
    const reports = await Report.find({ adsId: ad._id, isDeleted: false }).populate('reportedBy', 'name email');

    // Fetch Reviews for this Ad
    const reviews = await Reviews.find({ adsId: ad.adsId }).populate('userId', 'name profileImage').sort({ createdAt: -1 });

    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        ad,
        reports,
        reviews
      },
    });
  } catch (error) {
    adminLogger.error(`error in getAdDetailsById: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getBoostedAccommodationAds = async (req, res) => {
  const { pages } = req.query;
  try {
    const param = {
      perPage: 16,
      page: parseInt(pages, 10) || 1,
    };
    if (param.page < 1) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Invalid page number",
        payload: {},
      });
    }
    const data = await getBoostedAccommodations(param);
    if (data === false) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "internal server error",
        payload: {},
      });
    }
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        accommodations: data.accommodations,
        meta: {
          totalPages: data.totalPages,
          totalCount: data.totalCount,
          currentPage: param.page,
        },
      },
    });
  } catch (error) {
    adminLogger.error(`error in getBoostedAccommodationAds: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

module.exports = {
  getGiveawaysCount,
  getMarketplaceCount,
  getAccommodationCount,
  getEventCount,
  getEventDashboardStats,
  getTotalAds,
  getAdsCountByMonths,
  getAllAds,
  searchAds,
  getAllGiveaways,
  deleteGiveawayPost,
  getAllMarketplace,
  deleteMarketplacePost,
  getAllAccommodation,
  deleteAccommodationPost,
  getAllEvents,
  getAllEvent,
  deleteEventPost,
  getGroupsCountInCoummunitites,
  getDeletedGiveawayAds,
  getDeletedMarketplaceAds,
  getDeletedAccommodationAds,
  getDeletedEventsAds,
  getBoostedAccommodationAds,
  restoreAds,
  removeAds,
  getAccommodationRegions,
  getAdDetailsById
};
