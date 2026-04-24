const Notification = require("../models/notification.js");
const User = require("../models/users.js");
const AdsPost = require("../models/adsPost.js");
const Giveaway = require("../models/giveaways.js");
const Marketplace = require("../models/marketplace.js");
const Accommodation = require("../models/accomodation.js");
const Event = require("../models/event.js");
const constants = require("../constants/constants.js");
const { logger } = require("../config/loggerConfig.js");


// const getNotifications = async (req, res) => {
//     const {id} = req.params;
//     const myUserId = req.user._id;
//   try {
//     if(!id) {
//         return res.status(constants.httpStatus.badRequest).json({
//             status: 0,
//             msg: "missing required* fields",
//             payload: {}
//         });
//     }
//     if(id !== myUserId.toString()) {
//         return res.status(constants.httpStatus.badRequest).json({
//             status: 0,
//             msg: "unauthorize request",
//             payload: {}
//         });
//     }
//     const notifications = await Notification.find({ recieverId: myUserId })
//       .sort({ createdAt: -1 })
//       .limit(20);

//     res.status(constants.httpStatus.ok).json({
//       status: 1,
//       msg: "success",
//       payload: notifications,
//     });
//   } catch (error) {
//     console.error("Error fetching notifications:", error);
//     res.status(constants.httpStatus.serverError).json({
//       status: 0,
//       msg: "Something went wrong",
//       payload: {},
//     });
//   }
// };

const getNotifications = async (req, res) => {
  const { userId, page = 1, limit = 20 } = req.query;
  const myUserId = req.user._id;
  try {
    if (!userId) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Missing required fields.",
        payload: {},
      });
    }
    if (userId !== myUserId.toString()) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "Unauthorized request.",
        payload: {},
      });
    }
    const pageNumber = parseInt(page, 10) || 1;
    const pageLimit = parseInt(limit, 10) || 20;

    if (pageNumber < 1 || pageLimit < 1) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Page and limit must be positive integers.",
        payload: {},
      });
    }
    const totalNotifications = await Notification.countDocuments({
      recieverId: myUserId,
    });
    const totalPages = Math.ceil(totalNotifications / pageLimit);
    const notifications = await Notification.find({ recieverId: myUserId })
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * pageLimit)
      .limit(pageLimit);

    if (!notifications) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "not found",
        payload: {},
      });
    }
    const results = await Promise.all(
      notifications.map(async (item) => {
        if (item.notificationType === "Ads") {
          const postId = item.adsId;
          const adsType = item.adsType;
          let post = null;

          if (adsType === "Giveaway") {
            post = await Giveaway.findById(postId);
          } else if (adsType === "Marketplace") {
            post = await Marketplace.findById(postId);
          } else if (adsType === "Accommodation") {
            post = await Accommodation.findById(postId);
          } else {
            post = await Event.findById(postId);
          }
          if (post && post.isDeleted === false) {
            return {
              ...item.toObject(),
              postDetails: post,
            };
          }
          return null;
        } else {
          const isUserActive = item.senderId;
          const check = await User.findById(isUserActive);
          if(check && check.isActive === true) {
            return {
              ...item.toObject(),
              userDetails: check
            }
          }
        }
        return item.toObject();
      })
    );
    const filteredResults = results.filter((result) => result !== null);
    await Notification.updateMany(
      { recieverId: myUserId, isRead: false },
      { $set: { isRead: true } }
    );
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "Success",
      payload: {
        notifications: filteredResults,
        meta: {
          currentPage: pageNumber,
          totalPages,
          totalNotifications,
          pageLimit,
        },
      },
    });
  } catch (error) {
    logger.error(`Error fetching notifications: ${error.message}`, {error});
    res.status(500).json({
      status: 0,
      msg: "Something went wrong.",
      payload: {},
    });
  }
};


const getUnreadNotificationCount = async (req, res) => {
  const { id } = req.params;
  const myUserId = req.user._id;
  try {
    if (!id) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    if (!myUserId || myUserId.toString() !== id) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "user not found",
        payload: {},
      });
    }
    const unreadNotifications = await Notification.countDocuments({
      recieverId: myUserId,
      isRead: false,
    });
    // if (!unreadNotifications) {
    //   return res.status(constants.httpStatus.badRequest).json({
    //     status: 0,
    //     msg: "internal server error",
    //     payload: {},
    //   });
    // }
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        unreadCount: unreadNotifications,
      },
    });
  } catch (error) {
    logger.error(`Error fetching notifications count: ${error.message}`, {error});
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong.",
      payload: {},
    });
  }
};

const getNotificationAdDetails = async (req, res) => {
  const { adsId } = req.query;
  const myUserId = req.user._id;
  try {
    if (!adsId) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    if (!myUserId) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const adsPost = await AdsPost.findById(adsId);
    if (!adsPost) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "adPost not found",
        payload: {},
      });
    }
    let post;
    if (adsPost.adsType === "Giveaway") {
      post = await Giveaway.findOne({
        adsId,
      });
    } else if (adsPost.adsType === "Marketplace") {
      post = await Marketplace.findOne({
        adsId,
      });
    } else if (adsPost.adsType === "Accomodation") {
      post = await Accommodation.findOne({
        adsId,
      });
    } else if (adsPost.adsType === "Event") {
      post = await Event.findOne({
        adsId,
      });
    }
    if (!post) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "ad not found",
        payload: {},
      });
    }
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        post,
      },
    });
  } catch (error) {
    logger.error(`Error fetching getNotificationAdDetails: ${error.message}`, {error});
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong.",
      payload: {},
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadNotificationCount,
  getNotificationAdDetails,
};
