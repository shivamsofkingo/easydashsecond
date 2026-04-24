const Community = require("../models/community.js");
const User = require("../models/users.js");
const { hasPermission } = require("../admin/utilities.js");
const { uploadCommunityImages } = require("../utils/group/handleImage.js");
const { updateCommunityImage } = require("../utils/ads/ads.js");
const {
  createCommunityUploadUrl,
  deleteCommunityImages,
} = require("../utils/fileUpload/file.js");
const constants = require("../constants/constants.js");
const { logger } = require("../config/loggerConfig.js");
const { default: mongoose } = require("mongoose");

const createCommunity = async (req, res) => {
  const session = await Community.startSession();
  session.startTransaction();
  const { fileNames, contentTypes, communityName, description, category } = req.body;
  const myUserId = req.user._id;
  try {
    if (!communityName || !description || !category) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const validCommunityName = communityName.trim();
    const validDescription = description.trim();
    if (validCommunityName.length < 1 || validDescription.length < 1) {
      await session.abortTransaction();
      res.status(constants.httpStatus.validationError).json({
        status: 0,
        msg: "invalid name or description",
        payload: {}
      });
    }
    const user = await User.findById(myUserId).session(session);
    if (!user || user.profileType === "NONE") {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "user not found or incomplete profile",
        payload: {},
      });
    }
    const permission = await hasPermission(myUserId);
    if (permission === false) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.conflict).json({
        status: 0,
        msg: "permission denied",
        payload: {},
      });
    }
    let communityImage = [];
    if (fileNames && contentTypes) {
      if (fileNames.length !== contentTypes.length) {
        await session.abortTransaction();
        session.endSession();
        return res.status(constants.httpStatus.badRequest).json({
          status: 0,
          msg: "File names and content types must match in length",
          payload: {},
        });
      }
      const param = { userId: myUserId, fileNames, contentTypes };
      const imgUrls = await uploadCommunityImages(param);
      for (const { fileName, uploadUrl, contentType } of imgUrls) {
        communityImage.push({ fileName, uploadUrl, contentType });
      }
    }
    const newCommunity = await Community.create(
      [
        {
          communityAdminId: myUserId,
          communityName: validCommunityName,
          description: validDescription,
          category,
        },
      ],
      { session }
    );
    if (!newCommunity) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Failed to create community",
        payload: {},
      });
    }
    await session.commitTransaction();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        newCommunity,
        uploadUrls: communityImage,
      },
    });
  } catch (error) {
    logger.error(`error in createCommunity: ${error.message}`, { error });
    await session.abortTransaction();
    return res.status(constants.httpStatus.badRequest).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  } finally {
    session.endSession();
  }
};

const saveCommunityImage = async (req, res) => {
  const session = await Community.startSession();
  session.startTransaction();
  const { userId, communityId, fileNames } = req.body;
  const myUserId = req.user._id;
  try {
    if (!userId || !communityId || !fileNames) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    if (myUserId.toString() !== userId.toString()) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    let updatedImages = [];
    for (const singleFileName of fileNames) {
      const updateData = await updateCommunityImage({
        userId,
        communityId,
        fileNames: singleFileName,
        session,
      });
      updatedImages = updateData;
    }
    await session.commitTransaction();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        communityImage: updatedImages,
      },
    });
  } catch (error) {
    logger.error(`error in saveCommunityImage: ${error.message}`, { error });
    await session.abortTransaction();
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      paylaod: {},
    });
  } finally {
    session.endSession();
  }
};

