const Report = require("../../models/report.js");
const Giveaway = require("../../models/giveaways.js");
const Marketplace = require("../../models/marketplace.js");
const Accommodation = require("../../models/accomodation.js");
const Event = require("../../models/event.js");
const User = require("../../models/users.js");
const AdsPost = require("../../models/adsPost.js");
const { hasPermission, isValidObjectId } = require("../utilities.js");
const constants = require("../../constants/constants.js");
const { adminLogger } = require("../../config/loggerConfig.js");

const getAllReports = async (req, res) => {
  const { pages = 1 } = req.query;
  const pageSize = 15;
  const page = parseInt(pages, 10) || 1;
  const myUserId = req.user._id;

  try {
    if (!myUserId) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }

    const totalReports = await Report.countDocuments({ isDeleted: false });
    const totalPages = Math.ceil(totalReports / pageSize);

    const reports = await Report.aggregate([
      { $match: { isDeleted: false } },
      {
        $lookup: {
          from: "users",
          localField: "reportedBy",
          foreignField: "_id",
          as: "reportedByDoc"
        }
      },
      { $unwind: { path: "$reportedByDoc", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "reportedTo",
          foreignField: "_id",
          as: "reportedToDoc"
        }
      },
      { $unwind: { path: "$reportedToDoc", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          isPremium: {
            $cond: {
              if: { $gt: ["$reportedByDoc.subscriptionExpiresAt", new Date()] },
              then: 1,
              else: 0
            }
          },
          reportedBy: {
            _id: "$reportedByDoc._id",
            name: "$reportedByDoc.name",
            email: "$reportedByDoc.email",
            profileImage: "$reportedByDoc.profileImage",
          },
          reportedTo: {
            _id: "$reportedToDoc._id",
            name: "$reportedToDoc.name",
            email: "$reportedToDoc.email",
            profileImage: "$reportedToDoc.profileImage",
          }
        }
      },
      { $project: { reportedByDoc: 0, reportedToDoc: 0 } },
      { $sort: { isPremium: -1, createdAt: -1 } },
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize }
    ]);

    if (!reports) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "report not found",
        payload: {},
      });
    }

    const enhancedReports = await Promise.all(
      reports.map(async (report) => {
        let itemImages = report.itemImages || [];
        if (report.reportType === "ads") {
          if (report.adsType === "Giveaway") {
            const giveaway = await Giveaway.findById(report.adsId);
            if (giveaway?.itemImages) itemImages = giveaway.itemImages;
          } else if (report.adsType === "Marketplace") {
            const marketplace = await Marketplace.findById(report.adsId);
            if (marketplace?.itemImages) itemImages = marketplace.itemImages;
          } else if (report.adsType === "Accommodation") {
            const accommodation = await Accommodation.findById(report.adsId);
            if (accommodation?.itemImages) itemImages = accommodation.itemImages;
          } else if (report.adsType === "Event") {
            const event = await Event.findById(report.adsId);
            if (event?.itemImages) itemImages = event.itemImages;
          }
        }
        return { ...(report.toObject ? report.toObject() : report), itemImages };
      })
    );

    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        reports: enhancedReports,
        meta: {
          currentPage: page,
          reportsPerPage: pageSize,
          totalPages,
          totalReports,
        },
      },
    });
  } catch (error) {
    adminLogger.error(`error in getAllReports: ${error.message}`, { error });
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getAllUsersReport = async (req, res) => {
  const { pages = 1 } = req.query;
  const pageSize = 15;
  const page = parseInt(pages, 10) || 1;
  const myUserId = req.user._id;
  try {
    if (!myUserId) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const totalReports = await Report.countDocuments({
      reportType: "user",
      isDeleted: false
    });
    const totalPages = Math.ceil(totalReports / pageSize);
    const report = await Report.aggregate([
      { $match: { reportType: "user", isDeleted: false } },
      {
        $lookup: {
          from: "users",
          localField: "reportedBy",
          foreignField: "_id",
          as: "reportedByDoc"
        }
      },
      { $unwind: { path: "$reportedByDoc", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "reportedTo",
          foreignField: "_id",
          as: "reportedToDoc"
        }
      },
      { $unwind: { path: "$reportedToDoc", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          isPremium: {
            $cond: {
              if: { $gt: ["$reportedByDoc.subscriptionExpiresAt", new Date()] },
              then: 1,
              else: 0
            }
          },
          reportedTo: {
            _id: "$reportedToDoc._id",
            profileImage: "$reportedToDoc.profileImage",
          }
        }
      },
      { $project: { reportedByDoc: 0, reportedToDoc: 0 } },
      { $sort: { isPremium: -1, createdAt: -1 } },
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize }
    ]);
    if (!report) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "report not found",
        payload: {},
      });
    }
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        report,
        meta: {
          currentPage: page,
          reportsPerPage: pageSize,
          totalPages,
          totalReports,
        },
      },
    });
  } catch (error) {
    adminLogger.error(`error in getAllUsersReport: ${error.message}`, {error});
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getAllAdsReport = async (req, res) => {
  const { pages = 1 } = req.query;
  const pageSize = 15;
  const page = parseInt(pages, 10) || 1;
  const myUserId = req.user._id;
  try {
    if (!myUserId) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const totalReports = await Report.countDocuments({
      reportType: "ads",
      isDeleted: false
    });
    const totalPages = Math.ceil(totalReports / pageSize);
    const reports = await Report.aggregate([
      { $match: { reportType: "ads", isDeleted: false } },
      {
        $lookup: {
          from: "users",
          localField: "reportedBy",
          foreignField: "_id",
          as: "reportedByDoc"
        }
      },
      { $unwind: { path: "$reportedByDoc", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          isPremium: {
            $cond: {
              if: { $gt: ["$reportedByDoc.subscriptionExpiresAt", new Date()] },
              then: 1,
              else: 0
            }
          }
        }
      },
      { $project: { reportedByDoc: 0 } },
      { $sort: { isPremium: -1, createdAt: -1 } },
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize }
    ]);

    if (!reports) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "report not found",
        payload: {},
      });
    }
    const enhancedReports = await Promise.all(
      reports.map(async (report) => {
        let itemImages = [];
        if (report.adsType === "Giveaway") {
          const giveaway = await Giveaway.findById(report.adsId);
          itemImages = giveaway?.itemImages || null;
        } else if (report.adsType === "Marketplace") {
          const marketplace = await Marketplace.findById(report.adsId);
          itemImages = marketplace?.itemImages || null;
        } else if (report.adsType === "Accomodation") {
          const accommodation = await Accommodation.findById(report.adsId);
          itemImages = accommodation?.itemImages || null;
        } else if (report.adsType === "Event") {
          const event = await Event.findById(report.adsId);
          itemImages = event?.itemImages || null;
        }
        return { ...(report.toObject ? report.toObject() : report), itemImages };
      })
    );
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        reports: enhancedReports,
        meta: {
          currentPage: page,
          reportsPerPage: pageSize,
          totalPages,
          totalReports,
        },
      },
    });
  } catch (error) {
    adminLogger.error(`error in getAllAdsReport: ${error.message}`, {error});
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const searchReport = async (req, res) => {
  const { reportType, keyword, page = 1, limit = 15 } = req.query;
  try {
    if(!reportType) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        message: "requires* reportType",
        payload: {},
      });
    }
    if (!keyword) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        message: "requires keyword for search",
        payload: {},
      });
    }
    const searchCriteria = {
      reportType,
      $or: [
        ...(isValidObjectId(keyword) ? [{ _id: keyword }] : []),
        ...(isValidObjectId(keyword) ? [{ reportedBy: keyword }] : []),
        ...(isValidObjectId(keyword) ? [{ reportedTo: keyword }] : []),
        ...(isValidObjectId(keyword) ? [{ adsId: keyword }] : []),
      ],
    };
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const report = await Report.find(searchCriteria).skip(skip).limit(limitNum).lean();
    const totalCount = await Report.countDocuments(searchCriteria);
    return res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        results: report,
        meta: {
          currentPage: pageNum,
          reportsPerPage: limitNum,
          totalResults: totalCount,
          totalPages: Math.ceil(totalCount / limitNum),
        }
      },
    });
  } catch (error) {
    adminLogger.error(`error in searchReport: ${error.message}`, {error});
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const deleteAdsReport = async (req, res) => {
  const session = await Report.startSession();
  session.startTransaction();
  const { reportId } = req.query;
  const myUserId = req.user._id;
  try {
    if (!reportId) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    if (!myUserId) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const report = await Report.findById(reportId).session(session);
    if(!report) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "report not found",
        payload: {},
      });
    }
    let post;
    if(report.adsType === "Giveaway") {
      post = await Giveaway.findById(report.adsId).session(session);
    } else if(report.adsType === "Marketplace") {
      post = await Marketplace.findById(report.adsId).session(session);
    } else if(report.adsType === "Accommodation") {
      post = await Accommodation.findById(report.adsId).session(session);
    } else if(report.adsType === "Event") {
      post = await Event.findById(report.adsId).session(session);
    } else {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "invalid adsType",
        payload: {},
      });
    }
    if(!post || post === null) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "ad not found",
        payload: {},
      });
    }
    post.totalReports -= 1;
    report.isDeleted = true;
    await post.save({ session });
    await report.save({ session });
    await session.commitTransaction();
    return res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {},
    });
  } catch (error) {
    adminLogger.error(`error in deleteAdsReport: ${error.message}`, {error});
    await session.abortTransaction();
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  } finally {
    session.endSession();
  }
};

const deleteUserReport = async (req, res) => {
  const session = await Report.startSession();
  session.startTransaction();
  const { reportId } = req.query;
  const myUserId = req.user._id;
  try {
    if (!reportId) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    if (!myUserId) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const report = await Report.findById(reportId).session(session);
    if(!report) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "report not found",
        payload: {},
      });
    }
    // await Report.findByIdAndDelete(reportId);
    const reportToUser = await User.findById(report.reportedTo).session(session);
    if(!reportToUser) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "internal server error",
        payload: {},
      });
    }
    reportToUser.totalReports -= 1;
    report.isDeleted = true;
    await reportToUser.save({ session });
    await report.save({ session });
    await session.commitTransaction();
    return res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {},
    });
  } catch (error) {
    adminLogger.error(`error in deleteUserReport: ${error.message}`, {error});
    await session.abortTransaction();
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  } finally {
    session.endSession();
  }
}

module.exports = {
  getAllReports,
  getAllUsersReport,
  getAllAdsReport,
  searchReport,
  deleteAdsReport,
  deleteUserReport
};
