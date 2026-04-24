const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 60 * 5 });
const Accomodation = require("../models/accomodation.js");
const AdsPost = require("../models/adsPost.js");
const User = require("../models/users.js");
const NonStudent = require("../models/nonStudent.js");
const { searchSchema } = require("../validations/validations.js");
const {
  uploadAccomodationImages,
} = require("../utils/accomodation/handleImages.js");
const {
  updateAccomodationImage,
  getAllAccomodationPost,
  getNotifyAdsId,
} = require("../utils/ads/ads.js");
const {
  createAccomodationUploadUrl,
  deleteAccomodationImages,
} = require("../utils/fileUpload/file.js");
const {
  getAllPostByPropertyType,
  getAllPostByRoomType,
  getAllPostByBedType,
} = require("../utils/accomodation/post.js");
const soldNotificationQueue = require("../utils/queues/soldNotificationQueue.js");
const constants = require("../constants/constants.js");
const { logger } = require("../config/loggerConfig.js");
const { default: mongoose } = require("mongoose");

const createAccomodations = async (req, res) => {
  const session = await Accomodation.startSession();
  session.startTransaction();
  const {
    title,
    description,
    // features,
    propertyType,
    roomType,
    bedType,
    rentSchedule,
    nearbyFacilities,
    amenities,
    price,
    fileNames,
    contentTypes,
    region,
    latitude,
    longitude,
    closestInstitute,
    name,
    email,
    phoneNumber,
    country,
  } = req.body;

  try {
    if (
      !title ||
      !description ||
      !propertyType ||
      !roomType ||
      !bedType ||
      !price ||
      !fileNames ||
      !contentTypes ||
      !region ||
      // !latitude ||
      // !longitude ||
      !closestInstitute ||
      !name ||
      !country
    ) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Missing required* fields",
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
        payload: {}
      });
    }
    const checkPropertyType = ["Hotel",
      "Hostel",
      "Dormitory",
      "Private House",
      "Shared House",];
    if (!checkPropertyType.includes(propertyType)) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "invalid property type",
        payload: {},
      });
    }
    const userId = req.user._id;
    const user = await User.findById(userId).populate('accommodationPlan').session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "User not found",
        payload: {},
      });
    }
    //---------------------------------------------------------------------------------------
    // later work: if profileType is Student then they must select propertyType as "Other"
    //---------------------------------------------------------------------------------------

    if (user.profileType === "Non Student") {
      const nonStudent = await NonStudent.findOne({ userId }).session(session);
      if (
        !nonStudent ||
        nonStudent.nonStudentProfileType !== "Property Manager"
      ) {
        await session.abortTransaction();
        return res.status(constants.httpStatus.badRequest).json({
          status: 0,
          msg: "invalid profile type or incomplete profile",
          payload: {},
        });
      }

      const plan = user.accommodationPlan;
      if (!plan || (user.accommodationPlanExpiresAt && user.accommodationPlanExpiresAt < Date.now())) {
        await session.abortTransaction();
        return res.status(constants.httpStatus.badRequest).json({ status: 0, msg: "Active Subscription Plan required to post accommodation ads." });
      }

      if (plan.adsLimit !== -1 && user.accommodationAdsPostedThisPeriod >= plan.adsLimit) {
        await session.abortTransaction();
        return res.status(constants.httpStatus.badRequest).json({ status: 0, msg: `Monthly ad limit reached (${plan.adsLimit} ads). Please upgrade your plan.` });
      }
    }

    let isFeaturedBanner = false;
    let priorityScore = 0;
    if (user.profileType === "Non Student" && user.accommodationPlan) {
        if (user.accommodationPlan.tier === "Elite") {
            isFeaturedBanner = true;
            priorityScore = 4;
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
    const newAd = await AdsPost.create([{ userId, adsType: "Accomodation" }], {
      session,
    });
    if (!newAd || newAd.length === 0) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Failed to create new ad post",
        payload: {},
      });
    }
    const newAdPost = await Accomodation.create(
      [
        {
          userId,
          adsId: newAd[0]._id,
          title: validTitle,
          description: validDescription,
          propertyType,
          roomType,
          bedType,
          rentSchedule,
          nearbyFacilities: nearbyFacilities ? nearbyFacilities : null,
          amenities,
          price,
          region,
          location,
          closestInstitute,
          name,
          email: isSignInWithoutEmail ? null : email,
          phoneNumber: isSignInWithoutEmail ? phoneNumber : null,
          country: country,
          isFeaturedBanner,
          priorityScore
        },
      ],
      { session }
    );
    if (!newAdPost || newAdPost.length === 0) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 1,
        msg: "Failed to create ad post",
        payload: {},
      });
    }
    user.totalAdsPosted += 1;
    if (user.profileType === "Non Student") {
        user.accommodationAdsPostedThisPeriod += 1;
    }
    await user.save({ session });
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
      const imgUrls = await uploadAccomodationImages(param);
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
    logger.error(`Error in createAccomodation: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  } finally {
    session.endSession();
  }
};

const saveAccomodationImages = async (req, res) => {
  const session = await Accomodation.startSession();
  session.startTransaction();
  const { userId, adsId, fileNames } = req.body;
  const myUserId = req.user._id;
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
      const updateData = await updateAccomodationImage({
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
      adsType: "Accommodation",
      images: updatedImages[0],
      notificationType: "Ads",
      message: `Your Accommodation post is availabe online!`,
    });
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {},
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error(`error in saveAccomodationImages: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      paylaod: {},
    });
  } finally {
    session.endSession();
  }
};

