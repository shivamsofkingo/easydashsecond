const User = require("../models/users.js");
const Report = require("../models/report.js");
const Giveaway = require("../models/giveaways.js");
const Marketplace = require("../models/marketplace.js");
const Accommodation = require("../models/accomodation.js");
const Event = require("../models/event.js");
const { createReportProblemUploadUrl } = require("../utils/fileUpload/file.js");
const { updateReportProblemImage } = require("../utils/ads/ads.js");

const reportUser = async (req, res) => {
  const { reportedTo, reason, comment } = req.body;
  const myUserId = req.user._id;
  try {
    if (!reportedTo || !reason) {
      return res.status(400).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    if (!myUserId) {
      return res.status(400).json({
        status: 0,
        msg: "unauthorize request",
        paytload: {},
      });
    }
    if(reportedTo.toString() === myUserId.toString()) {
      return res.status(400).json({
        status: 0,
        msg: "cannot report yourself",
        paytload: {},
      });
    }
    const user = await User.findById(reportedTo);
    if (!user) {
      res.status(400).json({
        status: 0,
        msg: "user not found",
        payload: {},
      });
    }
    const report = await Report.create({
      reportedTo,
      reportedBy: myUserId,
      itemImages: user.profileImage,
      reportType: "user",
      reason,
      comment: comment ? comment : null,
    });
    if (!report) {
      return res.status(400).json({
        status: 0,
        msg: "cannot reported",
        payload: {},
      });
    }
    user.totalReports += 1;
    await user.save();
    res.status(200).json({
      status: 1,
      msg: "success",
      payload: {
        report,
      },
    });
  } catch (error) {
    console.log("error in report user", error.message);
    return res.status(500).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const reportAd = async (req, res) => {
  const { userId, adsId, adsType, reason, comment } = req.body;
  const myUserId = req.user._id;
  try {
    if (!userId || !adsId || !reason) {
      return res.status(400).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    if (!myUserId) {
      return res.status(400).json({
        status: 0,
        msg: "unauthorize request",
        paytload: {},
      });
    }
    if(userId.toString() === myUserId.toString()) {
      return res.status(400).json({
        status: 0,
        msg: "cannot report your own ads",
        paytload: {},
      });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        status: 0,
        msg: "user not found",
        payload: {},
      });
    }
    let post;
    if (adsType === "Giveaway") {
      post = await Giveaway.findById(adsId);
    } else if (adsType === "Marketplace") {
      post = await Marketplace.findById(adsId);
    } else if (adsType === "Accommodation") {
      post = await Accommodation.findById(adsId);
    } else if (adsType === "Event") {
      post = await Event.findById(adsId);
    } else {
      return res.status(400).json({
        status: 0,
        msg: "invalid ads type",
        payload: {},
      });
    }
    if (!post || post === null) {
      return res.status(400).json({
        status: 0,
        msg: "ad not found",
        payload: {},
      });
    }
    const report = await Report.create({
      reportedTo: userId,
      reportedBy: myUserId,
      adsId,
      adsType,
      itemImages: post.itemImages,
      reportType: "ads",
      reason,
      comment: comment ? comment : null,
    });
    if (!report) {
      return res.status(400).json({
        status: 0,
        msg: "cannot reported",
        payload: {},
      });
    }
    post.totalReports += 1;
    await post.save();
    res.status(200).json({
      status: 1,
      msg: "success",
      payload: {
        report,
      },
    });
  } catch (error) {
    console.log("error in reportAd", error.message);
    return res.status(500).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const uploadReportProblemImages = async (param) => {
    const { userId, fileNames, contentTypes } = param;
    try {
      const uploadUrls = [];
      for (let i = 0; i < fileNames.length; i++) {
        const fileName = fileNames[i];
        const contentType = contentTypes[i];
        const uploadUrl = await createReportProblemUploadUrl(
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
      console.log("Error in uploadReportProblemImages:", error.message);
      return false;
    }
};

const reportProblem = async (req, res) => {
  const { fileNames, contentTypes, reason } = req.body;
  const myUserId = req.user._id;
  try {
    if (!reason) {
      return res.status(400).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    if (!myUserId) {
      return res.status(400).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    
    // Validate file arrays deeply before hitting DB layer
    if (fileNames && contentTypes) {
      if (fileNames.length !== contentTypes.length) {
        return res.status(400).json({
          status: 0,
          msg: "File names and content types must match in length",
          payload: {},
        });
      }
    }

    const problem = await Report.create({
      reportedBy: myUserId,
      reportType: "other",
      reason,
    });

    if (!problem) {
      return res.status(400).json({
        status: 0,
        msg: "internal server error",
        payload: {},
      });
    }

    let returnedUploadUrls = [];
    if (fileNames && contentTypes && fileNames.length > 0) {
      const param = { userId: myUserId, fileNames, contentTypes };
      const imgUrls = await uploadReportProblemImages(param);
      if (imgUrls && imgUrls.length > 0) {
          returnedUploadUrls = imgUrls;
      }
    }
    
    res.status(200).json({
      status: 1,
      msg: "success",
      payload: {
        reportedProblem: problem,
        uploadUrls: returnedUploadUrls
      },
    });
  } catch (error) {
    console.log("error in reportProblem", error.message);
    return res.status(500).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const saveReportProblemImages = async (req, res) => {
    const session = await Report.startSession();
    session.startTransaction();
    const { userId, reportId, fileNames } = req.body;
    try {
      if (!userId || !reportId || !fileNames) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          status: 0,
          msg: "missing required* fields",
          payload: {},
        });
      }
      const myUserId = req.user._id.toString();
      if (myUserId !== userId) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          status: 0,
          msg: "unauthorize request",
          payload: {},
        });
      }
      const updatedImages = [];
      for (const singleFileName of fileNames) {
        const updateData = await updateReportProblemImage({
          userId,
          reportId,
          fileNames: singleFileName,
          session,
        });
        updatedImages.push(...updateData);
      }
      await session.commitTransaction();
      session.endSession();
      res.status(200).json({
        status: 1,
        msg: "success",
        payload: {},
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.log("error in saveReportProblemImages", error.message);
      res.status(500).json({
        status: 0,
        msg: "something went wrong",
        paylaod: {},
      });
    }
};

module.exports = {
  reportUser,
  reportAd,
  reportProblem,
  saveReportProblemImages,
};
