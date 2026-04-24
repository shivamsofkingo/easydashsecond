const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 60 * 5 });
const User = require("../models/users.js");
const Student = require("../models/student.js");
const NonStudent = require("../models/nonStudent.js");
const AdsPost = require("../models/adsPost.js");
const Giveaway = require("../models/giveaways.js");

const {
  createGiveawayUploadUrl,
  deleteGiveawayImages,
} = require("../utils/fileUpload/file.js");
const { uploadGiveawayImages } = require("../utils/marketplace/handleImage.js");
const {
  updateGiveawayImage,
  getAllGiveawaysPost,
  getNotifyAdsId,
} = require("../utils/ads/ads.js");
const { searchSchema } = require("../validations/validations.js");
const soldNotificationQueue = require("../utils/queues/soldNotificationQueue.js");
const constants = require("../constants/constants.js");

const { default: mongoose } = require("mongoose");
const { logger } = require("../config/loggerConfig.js");

const createGiveawayPost = async (req, res) => {
  const session = await Giveaway.startSession();
  session.startTransaction();
  const {
    category,
    uploadType,
    shopName,
    shopLocation,
    title,
    description,
    region,
    latitude,
    longitude,
    closestInstitute,
    name,
    email,
    phoneNumber,
    fileNames,
    contentTypes,
  } = req.body;
  try {
    if (
      !category ||
      !uploadType ||
      !title ||
      !description ||
      !region ||
      // !latitude ||
      // !longitude ||
      !closestInstitute ||
      !name
    ) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const validTitle = title.trim();
    const validDescription = description.trim();
    if (validTitle.length < 1 || validDescription.length < 1) {
      await session.abortTransaction();
      res.status(constants.httpStatus.validationError).json({
        status: 0,
        msg: "invalid title or description",
        payload: {},
      });
    }
    const userId = req.user._id;
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "user not found",
        payload: {},
      });
    }
    let nonStudent;
    let flag = false;
    if (user.profileType === "Non Student") {
      nonStudent = await NonStudent.findOne({ userId }).session(session);
      if (!nonStudent) {
        await session.abortTransaction();
        return res.status(constants.httpStatus.badRequest).json({
          status: 0,
          msg: "invalid profile type or incomplete profile",
          paylaod: {},
        });
      }
      if (shopName) {
        nonStudent.shopName = shopName;
        flag = true;
      }
      if (shopLocation) {
        nonStudent.shopLocation = shopLocation;
        flag = true;
      }
    }
    if (!email && !phoneNumber) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "email or phone required",
        payload: {},
      });
    }
    let isSignInWithoutEmail = false;
    if (email) {
      if (user.email !== email) {
        if (user.email === null && phoneNumber) {
          isSignInWithoutEmail = true;
        } else {
          await session.abortTransaction();
          return res.status(constants.httpStatus.badRequest).json({
            status: 0,
            msg: "Email must be same as verified one",
            payload: {},
          });
        }
      }
    }

    if (phoneNumber && user.phoneNumber !== phoneNumber) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Phone number must be verified",
        payload: {},
      });
    }
    let location;
    if (!latitude || !longitude) {
      const userLocationCoordinates = user.regionUpdate.coordinates;
      const userLatitude = userLocationCoordinates[0];
      const userLongitude = userLocationCoordinates[1];
      location = {
        type: "Point",
        coordinates: [userLongitude, userLatitude],
      };
    } else {
      location = {
        type: "Point",
        coordinates: [longitude, latitude],
      };
    }
    const newAd = await AdsPost.create([{ userId, adsType: "Giveaway" }], {
      session,
    });
    if (!newAd || newAd.length === 0) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.serverError).json({
        status: 0,
        msg: "Failed to create new ad post",
        payload: {},
      });
    }
    const newAdPost = await Giveaway.create(
      [
        {
          userId,
          adsId: newAd[0]._id,
          category,
          uploadType,
          shopName: shopName ? shopName : "NA",
          shopLocation: shopLocation ? shopLocation : "NA",
          title: validTitle,
          description: validDescription,
          region,
          location,
          closestInstitute,
          name,
          email: isSignInWithoutEmail ? null : email,
          phoneNumber: isSignInWithoutEmail ? phoneNumber : null,
        },
      ],
      { session }
    );
    if (!newAdPost || newAdPost.length === 0) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.serverError).json({
        status: 1,
        msg: "Failed to create ad post",
        payload: {},
      });
    }
    user.totalAdsPosted += 1;
    await user.save({ session });
    if (flag === true) {
      await nonStudent.save({ session });
    }
    user.password = undefined;
    let AdsImages = [];
    if (fileNames && contentTypes) {
      if (fileNames.length !== contentTypes.length) {
        await session.abortTransaction();
        return res.status(constants.httpStatus.badRequest).json({
          status: 0,
          msg: "File names and content types must match in length",
          payload: {},
        });
      }
      const param = { userId, fileNames, contentTypes };
      const imgUrls = await uploadGiveawayImages(param);
      for (const { fileName, uploadUrl, contentType } of imgUrls) {
        AdsImages.push({ fileName, uploadUrl, contentType });
      }
    }
    await session.commitTransaction();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "Success",
      payload: {
        newAdPost,
        uploadUrls: AdsImages,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error(`error in createGiveawayPost: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  } finally {
    session.endSession();
  }
};

const saveGiveawayImages = async (req, res) => {
  const session = await Giveaway.startSession();
  session.startTransaction();
  const myUserId = req.user._id;
  const { userId, adsId, fileNames } = req.body;
  try {
    if (!userId || !adsId || !fileNames) {
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
    const updatedImages = [];
    for (const singleFileName of fileNames) {
      const updateData = await updateGiveawayImage({
        userId,
        adsId,
        fileNames: singleFileName,
        session,
      });
      updatedImages.push(...updateData);
    }
    await session.commitTransaction();
    const adsIdNotify = await getNotifyAdsId(adsId);
    await soldNotificationQueue.add("adPosted", {
      recieverId: userId,
      adsId: adsIdNotify,
      adsType: "Giveaway",
      images: updatedImages[0],
      notificationType: "Ads",
      message: `Your ad is availabe online!`,
    });
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {},
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error(`error in saveGiveawayImages: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      paylaod: {},
    });
  } finally {
    session.endSession();
  }
};