const editAcoomodationAdsImages = async (req, res) => {
  const session = await Accomodation.startSession();
  session.startTransaction();
  const { userId, adsId, fileNames, contentTypes } = req.body;
  const myUserId = req.user._id;
  try {
    if (!userId || !fileNames || !contentTypes) {
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
      const uploadUrl = await createAccomodationUploadUrl(
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
      await updateAccomodationImage(param);
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
    console.log("error in editAccomodationAdsImages", error.message);
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      paylaod: {},
    });
  } finally {
    session.endSession();
  }
};

const deleteAccomodationImage = async (req, res) => {
  const { userId, adsId, fileNames, contentTypes } = req.body;
  const myUserId = req.user._id;
  try {
    if (!userId || !adsId || !fileNames || !contentTypes) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Missing required* fields",
        payload: {},
      });
    }
    if (myUserId.toString() !== userId.toString()) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const ad = await Accomodation.findOne({ adsId });
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
    await deleteAccomodationImages(fileNames, myUserId);
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {},
    });
  } catch (error) {
    logger.error(`error in deleteAccomodationImage: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      paylaod: {},
    });
  }
};

const editAccomodationPost = async (req, res) => {
  const session = await Accomodation.startSession();
  session.startTransaction();
  const {
    title,
    description,
    features,
    propertyType,
    roomType,
    bedType,
    price,
    rentSchedule,
    // fileNames,
    // contentTypes,
    latitude,
    longitude,
    region,
    closestInstitute,
    name,
    email,
    phoneNumber,
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
    const accommodationPost = await Accomodation.findOne({
      _id: id,
      userId,
    }).session(session);
    if (!accommodationPost) {
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
    if (user.profileType === "Student" && propertyType !== "Other") {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "invalid property type selection",
        payload: {},
      });
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
      accommodationPost.location = {
        type: "Point",
        coordinates: [longitude, latitude],
      }
      accommodationPost.region = region;
    }
    accommodationPost.title = title ? title : accommodationPost.title;
    accommodationPost.description = description ? description : accommodationPost.description;
    accommodationPost.features = features ? features : accommodationPost.features;
    accommodationPost.propertyType = propertyType ? propertyType : accommodationPost.propertyType;
    accommodationPost.roomType = roomType ? roomType : accommodationPost.roomType;
    accommodationPost.bedType = bedType ? bedType : accommodationPost.bedType;
    accommodationPost.price = price ? price : accommodationPost.price;
    accommodationPost.rentSchedule = rentSchedule ? rentSchedule : accommodationPost.rentSchedule;
    accommodationPost.region = region ? region : accommodationPost.region;
    accommodationPost.closestInstitute = closestInstitute ? closestInstitute : accommodationPost.closestInstitute;
    accommodationPost.name = name ? name : accommodationPost.name;
    accommodationPost.email = isSignInWithoutEmail ? null : email;
    accommodationPost.phoneNumber = isSignInWithoutEmail ? phoneNumber : null;

    // let updatedImages = [];
    // if (fileNames && contentTypes) {
    //   if (fileNames.length !== contentTypes.length) {
    //     await session.abortTransaction();
    //     session.endSession();
    //     return res.status(constants.httpStatus.badRequest).json({
    //       status: 0,
    //       msg: "File names and content types must match in length",
    //       payload: {},
    //     });
    //   }

    //   const param = { userId, fileNames, contentTypes };
    //   const imgUrls = await uploadAccomodationImages(param);
    //   for (const { fileName, uploadUrl, contentType } of imgUrls) {
    //     updatedImages.push({ fileName, uploadUrl, contentType });
    //   }
    //   accommodationPost.itemImages = updatedImages;
    // }

    await accommodationPost.save({ session });
    await session.commitTransaction();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        accommodationPost,
        // updatedImages,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error in editAccomodationPost: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  } finally {
    session.endSession();
  }
};

const getAllAccomodationPostList = async (req, res) => {
  const { pages = 1, latitude, longitude, country } = req.query;
  try {
    const param = {
      perPage: constants.perPage.pageLimit16,
      page: parseInt(pages, 10) || 1,
      latitude,
      longitude,
      country
    };
    if (param.page < 1) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Invalid page number",
        payload: {},
      });
    }
    const data = await getAllAccomodationPost(req, param);
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
        accomodations: data.accomodations,
        totalPages: data.totalPages,
        totalCount: data.totalCount,
        currentPage: param.page,
      },
    });
  } catch (error) {
    logger.error(`error in getAllAccomodation: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      paylaod: {},
    });
  }
};

