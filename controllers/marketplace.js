const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 60 * 5 });
const User = require("../models/users.js");
const NonStudent = require("../models/nonStudent.js");
const AdsPost = require("../models/adsPost.js");
const Marketplace = require("../models/marketplace.js");
const { default: mongoose } = require("mongoose");
const {
  createMarketplaceUploadUrl,
  deleteMarketplaceImages,
} = require("../utils/fileUpload/file.js");
const {
  uploadMarketplaceImages,
} = require("../utils/marketplace/handleImage.js");
const {
  updateMarketplaceImage,
  getAllMarketPlacePost,
  getNotifyAdsId,
} = require("../utils/ads/ads.js");
const { searchSchema } = require("../validations/validations.js");
const soldNotificationQueue = require("../utils/queues/soldNotificationQueue.js");
const constants = require("../constants/constants.js");
const { logger } = require("../config/loggerConfig.js");

const createMarketplacePost = async (req, res) => {
  const session = await Marketplace.startSession();
  session.startTransaction();
  const {
    category,
    uploadType,
    shopName,
    shopLocation,
    title,
    description,
    price,
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
      !price ||
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
        payload: {}
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
        return res.status(constants.httpStatus.conflict).json({
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
      // if(user.regionUpdate === null) {
      //   return res.status(constants.httpStatus.badRequest).json({
      //     status: 0,
      //     msg: "user location not found",
      //     payload: {}
      //   });
      // }
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
    const newAd = await AdsPost.create([{ userId, adsType: "Marketplace" }], {
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
    const newAdPost = await Marketplace.create(
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
          price,
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
      return res.status(constants.httpStatus.badRequest).json({
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
      const imgUrls = await uploadMarketplaceImages(param);
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
    logger.error(`error in createMarketplacePost: ${error.message}`, { error });
    await session.abortTransaction();
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: `Error in createMarketplacePost: ${error.message || "Something went wrong"
        }`,
      payload: {},
    });
  } finally {
    session.endSession();
  }
};

const saveMarketplaceImages = async (req, res) => {
  const session = await Marketplace.startSession();
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
      const updateData = await updateMarketplaceImage({
        userId,
        adsId,
        adsType: "Marketplace",
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
      adsType: "Marketplace",
      images: updatedImages[0],
      notificationType: "Ads",
      message: `Your ad is availabe online!`
    });
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {},
    });
  } catch (error) {
    logger.error(`error in saveMarketplaceImages: ${error.message}`, { error });
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

const editMarketplaceAdsImages = async (req, res) => {
  const session = await Marketplace.startSession();
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
      const uploadUrl = await createMarketplaceUploadUrl(
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
      await updateMarketplaceImage(param);
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
    logger.error(`error in editMarketplaceAdsImages: ${error.message}`, { error });
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

const deleteMarketplaceImage = async (req, res) => {
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
    const ad = await Marketplace.findOne({ adsId });
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
    await deleteMarketplaceImages(fileNames, myUserId);
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {},
    });
  } catch (error) {
    logger.error(`error in deleteMarketplaceImage: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      paylaod: {},
    });
  }
};

const getAllMarketplacePostList = async (req, res) => {
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
    const data = await getAllMarketPlacePost(req, param);
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
        totalPages: data.totalPages,
        totalCount: data.totalCount,
        currentPage: param.page,
      },
    });
  } catch (error) {
    logger.error(`error in getAllAccomodationPostList: ${error.message}`, { error });
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

    }

    const totalCount = await Marketplace.countDocuments(filter);
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
    const pageSize = param.perPage;
    const page = param.page;
    const totalPages = Math.ceil(totalCount / pageSize);
    if (page > totalPages) {
      return res.status(constants.httpStatus.ok).json({
        status: 1,
        msg: "No more posts",
        payload: {
          posts: [],
          totalPages,
          totalCount,
          currentPage: page,
        },
      });
    }
    const skip = (page - 1) * pageSize;
    const posts = await Marketplace.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .exec();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        posts,
        totalPages,
        totalCount,
        currentPage: page,
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

const getMarketplacePostDetails = async (req, res) => {
  const { id } = req.params;
  // const myUserId = req.user._id;
  const postId = id;
  try {
    const post = await Marketplace.findById(postId);
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
    logger.error(`error in getMarketplacePostDetails: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      paylaod: {},
    });
  }
};

const getMarketplaceByUserNearbyLocation = async (req, res) => {
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
      isDeleted: false,
      ...(Array.isArray(req.blockedUserIds) && req.blockedUserIds.length > 0
        ? { userId: { $nin: req.blockedUserIds.map(id => new mongoose.Types.ObjectId(id)) } }
        : {})
      ,
    };

    const totalAds = await Marketplace.countDocuments(filter);
    const totalPages = Math.ceil(totalAds / adsPerPage);
    if (pageNumber > totalPages && totalPages !== 0) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "Page number exceeds total pages",
        payload: {},
      });
    }
    const nearbyMarketplace = await Marketplace.find(filter)
      .skip((pageNumber - 1) * adsPerPage)
      .limit(adsPerPage)
      .sort({ createdAt: -1 });

    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        nearbyAds: nearbyMarketplace,
        meta: {
          currentPage: pageNumber,
          totalPages,
          totalAds,
          adsPerPage,
        },
      },
    });
  } catch (error) {
    console.error("Error in getMarketplaceByUserNearbyLocation:", error.message);
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

const getMarketplaceByNearbyLocation = async (req, res) => {
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
    const reach = constants.location.reach;
    const radian = constants.location.radian;
    const userLocation = [parseFloat(longitude), parseFloat(latitude)];
    const maxDistanceInRadians = reach / radian;
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
    const totalAds = await Marketplace.countDocuments(filter);
    const totalPages = Math.ceil(totalAds / adsPerPage);
    if (pageNumber > totalPages && totalPages !== 0) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "Page number exceeds total pages",
        payload: {},
      });
    }
    const nearbyMarketplace = await Marketplace.find(filter)
      .skip((pageNumber - 1) * adsPerPage)
      .limit(adsPerPage)
      .sort({ createdAt: -1 });

    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        nearbyAds: nearbyMarketplace,
        meta: {
          currentPage: pageNumber,
          totalPages,
          totalAds,
          adsPerPage,
        },
      },
    });
  } catch (error) {
    logger.error(`Error in getMarketplaceByNearbyLocation: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

const editMarketplacePost = async (req, res) => {
  const session = await Marketplace.startSession();
  session.startTransaction();
  const {
    category,
    uploadType,
    shopName,
    shopLocation,
    title,
    description,
    price,
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
    const marketplacePost = await Marketplace.findOne({
      _id: id,
      userId,
    }).session(session);
    if (!marketplacePost) {
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
      return res.status(constants.httpStatus.badRequest).json({
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
        return res.status(constants.httpStatus.notFound).json({
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
      marketplacePost.location = {
        type: "Point",
        coordinates: [longitude, latitude],
      }
      marketplacePost.region = region;
    }
    marketplacePost.category = category ? category : marketplacePost.category;
    marketplacePost.uploadType = uploadType ? uploadType : marketplacePost.uploadType;
    marketplacePost.title = title ? title : marketplacePost.title;
    marketplacePost.description = description ? description : marketplacePost.description;
    marketplacePost.price = price ? price : marketplacePost.price;
    // marketplacePost.region = region ? region : marketplacePost.region;
    marketplacePost.closestInstitute = closestInstitute ? closestInstitute : marketplacePost.closestInstitute;
    marketplacePost.name = name ? name : marketplacePost.name;
    marketplacePost.email = isSignInWithoutEmail ? null : email;
    marketplacePost.phoneNumber = isSignInWithoutEmail ? phoneNumber : null;

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
    //   const imgUrls = await uploadMarketplaceImages(param);
    //   for (const { fileName, uploadUrl, contentType } of imgUrls) {
    //     updatedImages.push({ fileName, uploadUrl, contentType });
    //   }
    //   marketplacePost.itemImages = updatedImages;
    // }

    await marketplacePost.save({ session });
    if (flag === true) {
      await nonStudent.save({ session });
    }
    await session.commitTransaction();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        marketplacePost,
        // updatedImages,
      },
    });
  } catch (error) {
    logger.error(`error in editMarketplacePost: ${error.message}`, { error });
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

const searchMarketplace = async (req, res) => {
  try {
    const { keyword, latitude, longitude, page = 1, limit = 16 } = searchSchema.parse({
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
        msg: "Search results retrieved successfully from cache",
        payload: cachedResults.payload,
        pagination: cachedResults.pagination,
      });
    }
    const searchCriteria = {
      ...(Array.isArray(req.blockedUserIds) && req.blockedUserIds.length > 0
        ? { userId: { $nin: req.blockedUserIds.map(id => new mongoose.Types.ObjectId(id)) } }
        : {})

    };
    if (keyword) {
      searchCriteria.$text = { $search: keyword };
    }
    if (latitude && longitude) {
      const reach = constants.location.reach;
      const radian = constants.location.radian;
      const userLocation = [parseFloat(longitude), parseFloat(latitude)];
      const maxDistanceInRadians = reach / radian;

      searchCriteria["location.coordinates"] = {
        $geoWithin: {
          $centerSphere: [userLocation, maxDistanceInRadians],
        },
      };
    }
    const marketplace = await Marketplace.find(searchCriteria)
      .skip(skip)
      .select("_id userId adsId title description price itemImages totalLikes region name totalViews createdAt")
      .limit(parseInt(limit));

    if (!marketplace) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "No marketplace found",
        payload: [],
      });
    }
    const payload = marketplace;
    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      totalResults: marketplace.length,
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
    logger.error(`error in searchMarketplace: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

const deleteMarketplacePost = async (req, res) => {
  const session = await Marketplace.startSession();
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
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const post = await Marketplace.findOne({ adsId: postId }).session(session);
    if (!post) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
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
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "user not found",
        payload: {},
      });
    }
    // await Marketplace.findOneAndDelete({ adsId: postId }).session(session);
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
    logger.error(`error in deleteMarketplacePost: ${error.message}`, { error });
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

module.exports = {
  createMarketplacePost,
  saveMarketplaceImages,
  editMarketplaceAdsImages,
  deleteMarketplaceImage,
  getMarketplacePostDetails,
  getAllMarketplacePostList,
  getPostByCategory,
  getMarketplaceByUserNearbyLocation,
  getMarketplaceByNearbyLocation,
  editMarketplacePost,
  searchMarketplace,
  deleteMarketplacePost,
};