const editGiveawayAdsImages = async (req, res) => {
  const session = await Giveaway.startSession();
  session.startTransaction();
  const { userId, adsId, fileNames, contentTypes } = req.body;
  try {
    if (!userId || !fileNames || !contentTypes) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const myUserId = req.user._id.toString();
    if (myUserId !== userId) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "unauthorize request",
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
      const uploadUrl = await createGiveawayUploadUrl(
        fileName,
        contentType,
        userId
      );
      const param = {
        userId,
        adsId,
        fileNames: fileName,
        session,
      };
      await updateGiveawayImage(param);
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
    await session.abortTransaction();
    logger.error(`error in editGiveawayImages: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      paylaod: {},
    });
  } finally {
    session.endSession();
  }
};

const deleteGiveawayImage = async (req, res) => {
  const { userId, adsId, fileNames, contentTypes } = req.body;
  try {
    if (!userId || !adsId || !fileNames || !contentTypes) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Missing required* fields",
        payload: {},
      });
    }
    const myUserId = req.user._id.toString();
    if (myUserId !== userId) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const ad = await Giveaway.findOne({ adsId });
    if (!ad) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "ad not found",
        payload: {},
      });
    }
    ad.itemImages = ad.itemImages.filter((imgUrl) => {
      const baseImageName = imgUrl.split("/").pop();
      return !fileNames.includes(baseImageName);
    });
    await ad.save();
    await deleteGiveawayImages(fileNames, myUserId);
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {},
    });
  } catch (error) {
    logger.error(`error in deleteGiveawayImage: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      paylaod: {},
    });
  }
};

const getAllGiveawayPostList = async (req, res) => {
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
    const data = await getAllGiveawaysPost(req, param);
    if (data === false) {
      return res.status(constants.httpStatus.serverError).json({
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
        totalPages: data.totalPages,
        totalCount: data.totalCount,
        currentPage: param.page,
      },
    });
  } catch (error) {
    logger.error(`error in getAllGiveawayPostList: ${error.message}`, {
      error,
    });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      paylaod: {},
    });
  }
};