const getAccomodationDetails = async (req, res) => {
  const { id } = req.params;
  // const myUserId = req.user._id;
  try {
    const postId = id;
    if (!id) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const post = await Accomodation.findById(postId);
    if (!post) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "Post not found",
        payload: {},
      });
    }
    // if(myUserId.toString() !== post.userId.toString()) {
    //   post.totalViews += 1;
    //   await post.save();
    // }
    post.totalViews += 1;
    await post.save();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        post,
      },
    });
  } catch (error) {
    logger.error(`error in getAccomodationDetails: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      paylaod: {},
    });
  }
};

const getAllFilteredPostListByPropertyType = async (req, res) => {
  const { propertyType, pages, latitude, longitude, country } = req.query;
  try {
    if (!propertyType) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const param = {
      propertyType,
      perPage: constants.perPage.pageLimit16,
      page: parseInt(pages, 10) || 1,
      latitude,
      longitude,
      country
    };
    if (param.page < 1) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Invalid page number",
        payload: {},
      });
    }
    const data = await getAllPostByPropertyType(req, param);
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
        accomodations: data.accomodations,
        totalPages: data.totalPages,
        totalCount: data.totalCount,
        currentPage: param.page,
      },
    });
  } catch (error) {
    logger.error(`error in getAllPostListByPropertyType: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      paylaod: {},
    });
  }
};