const editCommunityImage = async (req, res) => {
  const session = await Community.startSession();
  session.startTransaction();
  const { userId, communityId, fileNames, contentTypes } = req.body;
  const myUserId = req.user._id;
  try {
    if (!userId || !communityId || !fileNames || !contentTypes) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    if (myUserId.toString() !== userId.toString()) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const permission = await hasPermission(userId);
    if (permission === false) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.conflict).json({
        status: 0,
        msg: "permission denied",
        payload: {},
      });
    }
    const community = await Community.findById(communityId).session(session);
    if (!community) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "community not found",
        payload: {},
      });
    }
    if (fileNames.length !== contentTypes.length) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "File names and content types must be provided and should match in length.",
        payload: {},
      });
    }
    const uploadUrls = [];
    for (let i = 0; i < fileNames.length; i++) {
      const fileName = fileNames[i];
      const contentType = contentTypes[i];
      const uploadUrl = await createCommunityUploadUrl(
        fileName,
        contentType,
        userId
      );
      const param = {
        userId,
        communityId,
        fileNames: fileName,
        session,
      };
      await updateCommunityImage(param);
      uploadUrls.push({
        fileName,
        uploadUrl,
      });
    }
    await session.commitTransaction();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: uploadUrls,
    });
  } catch (error) {
    logger.error(`error in editCommunityImage: ${error.message}`, { error });
    await session.abortTransaction();
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      paylaod: {},
    });
  } finally {
    session.endSession();
  }
};

const deleteCommunityImage = async (req, res) => {
  const { userId, communityId, fileNames, contentTypes } = req.body;
  const myUserId = req.user._id;
  try {
    if (!userId || !communityId || !fileNames || !contentTypes) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Missing required* fields",
        payload: {},
      });
    }
    if (myUserId.toString() !== userId) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const permission = hasPermission(myUserId);
    if (permission === false) {
      return res.status(constants.httpStatus.conflict).json({
        status: 0,
        msg: "permission denied",
        payload: {},
      });
    }
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "community not found",
        payload: {},
      });
    }
    community.communityImage = "NA";
    await community.save();
    await deleteCommunityImages(fileNames, myUserId);
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {},
    });
  } catch (error) {
    logger.error(`error in deleteCommunityImage: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      paylaod: {},
    });
  }
};

const editCommunity = async (req, res) => {
  const session = await Community.startSession();
  session.startTransaction();
  const { communityId, communityName, description } = req.body;
  try {
    if (!communityId) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const userId = req.user._id;
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "user not found",
        payload: {},
      });
    }
    const permission = hasPermission(userId);
    if (permission === false) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.conflict).json({
        status: 0,
        msg: "permission denied",
        payload: {},
      });
    }
    const community = await Community.findById(communityId).session(session);
    if (!community) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "community not found",
        payload: {},
      });
    }
    community.communityName = communityName
      ? communityName
      : community.communityName;
    community.description = description ? description : community.description;
    await session.commitTransaction();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        community,
      },
    });
  } catch (error) {
    logger.error(`error in editProfile: ${error.message}`, { error });
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

const deleteCommunity = async (req, res) => {
  const { id } = req.params;
  try {
    if (id) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        paylaod: {}
      });
    }
    // const deletedCommunity = await Community.findOneAndDelete({ _id: id });
    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({
        status: 0,
        msg: "Community not found",
        payload: {},
      });
    }
    community.isDeleted = true;
    await community.save();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "Community and associated groups deleted successfully",
      payload: {},
    });
  } catch (error) {
    logger.error(`Error in deleteCommunity: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

const getAllCommunities = async (req, res) => {
  try {
    const { page = 1, limit = constants.perPage.pageLimit10 } = req.query;
    const pageNumber = Math.max(1, parseInt(page));
    const pageSize = Math.max(1, parseInt(limit));
    const skip = (pageNumber - 1) * pageSize;
    const filter = {
      ...(Array.isArray(req.blockedUserIds) && req.blockedUserIds.length > 0
        ? { userId: { $nin: req.blockedUserIds.map(id => new mongoose.Types.ObjectId(id)) } }
        : {})

    }
    const communities = await Community.find(filter)
      .select("_id communityImage communityName description communityAdminId totalGroups createdAt")
      .skip(skip)
      .limit(pageSize)
      .lean();

    const totalCommunities = await Community.countDocuments(filter);
    return res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        communities,
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(totalCommunities / pageSize),
          pageSize,
          totalItems: totalCommunities,
        },
      },
    });
  } catch (error) {
    logger.error(`Error in getAllCommunities: ${error.message}`, { error });
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: `something went wrong: ${error.message}`,
      payload: {},
    });
  }
};

module.exports = {
  createCommunity,
  saveCommunityImage,
  editCommunityImage,
  deleteCommunityImage,
  editCommunity,
  deleteCommunity,
  getAllCommunities
};