const getPostByCategory = async (req, res) => {
  const { category, latitude, longitude, pages } = req.query;
  try {
    if (!category || !latitude || !longitude) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const validCategory = [
      "Study Materials",
      "Electronics",
      "Furniture",
      "Stationary & Supplies",
      "Services",
      "Other",
    ];
    if (!validCategory.includes(category)) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "invalid category",
        payload: {},
      });
    }
    const userLocation = [parseFloat(longitude), parseFloat(latitude)];
    const maxDistanceInRadians = constants.location.reach / constants.location.radian;
    const param = {
      perPage: 15,
      page: parseInt(pages, 10) || 1,
    };
    if (param.page < 1) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Invalid page number",
        payload: {},
      });
    }
    const filter = {
      category,
      "location.coordinates": {
        $geoWithin: {
          $centerSphere: [userLocation, maxDistanceInRadians],
        },
      },
      isSold: false,
      isDeleted: false,
      ...(Array.isArray(req.blockedUserIds) && req.blockedUserIds.length > 0
        ? { userId: { $nin: req.blockedUserIds.map(id => new mongoose.Types.ObjectId(id)) } }
        : {})

    };

    const totalCount = await Giveaway.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / param.perPage);
    if (param.page > totalPages) {
      return res.status(constants.httpStatus.ok).json({
        status: 1,
        msg: "No more posts",
        payload: {
          posts: [],
          totalPages,
          totalCount,
          currentPage: param.page,
        },
      });
    }
    const skip = (param.page - 1) * param.perPage;
    const posts = await Giveaway.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(param.perPage)
      .select(
        "_id userId adsId title description region itemImages totalViews totalLikes name createdAt"
      )
      .exec();

    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        posts,
        totalPages,
        totalCount,
        currentPage: param.page,
      },
    });
  } catch (error) {
    logger.error(`error in getPostByCategory: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getGiveawayPostDetails = async (req, res) => {
  const { id } = req.params;
  // const myUserId = req.user._id;
  const postId = id;
  try {
    const post = await Giveaway.findById(postId);
    if (!post) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "Post not found",
        payload: {},
      });
    }
    // if(post.userId.toString() !== myUserId.toString()) {
    //   post.totalViews += 1;
    //   await post.save();
    // }
    post.totalViews += 1;
    await post.save();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: post,
    });
  } catch (error) {
    logger.error(`error in getGiveawayPostDetails: ${error.message}`, {
      error,
    });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      paylaod: {},
    });
  }
};

const getGiveawayByUserNearbyLocation = async (req, res) => {
  const { page = 1 } = req.query;
  try {
    const userId = req.user._id;
    const adsPerPage = 16;
    const pageNumber = parseInt(page, 10);
    if (isNaN(pageNumber) || pageNumber <= 0) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Invalid page number",
        payload: {},
      });
    }
    const user = await User.findById(userId);
    if (!user || !user.regionUpdate || !user.regionUpdate.coordinates) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "User location not available",
        payload: {},
      });
    }
    const reach = 30;
    const radian = 6378.1;
    const userLocation = user.regionUpdate.coordinates;
    const maxDistanceInRadians = reach / radian;

    const filter = {
      "location.coordinates": {
        $geoWithin: {
          $centerSphere: [userLocation, maxDistanceInRadians],
        },
      },
      isSold: false,
      ...(Array.isArray(req.blockedUserIds) && req.blockedUserIds.length > 0
        ? { userId: { $nin: req.blockedUserIds.map(id => new mongoose.Types.ObjectId(id)) } }
        : {})

    };

    const totalAds = await Giveaway.countDocuments(filter)
    const totalPages = Math.ceil(totalAds / adsPerPage);
    if (pageNumber > totalPages && totalPages !== 0) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Page number exceeds total pages",
        payload: {},
      });
    }
    const nearbyGiveaway = await Giveaway.find(filter)
      .skip((pageNumber - 1) * adsPerPage)
      .limit(adsPerPage)
      .sort({ createdAt: -1 });

    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        nearbyAds: nearbyGiveaway,
        meta: {
          currentPage: pageNumber,
          totalPages,
          totalAds,
          adsPerPage,
        },
      },
    });
  } catch (error) {
    logger.error(`error in getGiveawayByUserNearbyLocation: ${error.message}`, {
      error,
    });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

const getGiveawayByNearbyLocation = async (req, res) => {
  const { latitude, longitude, page = 1 } = req.query;
  try {
    if (!latitude || !longitude) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const adsPerPage = 16;
    const pageNumber = parseInt(page, 10);
    if (isNaN(pageNumber) || pageNumber <= 0) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Invalid page number",
        payload: {},
      });
    }
    const userLocation = [parseFloat(longitude), parseFloat(latitude)];
    const maxDistanceInRadians =
      constants.location.reach / constants.location.radian;

    const filter = {
      "location.coordinates": {
        $geoWithin: {
          $centerSphere: [userLocation, maxDistanceInRadians],
        },
      },
      isSold: false,
      isDeleted: false,
      ...(Array.isArray(req.blockedUserIds) && req.blockedUserIds.length > 0
        ? { userId: { $nin: req.blockedUserIds.map(id => new mongoose.Types.ObjectId(id)) } }
        : {})

    };

    const totalAds = await Giveaway.countDocuments(filter);

    const totalPages = Math.ceil(totalAds / adsPerPage);
    if (pageNumber > totalPages && totalPages !== 0) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Page number exceeds total pages",
        payload: {},
      });
    }
    const nearbyGiveaway = await Giveaway.find(filter)
      .skip((pageNumber - 1) * adsPerPage)
      .limit(adsPerPage)
      .sort({ createdAt: -1 });

    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        nearbyAds: nearbyGiveaway,
        meta: {
          currentPage: pageNumber,
          totalPages,
          totalAds,
          adsPerPage,
        },
      },
    });
  } catch (error) {
    logger.error(`error in getGiveawayByNearbyLocation: ${error.message}`, {
      error,
    });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

const editGiveawayPost = async (req, res) => {
  const session = await Giveaway.startSession();
  session.startTransaction();
  const {
    category,
    uploadType,
    shopName,
    shopLocation,
    title,
    description,
    latitude,
    longitude,
    region,
    closestInstitute,
    name,
    email,
    phoneNumber,
    // fileNames,
    // contentTypes,
  } = req.body;
  const { id } = req.params;
  const userId = req.user._id;
  try {
    if (!id) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const giveawayPost = await Giveaway.findOne({
      _id: id,
      userId,
    }).session(session);
    if (!giveawayPost) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "post not found",
        payload: {},
      });
    }
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "User not found",
        payload: {},
      });
    }
    let nonStudent;
    let flag = false;
    if (user.profileType === "Non Student") {
      nonStudent = await NonStudent.findOne({ userId }).session(session);
      if (!nonStudent) {
        await session.abortTransaction();
        return res.status(constants.httpStatus.badRequest).json({
          status: 0,
          msg: "invalid profile type or incomplete profile",
          paylaod: {},
        });
      }
      if (shopName) {
        nonStudent.shopName = shopName;
        flag = true;
      }
      if (shopLocation) {
        nonStudent.shopLocation = shopLocation;
        flag = true;
      }
    }
    let isSignInWithoutEmail = false;
    if (email && user.email !== email) {
      if (user.email === null && phoneNumber) {
        isSignInWithoutEmail = true;
      } else {
        await session.abortTransaction();
        return res.status(constants.httpStatus.badRequest).json({
          status: 0,
          msg: "Email must be same as verified one",
          payload: {},
        });
      }
    }

    if (phoneNumber && user.phoneNumber !== phoneNumber) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Phone number must be verified",
        payload: {},
      });
    }
    if (latitude && longitude) {
      giveawayPost.location = {
        type: "Point",
        coordinates: [longitude, latitude],
      }
      giveawayPost.region = region;
    }
    giveawayPost.category = category ? category : giveawayPost.category;
    giveawayPost.uploadType = uploadType ? uploadType : giveawayPost.uploadType;
    giveawayPost.title = title ? title : giveawayPost.title;
    giveawayPost.description = description ? description : giveawayPost.description;
    // giveawayPost.region = region ? region : giveawayPost.region;
    giveawayPost.closestInstitute = closestInstitute ? closestInstitute : giveawayPost.closestInstitute;
    giveawayPost.name = name ? name : giveawayPost.name;
    giveawayPost.email = isSignInWithoutEmail ? null : email;
    giveawayPost.phoneNumber = isSignInWithoutEmail ? phoneNumber : null;

    // let updatedImages = [];
    // if (fileNames && contentTypes) {
    //   if (fileNames.length !== contentTypes.length) {
    //     await session.abortTransaction();
    //     return res.status(constants.httpStatus.badRequest).json({
    //       status: 0,
    //       msg: "File names and content types must match in length",
    //       payload: {},
    //     });
    //   }

    //   const param = { userId, fileNames, contentTypes };
    //   const imgUrls = await uploadGiveawayImages(param);
    //   for (const { fileName, uploadUrl, contentType } of imgUrls) {
    //     updatedImages.push({ fileName, uploadUrl, contentType });
    //   }
    //   giveawayPost.itemImages = updatedImages;
    // }

    await giveawayPost.save({ session });
    if (flag === true) {
      await nonStudent.save({ session });
    }
    await session.commitTransaction();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        giveawayPost,
        // updatedImages,
      },
    });
  } catch (error) {
    logger.error(`error in editGiveawayPost: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  } finally {
    session.endSession();
  }
};