const getAllFilteredPostListByRoomType = async (req, res) => {
  const { roomType, pages } = req.query;
  try {
    if (!roomType) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const param = {
      roomType,
      perPage: constants.perPage.pageLimit16,
      page: parseInt(pages, 10) || 1,
      latitude: req.query.latitude,
      longitude: req.query.longitude,
      country: req.query.country
    };
    if (param.page < 1) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Invalid page number",
        payload: {},
      });
    }
    const data = await getAllPostByRoomType(req, param);
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
        accomodations: data.accomodations,
        totalPages: data.totalPages,
        totalCount: data.totalCount,
        currentPage: param.page,
      },
    });
  } catch (error) {
    logger.error(`error in getAllPostListByRoomType: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      paylaod: {},
    });
  }
};

const getAllFilteredPostListByBedType = async (req, res) => {
  const { bedType, pages } = req.query;
  try {
    if (!bedType) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const param = {
      bedType,
      perPage: constants.perPage.pageLimit16,
      page: parseInt(pages, 10) || 1,
      latitude: req.query.latitude,
      longitude: req.query.longitude,
      country: req.query.country
    };
    if (param.page < 1) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Invalid page number",
        payload: {},
      });
    }
    const data = await getAllPostByBedType(req, param);
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
        accomodations: data.accomodations,
        totalPages: data.totalPages,
        totalCount: data.totalCount,
        currentPage: param.page,
      },
    });
  } catch (error) {
    logger.error(`error in getAllPostListByRoomType: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      paylaod: {},
    });
  }
};

const getAllFilteredPostListByFacilities = async (req, res) => {
  try {
  } catch (error) {
    console.log("error in getAllFilteredPostListByFacilities", error.message);
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getFilteredPost = async (req, res) => {
  const {
    propertyType = [],
    roomType = [],
    bedType = [],
    amenities = [],
    nearbyFacilities = [],
    latitude,
    longitude,
    page = 1,
  } = req.query;
  const pages = parseInt(page, 10) || 1;
  const limit = constants.perPage.pageLimit16
  try {
    if (propertyType) {
      if (!Array.isArray(propertyType)) {
        return res.status(constants.httpStatus.badRequest).json({
          status: 0,
          msg: "propertyType must be an array.",
          payload: {},
        });
      }
    }
    if (roomType) {
      if (!Array.isArray(roomType)) {
        return res.status(constants.httpStatus.badRequest).json({
          status: 0,
          msg: "roomType must be an arrays.",
          payload: {},
        });
      }
    }
    if (bedType) {
      if (!Array.isArray(bedType)) {
        return res.status(constants.httpStatus.badRequest).json({
          status: 0,
          msg: "bedType must be an arrays.",
          payload: {},
        });
      }
    }
    if (amenities) {
      if (!Array.isArray(nearbyFacilities)) {
        return res.status(constants.httpStatus.badRequest).json({
          status: 0,
          msg: "nearbyFacilities must be an arrays.",
          payload: {},
        });
      }
    }
    if (nearbyFacilities) {
      if (!Array.isArray(nearbyFacilities)) {
        return res.status(constants.httpStatus.badRequest).json({
          status: 0,
          msg: "nearbyFacilities must be an arrays.",
          payload: {},
        });
      }
    }
    const skip = (pages - 1) * limit;
    const query = {
      isSold: false, isDeleted: false, ...(Array.isArray(req.blockedUserIds) && req.blockedUserIds.length > 0
  ? { userId: { $nin: req.blockedUserIds.map(id => new mongoose.Types.ObjectId(id)) } }
  : {})

    };
    if (propertyType.length > 0) {
      query.propertyType = { $in: propertyType };
    }
    if (roomType.length > 0) {
      query.roomType = { $in: roomType };
    }
    if (bedType.length > 0) {
      query.bedType = { $in: bedType };
    }
    if (amenities.length > 0) {
      query.amenities = { $regex: amenities.join("|"), $options: "i" }
    }
    if (nearbyFacilities.length > 0) {
      query.nearbyFacilities = { $regex: nearbyFacilities.join("|"), $options: "i" };
    }
    const { country } = req.query;
    if (latitude && longitude || country) {
      const orConditions = [];
      if (country) orConditions.push({ country: country });
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
      query.$or = orConditions;
    } else {
      // Enforce strict local visibility: Show nothing if location info is missing
      query._id = null;
    }
    const accommodations = await Accomodation.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalCount = await Accomodation.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);
    return res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        results: accommodations,
        meta: {
          totalItems: totalCount,
          totalPages,
          currentPage: pages,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error) {
    logger.error(`Error in getFilteredPost: ${error.message}`, { error });
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

const getAccommodationByUserNearbyLocation = async (req, res) => {
  const { page = 1 } = req.query;
  try {
    const userId = req.user._id;
    const limit = constants.perPage.pageLimit16;
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
    const userLocation = user.regionUpdate.coordinates;
    const maxDistanceInRadians = constants.location.reach / constants.location.radian;

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

    }
    const totalAds = await Accomodation.countDocuments(filter);
    const totalPages = Math.ceil(totalAds / limit);
    if (pageNumber > totalPages && totalPages !== 0) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Page number exceeds total pages",
        payload: {},
      });
    }
    const nearbyAccommodation = await Accomodation.find(filter)
      .skip((pageNumber - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        nearbyAds: nearbyAccommodation,
        meta: {
          currentPage: pageNumber,
          totalPages,
          totalAds,
          adsPerPage: limit
        },
      },
    });
  } catch (error) {
    logger.error(`Error in getAccomodationByUserNearbyLocation: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

const getAccommodationByNearbyLocation = async (req, res) => {
  const { latitude, longitude, country, page = 1 } = req.query;
  try {
    if (!latitude && !longitude && !country) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Missing location parameters (coordinates or country)",
        payload: {},
      });
    }
    const limit = constants.perPage.pageLimit16;
    const pageNumber = parseInt(page, 10);
    if (isNaN(pageNumber) || pageNumber <= 0) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Invalid page number",
        payload: {},
      });
    }
    
    const filter = {
      isSold: false,
      isDeleted: false,
      ...(Array.isArray(req.blockedUserIds) && req.blockedUserIds.length > 0
        ? { userId: { $nin: req.blockedUserIds.map(id => new mongoose.Types.ObjectId(id)) } }
        : {})
    };

    const orConditions = [];
    if (country) orConditions.push({ country: country });
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
    filter.$or = orConditions;

    const totalAds = await Accomodation.countDocuments(filter);
    const totalPages = Math.ceil(totalAds / limit);
    if (pageNumber > totalPages && totalPages !== 0) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "Page number exceeds total pages",
        payload: {},
      });
    }
    const nearbyAccommodation = await Accomodation.find(filter)
      .skip((pageNumber - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        nearbyAds: nearbyAccommodation,
        meta: {
          currentPage: pageNumber,
          totalPages,
          totalAds,
          adsPerPage: limit
        },
      },
    });
  } catch (error) {
    logger.error(`Error in getAccommodationByNearbyLocation: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: `Something went wrong ${error.message}`,
      payload: {},
    });
  }
};

