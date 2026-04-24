const Favourites = require("../models/favourites.js");
const Giveaway = require("../models/giveaways.js");
const Marketplace = require("../models/marketplace.js");
const Accomodation = require("../models/accomodation.js");
const Event = require("../models/event.js");
const constants = require("../constants/constants.js");
const { logger } = require("../config/loggerConfig.js");
const { default: mongoose } = require("mongoose");

const saveLikedPost = async (req, res) => {
  const session = await Favourites.startSession();
  session.startTransaction();
  const { adsId, adsType } = req.body;
  const myUserId = req.user._id;
  try {
    if (!adsId || !adsType) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Missing required fields: adsId and adsType",
        payload: {},
      });
    }
    const favourites = await Favourites.findOne({
      userId: myUserId,
      adsId,
    }).session(session);
    let post;
    if (adsType === "Giveaway") {
      post = await Giveaway.findById(adsId).session(session);
    } else if (adsType === "Marketplace") {
      post = await Marketplace.findById(adsId).session(session);
    } else if (adsType === "Accommodation") {
      post = await Accomodation.findById(adsId).session(session);
    } else if (adsType === "Event") {
      post = await Event.findById(adsId).session(session);
    } else {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Invalid adsType",
        payload: {},
      });
    }
    if (!post) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "Post not found",
        payload: {},
      });
    }
    post.totalLikes = post.totalLikes || 0;
    let newFavourites;
    let alreadyAdded = false;
    if (favourites) {
      post.totalLikes = Math.max(0, post.totalLikes - 1);
      await favourites.deleteOne({ session });
      alreadyAdded = true;
    } else {
      post.totalLikes += 1;
      newFavourites = await Favourites.create(
        [
          {
            userId: myUserId,
            adsId,
            adsType,
          },
        ],
        { session }
      );
    }
    await post.save({ session });
    await session.commitTransaction();
    return res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "Success",
      payload: {
        likedPost: alreadyAdded ? "removed from favourites" : newFavourites
      },
    });
  } catch (error) {
    logger.error(`Error in saveLikedPost: ${error.message}`, { error });
    await session.abortTransaction();
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  } finally {
    session.endSession();
  }
};

const getLikedPosts = async (req, res) => {
  const myUserId = req.user._id;
  const { page = 1, limit = constants.perPage.pageLimit16 } = req.query;
  const pages = parseInt(page, 10) || 1;
  const skip = (pages - 1) * limit;
  try {
    if (!myUserId) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "Unauthorized request",
        payload: {},
      });
    }
    const favourites = await Favourites.find({ userId: myUserId })
      .select("adsType adsId")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    if (!favourites || favourites.length === 0) {
      return res.status(constants.httpStatus.ok).json({
        status: 1,
        msg: "No liked posts found",
        payload: {},
      });
    }
    // blocked user filter (if any)
    const blockedFilter =
      Array.isArray(req.blockedUserIds) && req.blockedUserIds.length > 0
        ? { userId: { $nin: req.blockedUserIds.map(id => new mongoose.Types.ObjectId(id)) } }
        : {};

    const results = await Promise.all(
      favourites.map(async (fav) => {
        let details = null;
        if (fav.adsType === "Giveaway") {
          details = await Giveaway.findOne({ _id: fav.adsId, ...blockedFilter })
            .select("_id userId adsId title description itemImages totalViews name createdAt")
            .lean();
        } else if (fav.adsType === "Marketplace") {
          details = await Marketplace.findOne({ _id: fav.adsId, ...blockedFilter })
            .select("_id userId adsId title description itemImages totalViews price name createdAt")
            .lean();
        } else if (fav.adsType === "Accommodation") {
          details = await Accomodation.findOne({ _id: fav.adsId, ...blockedFilter })
            .select("_id userId adsId title description propertyType itemImages bedType price totalViews name createdAt")
            .lean();
        } else if (fav.adsType === "Event") {
          details = await Event.findOne({ _id: fav.adsId, ...blockedFilter })
            .select("_id userId adsId title description date entryType amount totalViews name createdAt")
            .lean();
        }
        if (details) {
          details.adsType = fav.adsType;
        }
        return {
          myPosts: details ? details : null,
        };
      })
    );
    const filteredResults = results.filter(r => r.myPosts !== null);
    const totalFavourites = await Favourites.countDocuments({ userId: myUserId });
    const totalPages = Math.ceil(totalFavourites / limit);
    if (!filteredResults || filteredResults.length === 0) {
      return res.status(constants.httpStatus.ok).json({
        status: 1,
        msg: "No liked posts found",
        payload: {},
      });
    }
    return res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "Success",
      payload: {
        likedPosts: filteredResults,
        meta: {
          currentPage: pages,
          totalFavourites,
          totalPages,
          limit,
        },
      },
    });
  } catch (error) {
    logger.error(`Error in getLikedPosts: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

module.exports = {
  saveLikedPost,
  getLikedPosts,
};