const searchGiveaway = async (req, res) => {
  try {
    const {
      keyword,
      latitude,
      longitude,
      page = 1,
      limit = 16,
    } = searchSchema.parse({
      keyword: req.query.keyword,
      page: req.query.page ? parseInt(req.query.page) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      latitude: req.query.latitude,
      longitude: req.query.longitude,
    });

    const skip = (page - 1) * limit;
    const cacheKey = `search:${keyword}:${latitude}:${longitude}:${page}:${limit}`;
    const cachedResults = cache.get(cacheKey);
    if (cachedResults) {
      return res.status(constants.httpStatus.ok).json({
        status: 1,
        msg: "success",
        payload: cachedResults.payload,
        pagination: cachedResults.pagination,
      });
    }

    const searchCriteria = {
      isSold: false,
      ...(Array.isArray(req.blockedUserIds) && req.blockedUserIds.length > 0
        ? { userId: { $nin: req.blockedUserIds.map(id => new mongoose.Types.ObjectId(id)) } }
        : {})

    };
    if (keyword) {
      searchCriteria.$text = { $search: keyword };
    }
    if (latitude && longitude) {
      const userLocation = [parseFloat(longitude), parseFloat(latitude)];
      const maxDistanceInRadians =
        constants.location.reach / constants.location.radian;
      searchCriteria["location.coordinates"] = {
        $geoWithin: {
          $centerSphere: [userLocation, maxDistanceInRadians],
        },
      };
    }
    const totalResults = await Giveaway.countDocuments(searchCriteria);
    const giveaway = await Giveaway.find(searchCriteria)
      .skip(skip)
      .select(
        "_id userId adsId title description itemImages totalLikes region name totalViews createdAt"
      )
      .limit(parseInt(limit));

    if (!giveaway.length) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "No giveaway found",
        payload: [],
      });
    }
    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalResults / limit),
      limit: parseInt(limit),
      totalResults: giveaway.length,
    };
    const payload = giveaway;
    const clonedPayload = JSON.parse(JSON.stringify(payload));
    try {
      cache.set(cacheKey, { payload: clonedPayload, pagination });
    } catch (cacheError) {
      console.error("Error setting cache:", cacheError);
    }
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload,
      pagination,
    });
  } catch (error) {
    logger.error(`error in searchGiveaway: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

const deleteGiveawayPost = async (req, res) => {
  const session = await Giveaway.startSession();
  session.startTransaction();
  const { userId, postId } = req.query;
  const myUserId = req.user._id;
  try {
    if (!userId || !postId) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    if (myUserId.toString() !== userId) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const post = await Giveaway.findOne({ adsId: postId }).session(session);
    if (!post) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "post not found",
        payload: {},
      });
    }
    // const adsPost = await AdsPost.findById(postId).session(session);
    // if (!adsPost) {
    //   await session.abortTransaction();
    //   session.endSession();
    //   return res.status(constants.httpStatus.badRequest).json({
    //     status: 0,
    //     msg: "ad not found",
    //     payload: {},
    //   });
    // }
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "user not found",
        payload: {},
      });
    }
    // await Giveaway.findOneAndDelete({ adsId: postId }).session(session);
    // await AdsPost.findByIdAndDelete(adsPost._id).session(session);
    post.isDeleted = true;
    user.totalAdsPosted = user.totalAdsPosted - 1;
    await user.save({ session });
    await post.save({ session });
    await session.commitTransaction();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {},
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error(`error in deleteGiveawayPost: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  } finally {
    session.endSession();
  }
};

module.exports = {
  createGiveawayPost,
  saveGiveawayImages,
  editGiveawayAdsImages,
  deleteGiveawayImage,
  getGiveawayPostDetails,
  getAllGiveawayPostList,
  getPostByCategory,
  getGiveawayByUserNearbyLocation,
  getGiveawayByNearbyLocation,
  editGiveawayPost,
  searchGiveaway,
  deleteGiveawayPost,
};