const getTopRatedAccommodations = async (req, res) => {
    const { latitude, longitude, country, page = 1 } = req.query;
    const limit = constants.perPage.pageLimit16;
    try {
      if (!latitude && !longitude && !country) {
        return res.status(constants.httpStatus.badRequest).json({
          status: 0,
          msg: "Missing location parameters (coordinates or country)",
          payload: {},
        });
      }
    const pageNumber = parseInt(page, 10);
    if (isNaN(pageNumber) || pageNumber <= 0) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Invalid page number",
        payload: {},
      });
    }
    const filter = {
      isSold: false,
      isDeleted: false,
      averageRatings: { $gt: 3 },
      ...(Array.isArray(req.blockedUserIds) && req.blockedUserIds.length > 0
        ? { userId: { $nin: req.blockedUserIds.map(id => new mongoose.Types.ObjectId(id)) } }
        : {})
    };

    const orConditions = [];
    if (country) orConditions.push({ country: country });
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
    filter.$or = orConditions;
    const totalAds = await Accomodation.countDocuments(filter);
    const totalPages = Math.ceil(totalAds / limit);
    if (pageNumber > totalPages && totalPages !== 0) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "Page number exceeds total pages",
        payload: {},
      });
    }
    const topRatedAccommodations = await Accomodation.find(filter)
      .sort({
        ratingScore: -1,
        averageRatings: -1,
        totalRatings: -1,
        createdAt: -1,
      })
      .skip((pageNumber - 1) * limit)
      .limit(limit);

    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        topRatedAds: topRatedAccommodations,
        meta: {
          currentPage: pageNumber,
          totalPages,
          totalAds,
          adsPerPage: limit
        },
      },
    });
  } catch (error) {
    logger.error(`Error in getTopRatedAccommodations: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: `Something went wrong: ${error.message}`,
      payload: {},
    });
  }
};

const searchAccomodations = async (req, res) => {
  try {
    const {
      keyword,
      latitude,
      longitude,
      page = 1,
    } = searchSchema.parse({
      keyword: req.query.keyword,
      page: req.query.page ? parseInt(req.query.page) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      latitude: req.query.latitude,
      longitude: req.query.longitude,
    });
    const limit = constants.perPage.pageLimit16;
    const skip = (page - 1) * limit;
    const cacheKey = `search:${keyword}:${latitude}:${longitude}:${page}:${limit}`;
    const cachedResults = cache.get(cacheKey);
    if (cachedResults) {
      return res.status(constants.httpStatus.ok).json({
        status: 1,
        msg: "Search results retrieved successfully from cache",
        payload: cachedResults.payload,
        pagination: cachedResults.pagination,
      });
    }
    const searchCriteria = {
      isSold: false, isDeleted: false,
      ...(Array.isArray(req.blockedUserIds) && req.blockedUserIds.length > 0
  ? { userId: { $nin: req.blockedUserIds.map(id => new mongoose.Types.ObjectId(id)) } }
  : {})

    };
    if (keyword) {
      searchCriteria.$text = { $search: keyword };
    }
    const { country } = req.query;
    if (latitude && longitude || country) {
      const orConditions = [];
      if (country) orConditions.push({ country: country });
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
      searchCriteria.$or = orConditions;
    } else {
      // Enforce local-only search: Show nothing if location info is missing
      searchCriteria._id = null;
    }
    const accomodations = await Accomodation.find(searchCriteria)
      .skip(skip)
      .select(
        "_id userId adsId title description itemImages price propertyType region name totalViews createdAt"
      )
      .limit(parseInt(limit));

    if (!accomodations) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "No accommodations found",
        payload: [],
      });
    }
    const payload = accomodations;
    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      totalResults: accomodations.length,
    };
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
    logger.error(`error in searchAccomodations: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong during the search",
      payload: {},
    });
  }
};

const deleteAccomodationPost = async (req, res) => {
  const session = await Accomodation.startSession();
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
    if (myUserId.toString() !== userId.toString()) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const post = await Accomodation.findOne({ adsId: postId }).session(session);
    if (!post) {
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
        msg: "user not found",
        payload: {},
      });
    }
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
    logger.error(`error in deleteAccomodationPost: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  } finally {
    session.endSession();
  }
};

const boostAccomodation = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId).populate('accommodationPlan');
    if (!user) {
      return res.status(constants.httpStatus.notFound).json({ status: 0, msg: "User not found" });
    }

    if (user.profileType !== "Non Student") {
      return res.status(constants.httpStatus.badRequest).json({ status: 0, msg: "Only property managers can boost accommodations" });
    }

    const plan = user.accommodationPlan;
    if (!plan || (user.accommodationPlanExpiresAt && user.accommodationPlanExpiresAt < Date.now())) {
      return res.status(constants.httpStatus.badRequest).json({ status: 0, msg: "Active Subscription Plan required to boost." });
    }

    if (plan.boostLimit !== -1 && user.accommodationBoostsUsed >= plan.boostLimit) {
      return res.status(constants.httpStatus.badRequest).json({ status: 0, msg: `Boost limit reached (${plan.boostLimit} boosts used).` });
    }

    const ad = await Accomodation.findOne({ _id: id, userId });
    if (!ad) {
      return res.status(constants.httpStatus.notFound).json({ status: 0, msg: "Accommodation ad not found" });
    }

    if (ad.isBoosted && (!ad.boostExpiresAt || ad.boostExpiresAt > Date.now())) {
      return res.status(constants.httpStatus.badRequest).json({ status: 0, msg: "Ad is already boosted" });
    }

    let priorityScore = 0;
    if (plan.tier === "Starter") priorityScore = 1;
    if (plan.tier === "Pro") priorityScore = 2;
    if (plan.tier === "Elite") priorityScore = 3;

    // Feature banner remains 4 if Elite, so don't downgrade it to 3 if Elite boosts.
    if (ad.isFeaturedBanner) {
      priorityScore = 4;
    }

    ad.isBoosted = true;
    ad.priorityScore = priorityScore;
    ad.boostExpiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
    await ad.save();

    user.accommodationBoostsUsed += 1;
    await user.save();

    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "Accommodation boosted successfully",
      payload: { ad }
    });

  } catch (error) {
    logger.error(`Error in boostAccomodation: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({ status: 0, msg: "Something went wrong" });
  }
};

const getFeaturedBanners = async (req, res) => {
  const { pages = 1, latitude, longitude, country } = req.query;
  try {
    const param = {
      perPage: constants.perPage.pageLimit16,
      page: parseInt(pages, 10) || 1,
      latitude,
      longitude,
      country
    };
    if (param.page < 1) {
      return res.status(constants.httpStatus.badRequest).json({ status: 0, msg: "Invalid page number", payload: {} });
    }
    const { getFeaturedBannerPosts } = require("../utils/accomodation/post.js");
    const data = await getFeaturedBannerPosts(param);
    if (data === false) {
      return res.status(constants.httpStatus.badRequest).json({ status: 0, msg: "internal server error", payload: {} });
    }
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        accomodations: data.accomodations,
        totalPages: data.totalPages,
        totalCount: data.totalCount,
        currentPage: param.page,
      },
    });
  } catch (error) {
    logger.error(`error in getFeaturedBanners: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({ status: 0, msg: "something went wrong", payload: {} });
  }
};

const getBoostedAds = async (req, res) => {
  const { pages = 1, latitude, longitude, country } = req.query;
  try {
    const param = {
      perPage: constants.perPage.pageLimit16,
      page: parseInt(pages, 10) || 1,
      latitude,
      longitude,
      country
    };
    if (param.page < 1) {
      return res.status(constants.httpStatus.badRequest).json({ status: 0, msg: "Invalid page number", payload: {} });
    }
    const { getBoostedAdsPosts } = require("../utils/accomodation/post.js");
    const data = await getBoostedAdsPosts(param);
    if (data === false) {
      return res.status(constants.httpStatus.badRequest).json({ status: 0, msg: "internal server error", payload: {} });
    }
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        accomodations: data.accomodations,
        totalPages: data.totalPages,
        totalCount: data.totalCount,
        currentPage: param.page,
      },
    });
  } catch (error) {
    logger.error(`error in getBoostedAds: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({ status: 0, msg: "something went wrong", payload: {} });
  }
};

module.exports = {
  createAccomodations,
  saveAccomodationImages,
  editAcoomodationAdsImages,
  deleteAccomodationImage,
  editAccomodationPost,
  getAllAccomodationPostList,
  getAccomodationDetails,
  getAllFilteredPostListByPropertyType,
  getAllFilteredPostListByRoomType,
  getAllFilteredPostListByBedType,
  getAllFilteredPostListByFacilities,
  getFilteredPost,
  getAccommodationByUserNearbyLocation,
  getAccommodationByNearbyLocation,
  getTopRatedAccommodations,
  searchAccomodations,
  deleteAccomodationPost,
  boostAccomodation,
  getFeaturedBanners,
  getBoostedAds
};
