const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 60 * 5 });
const Event = require("../models/event.js");
const User = require("../models/users.js");
const NonStudent = require("../models/nonStudent.js");
const AdsPost = require("../models/adsPost.js");
const UserActivity = require("../models/userActivity.js");
const EventComment = require("../models/eventComment.js");
const { uploadEventImages } = require("../utils/event/handleImages.js");
const {
  updateEventImage,
  getAllEventPost,
  getNotifyAdsId,
} = require("../utils/ads/ads.js");
const {
  createEventUploadUrl,
  deleteEventImages,
} = require("../utils/fileUpload/file.js");
const { searchSchema } = require("../validations/validations.js");
const constants = require("../constants/constants.js");
const soldNotificationQueue = require("../utils/queues/soldNotificationQueue.js");
const { logger } = require("../config/loggerConfig.js");
const { default: mongoose } = require("mongoose");

const createEvent = async (req, res) => {
  const session = await Event.startSession();
  session.startTransaction();

  const {
    title,
    description,
    date,
    time,
    category,
    entryType,
    region,
    latitude,
    longitude,
    closestInstitute,
    name,
    email,
    phoneNumber,
    fileNames,
    contentTypes,

    // Currency fields
    country, // "India", "USA"
    userCurrency, // "INR", "USD"
    currencySymbol, // "₹", "$"
    feeHandling,
    ticketsStructure,
} = req.body;

  try {
    const validTitle = (title || '').trim();
    const validDescription = (description || '').trim();
    if (!validTitle || !validDescription) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.validationError).json({
        status: 0,
        msg: "Invalid title or description",
        payload: {}
      });
    }

    const userId = req.user._id;
    const user = await User.findById(userId).session(session);

    if (!user) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "User not found",
        payload: {},
      });
    }
    if (user.profileType === "Student") {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Invalid profile type",
        payload: {},
      });
    }
    if (user.profileType === "Non Student") {
      const nonStudent = await NonStudent.findOne({ userId }).session(session);
      if (!nonStudent || nonStudent.nonStudentProfileType !== "Event Manager") {
        await session.abortTransaction();
        return res.status(constants.httpStatus.badRequest).json({
          status: 0,
          msg: "Invalid profile type or profile not created",
          payload: {},
        });
      }
    }

    // STRIPE CONNECTION VALIDATION (MANDATORY FOR PAID EVENTS)
    if (entryType === "Paid") {
      // Check if user has Stripe account
      if (!user.stripeAccountId) {
        await session.abortTransaction();
        return res.status(constants.httpStatus.badRequest).json({
          status: 0,
          msg: "Stripe account required. Please connect your Stripe account in Settings before creating paid events.",
          payload: {
            requiresStripeConnection: true,
            redirectTo: "/settings/stripe",
          },
        });
      }

      // Verify onboarding is complete and charges are enabled
      if (!user.stripeChargesEnabled) {
        await session.abortTransaction();
        return res.status(constants.httpStatus.badRequest).json({
          status: 0,
          msg: "Stripe onboarding incomplete. Please complete your Stripe account setup before creating paid events.",
          payload: {
            requiresStripeOnboarding: true,
            stripeAccountId: user.stripeAccountId,
            redirectTo: "/settings/stripe/onboarding",
          },
        });
      }

      // Optional: Log country mismatch warning (not error, Stripe handles cross-border)
      if (country && user.stripeAccountCountry) {
        const countryCodeMap = {
          "India": "IN",
          "USA": "US",
          "Ghana": "GH"
        };
        const expectedCountryCode = countryCodeMap[country];
        if (expectedCountryCode && user.stripeAccountCountry !== expectedCountryCode) {
          logger.warn(`Event country mismatch: Event ${country} (${expectedCountryCode}) vs Stripe account ${user.stripeAccountCountry}`, {
            userId: userId.toString(),
            eventCountry: country,
            stripeCountry: user.stripeAccountCountry
          });
        }
      }
    }

    if (!email/*  && !phoneNumber */) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Email or phone required",
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
    /*   if (phoneNumber && user.phoneNumber !== phoneNumber) {
        await session.abortTransaction();
        return res.status(constants.httpStatus.badRequest).json({
          status: 0,
          msg: "Phone number must be same as verified one",
          payload: {},
        });
      } */

    // ... existing user validation ...

    // ---------- LOCATION HANDLING ----------
    let location = null;

    if (req.body.location && Array.isArray(req.body.location.coordinates)) {
      const [lng, lat] = req.body.location.coordinates;
      if (typeof lng === 'number' && typeof lat === 'number' && !Number.isNaN(lng) && !Number.isNaN(lat)) {
        location = { type: 'Point', coordinates: [lng, lat] };
      }
    }

    if (!location && latitude != null && longitude != null) {
      const lng = Number(longitude);
      const lat = Number(latitude);
      if (!Number.isNaN(lng) && !Number.isNaN(lat)) {
        location = { type: 'Point', coordinates: [lng, lat] };
      }
    }

    if (!location && user.regionUpdate && Array.isArray(user.regionUpdate.coordinates)) {
      const coords = user.regionUpdate.coordinates;
      if (coords.length === 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
        location = { type: 'Point', coordinates: [coords[0], coords[1]] };
      }
    }

    if (!location) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Valid location coordinates are required",
        payload: {},
      });
    }

    // ---------- TICKET STRUCTURE PROCESSING ----------
    let normalizedTickets = [];
    let calculatedTotalSeats = 0;

    if (entryType === "Paid") {
      // Validate currency for paid events
      if (!country || !userCurrency || !currencySymbol) {
        await session.abortTransaction();
        return res.status(constants.httpStatus.badRequest).json({
          status: 0,
          msg: "Country, currency, and currency symbol are required for paid events",
          payload: {},
        });
      }

      if (!feeHandling) {
        await session.abortTransaction();
        return res.status(constants.httpStatus.badRequest).json({
          status: 0,
          msg: "feeHandling is required for paid events",
          payload: {},
        });
      }

      if (!Array.isArray(ticketsStructure) || ticketsStructure.length === 0) {
        await session.abortTransaction();
        return res.status(constants.httpStatus.badRequest).json({
          status: 0,
          msg: "ticketsStructure is required for Paid events",
          payload: {},
        });
      }

      for (const ticket of ticketsStructure) {
        if (!ticket.type || ticket.price == null || ticket.totalSeats == null) {
          await session.abortTransaction();
          return res.status(constants.httpStatus.badRequest).json({
            status: 0,
            msg: "Each ticket must have type, price, and totalSeats",
            payload: {},
          });
        }

        if (!['EARLYBIRD', 'VIP', 'VVIP', 'GENERAL'].includes(ticket.type)) {
          await session.abortTransaction();
          return res.status(constants.httpStatus.badRequest).json({
            status: 0,
            msg: "Invalid ticket type. Must be EARLYBIRD, VIP, VVIP, or GENERAL",
            payload: {},
          });
        }

        const seats = Number(ticket.totalSeats);
        const price = Number(ticket.price);
        calculatedTotalSeats += seats;

        normalizedTickets.push({
          type: ticket.type,
          price,
          totalSeats: seats,
          availableSeats: seats,
          includedServices: ticket.includedServices || [],
        });
      }
    } else {
      // Free events: no ticket type, price, or fee handling needed
      // Figma shows: Seats Available (Total Seats) and Includes (Included Services)
      if (req.body.totalSeats == null) {
        await session.abortTransaction();
        return res.status(constants.httpStatus.badRequest).json({
          status: 0,
          msg: "totalSeats is required for Free events",
          payload: {},
        });
      }

      const seats = Number(req.body.totalSeats);
      calculatedTotalSeats = seats;

      if (req.body.includedServices && Array.isArray(req.body.includedServices)) {
         normalizedTickets.push({
           type: 'GENERAL', // Default type for free events
           price: 0,
           totalSeats: seats,
           availableSeats: seats,
           includedServices: req.body.includedServices
         });
      } else {
         normalizedTickets.push({
           type: 'GENERAL',
           price: 0,
           totalSeats: seats,
           availableSeats: seats,
           includedServices: []
         });
      }
    }

    // ---------- CREATE ADS POST ----------
    const newAd = await AdsPost.create(
      [{ userId, adsType: "Event" }],
      { session }
    );

    if (!newAd || newAd.length === 0) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Failed to create new ad post",
        payload: {},
      });
    }

    // ---------- BUILD EVENT DOCUMENT ----------
    const eventDoc = {
      userId,
      adsId: newAd[0]._id,
      title: validTitle,
      description: validDescription,
      date,
      time,
      category,
      entryType,
      region,
      feeHandling,
      location,

      // Currency fields
      country: country || null,
      currency: userCurrency || null,
      currencySymbol: currencySymbol || null,

      closestInstitute,
      name,
      email: isSignInWithoutEmail ? null : email,
      phoneNumber: isSignInWithoutEmail ? phoneNumber : null,

      // Ticket system fields
      ticketsStructure: normalizedTickets,
      totalSeats: calculatedTotalSeats,
      availableSeats: calculatedTotalSeats,
    };

    // ---------- HANDLE IMAGE UPLOADS ----------
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
      const imgUrls = await uploadEventImages(param);

      // Store public URLs in itemImages array
      // Generate the public URLs that will be stored in text/database
      AdsImages = imgUrls.map(({ uploadUrl }) => {
          // You must strip the query parameters (signature) to get the public readable URL
          return uploadUrl.split("?")[0];
      });
      eventDoc.itemImages = AdsImages;
    }

    // ---------- CREATE EVENT ----------
    const newEvent = await Event.create([eventDoc], { session });

    if (!newEvent || newEvent.length === 0) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Failed to create event",
        payload: {},
      });
    }

    // ---------- UPDATE USER STATS ----------
    user.totalAdsPosted += 1;
    await user.save({ session });
    user.password = undefined;

    await session.commitTransaction();
    return res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "Success",
      payload: {
        event: newEvent[0],
        uploadUrls: AdsImages,
      },
    });

  } catch (error) {
    console.error("Error in createEvent:", error);
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

const saveEventImages = async (req, res) => {
  const session = await Event.startSession();
  session.startTransaction();
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
    const myUserId = req.user._id.toString();
    if (myUserId !== userId) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const updatedImages = [];
    for (const singleFileName of fileNames) {
      const updateData = await updateEventImage({
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
      adsType: constants.adsType.event,
      images: updatedImages[0],
      notificationType: constants.notificationType.ads,
      message: constants.notificationMessage.ads,
    });
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {},
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error(`error in saveEventImages: : ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  } finally {
    session.endSession();
  }
};

const editEventImages = async (req, res) => {
  const session = await Event.startSession();
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
      const uploadUrl = await createEventUploadUrl(
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
      await updateEventImage(param);
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
    logger.error(`error in editEventImages: : ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  } finally {
    session.endSession();
  }
};

const deleteEventImage = async (req, res) => {
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
    const ad = await Event.findOne({ adsId });
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
    await deleteEventImages(fileNames, myUserId);
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {},
    });
  } catch (error) {
    logger.error(`error in deleteEventImages: : ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const editEventPost = async (req, res) => {
  const session = await Event.startSession();
  session.startTransaction();
  const {
    title,
    description,
    date,
    time,
    category,
    entryType,
    amount,
    totalSeats,
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
    const eventPost = await Event.findOne({
      _id: id,
      userId,
    }).session(session);
    if (!eventPost) {
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
      eventPost.location = {
        type: "Point",
        coordinates: [longitude, latitude],
      }
      eventPost.region = region;
    }
    eventPost.title = title ? title : eventPost.title;
    eventPost.description = description ? description : eventPost.description;
    eventPost.date = date ? date : eventPost.date;
    eventPost.time = time ? time : eventPost.time;
    eventPost.category = category ? category : eventPost.category;
    eventPost.entryType = entryType ? entryType : eventPost.entryType;
    eventPost.amount = amount ? amount : eventPost.amount;
    eventPost.totalSeats = totalSeats ? totalSeats : eventPost.totalSeats;
    eventPost.region = region ? region : eventPost.region;
    eventPost.closestInstitute = closestInstitute ? closestInstitute : eventPost.closestInstitute;
    eventPost.name = name ? name : eventPost.name;
    eventPost.email = isSignInWithoutEmail ? null : email;
    eventPost.phoneNumber = isSignInWithoutEmail ? phoneNumber : null;

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
    //   const imgUrls = await uploadEventImages(param);
    //   for (const { fileName, uploadUrl, contentType } of imgUrls) {
    //     updatedImages.push({ fileName, uploadUrl, contentType });
    //   }
    //   eventPost.itemImages = updatedImages;
    // }
    await eventPost.save({ session });
    await session.commitTransaction();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        eventPost,
        // updatedImages,
      },
    });
  } catch (error) {
    logger.error(`error in editEventPost: : ${error.message}`, { error });
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

const getAllEventPostList = async (req, res) => {
  const { pages = 1 } = req.query;
  try {
    const param = {
      perPage: constants.perPage.pageLimit16,
      page: parseInt(pages, 10) || 1,
    };
    if (param.page < 1) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Invalid page number",
        payload: {},
      });
    }
    const data = await getAllEventPost(req, param);
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
        totalPages: data.totalPages,
        totalCount: data.totalCount,
        currentPage: param.page,
      },
    });
  } catch (error) {
    logger.error(`error in getAllEventPostList: : ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getEventDetails = async (req, res) => { 
  const { id } = req.params;
  // const myUserId = req.user._id;
  try {
    const postId = id;
    const post = await Event.findById(postId).populate({
      path: "userId",
      select: "name profileImage",
    });
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
    //     logger.error(`error in getEventDetails: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getTrendingEvents = async (req, res) => {
  const { latitude, longitude, pages = 1 } = req.query;
  console.log(latitude, longitude);
  try {
    if (!latitude || !longitude) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const pageNumber = parseInt(pages, 10);
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
      isEventCompleted: false,
      totalViews: { $gte: 50 },
      ...(Array.isArray(req.blockedUserIds) && req.blockedUserIds.length > 0
        && { userId: { $nin: req.blockedUserIds.map(id => new mongoose.Types.ObjectId(id)) } }
      )

    }
    const totalAds = await Event.countDocuments(filter);
    console.log(totalAds)
    const totalPages = Math.ceil(totalAds / constants.perPage.pageLimit16);
    if (pageNumber > totalPages && totalPages !== 0) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "Page number exceeds total pages",
        payload: {},
      });
    }
    const trendingEvent = await Event.find(filter)
      .skip((pageNumber - 1) * constants.perPage.pageLimit16)
      .limit(constants.perPage.pageLimit16)
      .sort({ createdAt: -1 });

    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        trendingEvents: trendingEvent,
        meta: {
          currentPage: pageNumber,
          totalPages,
          totalAds,
          adsPerPage: constants.perPage.pageLimit16,
        },
      },
    });
  } catch (error) {
    console.log(`error in getTrendingEvents: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getEventByUserNearbyLocation = async (req, res) => {
  const { page = 1 } = req.query;
  try {
    const userId = req.user._id;
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
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "User location not available",
        payload: {},
      });
    }
    const userLocation = user.regionUpdate.coordinates;
    const maxDistanceInRadians =
      constants.location.reach / constants.location.radian;
    const filter = {
      "location.coordinates": {
        $geoWithin: {
          $centerSphere: [userLocation, maxDistanceInRadians],
        },
      },
      isEventCompleted: false,
      isDeleted: false,
      ...(Array.isArray(req.blockedUserIds) && req.blockedUserIds.length > 0
        ? { userId: { $nin: req.blockedUserIds.map(id => new mongoose.Types.ObjectId(id)) } }
        : {})

    }
    const totalAds = await Event.countDocuments(filter);
    const totalPages = Math.ceil(totalAds / constants.perPage.pageLimit16);
    if (pageNumber > totalPages && totalPages !== 0) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "Page number exceeds total pages",
        payload: {},
      });
    }
    const nearbyEvent = await Event.find(filter)
      .select("-interestedUsers")
      .skip((pageNumber - 1) * constants.perPage.pageLimit16)
      .limit(constants.perPage.pageLimit16)
      .sort({ createdAt: -1 });


    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        nearbyAds: nearbyEvent,
        meta: {
          currentPage: pageNumber,
          totalPages,
          totalAds,
          adsPerPage: constants.perPage.pageLimit16,
        },
      },
    });
  } catch (error) {
    logger.error(`error in getEventByUserNearbyLocation: ${error.message}`, {
      error,
    });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

const getEventByNearbyLocation = async (req, res) => {
  const { latitude, longitude, page = 1 } = req.query;
  try {
    if (!latitude || !longitude) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
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
    const userLocation = [parseFloat(longitude), parseFloat(latitude)];
    const maxDistanceInRadians =
      constants.location.reach / constants.location.radian;
    const filter = {
      "location.coordinates": {
        $geoWithin: {
          $centerSphere: [userLocation, maxDistanceInRadians],
        },
      },
      isEventCompleted: false,
      isDeleted: false,
      ...(Array.isArray(req.blockedUserIds) && req.blockedUserIds.length > 0
        ? { userId: { $nin: req.blockedUserIds.map(id => new mongoose.Types.ObjectId(id)) } }
        : {})

    }
    const totalAds = await Event.countDocuments(filter);
    const totalPages = Math.ceil(totalAds / constants.perPage.pageLimit16);
    if (pageNumber > totalPages && totalPages !== 0) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "Page number exceeds total pages",
        payload: {},
      });
    }
    const nearbyEvent = await Event.find(filter)
      .select("-interestedUsers")
      .skip((pageNumber - 1) * constants.perPage.pageLimit16)
      .limit(constants.perPage.pageLimit16)
      .sort({ createdAt: -1 });

    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        nearbyAds: nearbyEvent,
        meta: {
          currentPage: pageNumber,
          totalPages,
          totalAds,
          adsPerPage: constants.perPage.pageLimit16,
        },
      },
    });
  } catch (error) {
    console.error(`Error in getEventByNearbyLocation: ${error.message}`, {
      error,
    });
    logger.error("error in getEventByNearbyLocation", error.message);
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

const getFilteredPost = async (req, res) => {
  const {
    category = [],
    entryType = [],
    latitude,
    longitude,
    page = 1,
  } = req.query;
  if (page < 1) {
    page = 1;
  }
  const pages = parseInt(page, 10) || 1;
  try {
    if (!category) {
      if (!Array.isArray(category)) {
        return res.status(constants.httpStatus.badRequest).json({
          status: 0,
          msg: "category must be an array.",
          payload: {},
        });
      }
    }
    if (!entryType) {
      if (!Array.isArray(entryType)) {
        return res.status(constants.httpStatus.badRequest).json({
          status: 0,
          msg: "entryType must be an array.",
          payload: {},
        });
      }
    }
    const skip = (pages - 1) * constants.perPage.pageLimit16;
    const query = {
      isEventCompleted: false,
      isDeleted: false,
      ...(Array.isArray(req.blockedUserIds) && req.blockedUserIds.length > 0
        ? { userId: { $nin: req.blockedUserIds.map(id => new mongoose.Types.ObjectId(id)) } }
        : {})

    };
    // if (category.length > 0) {
    //   query.category = { $in: category };
    // }
    if (category.length > 0) {
      query.category = { $regex: category.join("|"), $options: "i" };
    }
    if (entryType.length > 0) {
      query.entryType = { $in: entryType };
    }
    if (latitude && longitude) {
      const userLocation = [parseFloat(longitude), parseFloat(latitude)];
      const maxDistanceInRadians =
        constants.location.reach / constants.location.radian;
      query["location.coordinates"] = {
        $geoWithin: {
          $centerSphere: [userLocation, maxDistanceInRadians],
        },
      };
    }
    const events = await Event.find(query)
      .skip(skip)
      .limit(constants.perPage.pageLimit16)
      .sort({ createdAt: -1 });

    const totalCount = await Event.countDocuments(query);
    const totalPages = Math.ceil(totalCount / constants.perPage.pageLimit16);
    return res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        results: events,
        meta: {
          totalItems: totalCount,
          totalPages,
          currentPage: pages,
          itemsPerPage: constants.perPage.pageLimit16,
        },
      },
    });
  } catch (error) {
    logger.error(`error in getFilteredPost: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong during the search",
      payload: {},
    });
  }
};

const searchEvents = async (req, res) => {
  try {
    const {
      keyword,
      latitude,
      longitude,
      page = 1,
    } = searchSchema.parse({
      keyword: req.query.keyword,
      page: req.query.page ? parseInt(req.query.page) : undefined,
      latitude: req.query.latitude,
      longitude: req.query.longitude,
    });
    const skip = (page - 1) * constants.perPage.pageLimit16;
    const cacheKey = `search:${keyword}:${latitude}:${longitude}:${page}:${constants.perPage.pageLimit16}`;
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
      isDeleted: false, isEventCompleted: false,
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
    const event = await Event.find(searchCriteria)
      .skip(skip)
      .select(
        "_id userId adsId title description date category entryType amount itemImages region name totalViews createdAt"
      )
      .limit(constants.perPage.pageLimit16);

    if (!event) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "No events found",
        payload: [],
      });
    }
    const payload = event;
    const pagination = {
      page: parseInt(page),
      limit: constants.perPage.pageLimit16,
      totalResults: event.length,
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
    logger.error(`error in searchEvents: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong during the search",
      payload: {},
    });
  }
};

const getComments = async (req, res) => {
  const {
    eventId,
    pages = 1,
    limit = constants.perPage.pageLimit10,
  } = req.query;
  const page = parseInt(pages, 10) || 1;
  const skip = (page - 1) * limit;
  try {
    if (!eventId) {
      return res.status(constants.httpStatus.ok).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }

    const filter = {
      eventId,
      ...(Array.isArray(req.blockedUserIds) && req.blockedUserIds.length > 0
        ? { userId: { $nin: req.blockedUserIds.map(id => new mongoose.Types.ObjectId(id)) } }
        : {})

    }
    const totalCount = await EventComment.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);
    const comments = await EventComment.find(filter)
      .populate({
        path: "userId",
        select: "name profileImage",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        result: comments.length > 0 ? comments : [],
        meta: {
          currentPage: page,
          totalPages,
          commentPerPage: limit,
          totalComments: totalCount,
        }
      }
    });
  } catch (error) {
    logger.error(`error in getCommerts: ${error.message}`, { error });
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getCommentsReply = async (req, res) => {
  const { parentCommentId, pages = 1, limit = constants.perPage.pageLimit5 } = req.query;
  const page = parseInt(pages, 10) || 1;
  const skip = (page - 1) * limit;
  try {
    if (!parentCommentId) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {}
      });
    }

    const filter = {
      parentComment: parentCommentId,
      ...(Array.isArray(req.blockedUserIds) && req.blockedUserIds.length > 0
        ? { userId: { $nin: req.blockedUserIds.map(id => new mongoose.Types.ObjectId(id)) } }
        : {})

    }
    const totalCount = await EventComment.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);
    const commentReplies = await EventComment.find(filter).populate({
      path: "userId",
      select: "name profileImage"
    })
      .skip(skip)
      .limit(limit)
      .exec()

    return res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        result: commentReplies.length > 0 ? commentReplies : [],
        meta: {
          currentPage: page,
          totalPages,
          commentPerPage: limit,
          totalComments: totalCount
        }
      }
    });
  } catch (error) {
    logger.error(`error in getCommentsReply ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {}
    });
  }
}

const saveComment = async (req, res) => {
  const session = await EventComment.startSession();
  session.startTransaction();
  const { eventId, comment } = req.body;
  const myUserId = req.user._id;
  try {
    if (!eventId || !comment) {
      await session.abortTransaction();
      res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const validComment = comment.trim();
    if (validComment.length < 1) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.validationError).json({
        status: 0,
        msg: "invalid comment",
        payload: {}
      });
    }
    const event = await Event.findById(eventId).session(session);
    if (!event) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "event not found",
        payload: {},
      });
    }
    const newComment = await EventComment.create(
      [
        {
          eventId,
          userId: myUserId,
          comment: validComment,
        },
      ],
      { session }
    );
    event.totalComment += 1;
    await event.save({ session });
    await session.commitTransaction();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        newComment,
      },
    });
  } catch (error) {
    logger.error(`error in saveComment: ${error.message}`, { error });
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

const saveCommentReply = async (req, res) => {
  const session = await EventComment.startSession();
  session.startTransaction();
  const { eventId, parentCommentId, comment } = req.body;
  const myUserId = req.user._id;
  try {
    if (!eventId || !parentCommentId || !comment) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const validComment = comment.trim();
    if (validComment.length < 1) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.validationError).json({
        status: 0,
        msg: "invalid comment",
        payload: {}
      });
    }
    const event = await Event.findById(eventId).session(session);
    if (!event) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "event not found",
        payload: {},
      });
    }
    const parentComment = await EventComment.findById(parentCommentId).session(session);
    if (!parentComment) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "parent comment not found",
        payload: {},
      });
    }
    const newCommentReply = await EventComment.create(
      [
        {
          eventId,
          userId: myUserId,
          parentComment: parentCommentId,
          comment: validComment,
        },
      ],
      { session }
    );
    event.totalComment += 1;
    await event.save({ session });
    await session.commitTransaction();
    return res.status(constants.httpStatus.ok).json({
      status: 0,
      msg: "success",
      payload: {
        newCommentReply,
      },
    });
  } catch (error) {
    logger.error(`error in saveCommentReply: ${error.message}`, { error });
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

const saveInterestedUsers = async (req, res) => {
  const session = await Event.startSession();
  session.startTransaction();
  const { eventId } = req.body;
  const myUserId = req.user._id;
  try {
    if (!eventId) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const event = await Event.findById(eventId).session(session);
    if (!event) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "event not found",
        payload: {},
      });
    }
    const userActivity = await UserActivity.findOne({
      userId: myUserId,
    }).session(session);
    if (!userActivity) {
      await UserActivity.create(
        [
          {
            userId: myUserId,
            events: [eventId],
          },
        ],
        { session }
      );
    } else {
      if (!userActivity.events.includes(eventId)) {
        userActivity.events.push(eventId);
        await userActivity.save({ session });
      }
    }
    if (event.totalSeats > 0 && event.totalParticipants >= event.totalSeats) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "event full, no seats available",
        payload: {},
      });
    }
    // const isAlreadyInterested = event.interestedUsers.some(
    //   (userId) => userId.toString() === myUserId.toString()
    // );
    // if (isAlreadyInterested) {
    //   await session.abortTransaction();
    //   return res.status(constants.httpStatus.conflict).json({
    //     status: 0,
    //     msg: "user already added to interested users",
    //     payload: {},
    //   });
    // }
    event.totalParticipants += 1;
    event.availableSeats = Math.max(
      0,
      event.totalSeats - event.totalParticipants
    );
    event.interestedUsers.push(myUserId);
    await event.save({ session });
    await session.commitTransaction();
    return res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        totalParticipants: event.totalParticipants,
        availableSeats: event.availableSeats,
      },
    });
  } catch (error) {
    logger.error(`error in saveInterestedUsers: ${error.message}`, { error });
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

const removeInterestedUsers = async (req, res) => {
  const session = await Event.startSession();
  session.startTransaction();
  const { eventId } = req.body;
  const myUserId = req.user._id;
  try {
    if (!eventId) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const event = await Event.findById(eventId).session(session);
    if (!event) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "event not found",
        payload: {},
      });
    }
    const isUserInterested = event.interestedUsers.some(
      (userId) => userId.toString() === myUserId.toString()
    );
    if (!isUserInterested) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.conflict).json({
        status: 0,
        msg: "user is not in the list of interested users",
        payload: {},
      });
    }
    event.interestedUsers = event.interestedUsers.filter(
      (userId) => userId.toString() !== myUserId.toString()
    );
    event.totalParticipants = Math.max(0, event.totalParticipants - 1);
    event.availableSeats = Math.min(event.totalSeats, event.availableSeats + 1);
    const userActivity = await UserActivity.findOne({
      userId: myUserId,
    }).session(session);
    if (!userActivity) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "user activity not found",
        payload: {},
      });
    }
    userActivity.events = userActivity.events.filter(
      (event) => event.toString() !== eventId.toString()
    );
    await userActivity.save({ session });
    await event.save({ session });
    await session.commitTransaction();
    return res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        totalParticipants: event.totalParticipants,
        availableSeats: event.availableSeats,
      },
    });
  } catch (error) {
    logger.error(`error in removeInterestedUsers: ${error.message}`, { error });
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

const getInterestedUsers = async (req, res) => {
  const { eventId, pages = 1 } = req.query;
  const page = parseInt(pages, 10) || 1;
  const limit = constants.perPage.pageLimit10;
  const skip = (page - 1) * limit;
  try {
    if (!eventId) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Missing required fields: eventId",
        payload: {},
      });
    }
    const event = await Event.findById(eventId)
      .select("interestedUsers")
      .lean();
    if (!event) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "Event not found",
        payload: {},
      });
    }
    const totalUsers = event.interestedUsers.length;
    const totalPages = Math.ceil(totalUsers / limit);

    const filter = {
      _id: { $in: event.interestedUsers },
      ...(Array.isArray(req.blockedUserIds) && req.blockedUserIds.length > 0
        ? { userId: { $nin: req.blockedUserIds.map(id => new mongoose.Types.ObjectId(id)) } }
        : {})

    }
    const interestedUsers = await User.find(filter)
      .select("_id name profileImage")
      .skip(skip)
      .limit(limit)
      .lean();

    return res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "Success",
      payload: {
        interestedUsers,
        meta: {
          totalUsersPerPage: limit,
          currentPage: page,
          totalUsers,
          totalPages,
        },
      },
    });
  } catch (error) {
    logger.error(`Error in getInterestedUsers: ${error.message}`, { error });
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong during the search",
      payload: {},
    });
  }
};

const getInterestedEvents = async (req, res) => {
  const { pages = 1 } = req.query;
  const page = parseInt(pages, 10) || 1;
  const limit = constants.perPage.pageLimit16;
  const skip = (page - 1) * limit;
  const myUserId = req.user._id;
  try {

    const filter = {
      userId: myUserId,
      ...(Array.isArray(req.blockedUserIds) && req.blockedUserIds.length > 0
        ? { userId: { $nin: req.blockedUserIds.map(id => new mongoose.Types.ObjectId(id)) } }
        : {})

    }
    const userActivity = await UserActivity.findOne(filter)
      .populate({
        path: "events",
        select:
          "adsId title description itemImages name category date entryType amount eventStatus totalSeats availableSeats",
      })
      .select("-_id -userId -createdAt -updatedAt -__v")
      .lean();

    if (!userActivity) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "User activity not found or no interested events",
        payload: {},
      });
    }
    const totalCount = userActivity.events.length;
    const totalPages = Math.ceil(totalCount / limit);
    if (page > totalPages || userActivity.events.length == 0) {
      return res.status(constants.httpStatus.ok).json({
        status: 1,
        msg: "No events found for this page",
        payload: {
          interestedEvents: [],
          meta: {
            totalEventsPerPage: limit,
            currentPage: page,
            totalCount,
            totalPages,
          },
        },
      });
    }
    const paginatedEvents = userActivity.events.slice(skip, skip + limit);
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "Success",
      payload: {
        interestedEvents: paginatedEvents,
        meta: {
          totalEventsPerPage: limit,
          currentPage: page,
          totalCount,
          totalPages,
        },
      },
    });
  } catch (error) {
    logger.error(`error in getInterestedEvents: ${error.message}`, { error });
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong during the search",
      payload: {},
    });
  }
};

const updateEventStatus = async (req, res) => {
  const { eventId, statusType, updatedDate } = req.body;
  const myUserId = req.user._id;
  const hostEmail = req.user.email;
  const hostPhone = req.user.phoneNumber;
  try {
    if (!eventId || !statusType) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    if (!myUserId || !hostEmail) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "event not found",
        payload: {},
      });
    }
    if (hostEmail) {
      if (event.email !== hostEmail) {
        return res.status(constants.httpStatus.badRequest).json({
          status: 0,
          msg: "action not allowed",
          payload: {},
        });
      }
    } else if (hostPhone) {
      if (event.phoneNumber.toString() !== hostPhone.toString()) {
        return res.status(constants.httpStatus.badRequest).json({
          status: 0,
          msg: "action not allowed",
          payload: {},
        });
      }
    } else {
      return res.status(constants.httpStatus.conflict).json({
        status: 0,
        msg: "invalid host info",
        payload: {},
      });
    }
    event.eventStatus = statusType;
    if (updatedDate) {
      event.date = updatedDate;
    }
    await event.save();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {},
    });
  } catch (error) {
    logger.error(`error in updateEventStatus: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong during the search",
      payload: {},
    });
  }
};

const deleteEventPost = async (req, res) => {
  const session = await Event.startSession();
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
    const post = await Event.findOne({ adsId: postId }).session(session);
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
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "user not found",
        payload: {},
      });
    }
    // await Event.findOneAndDelete({ adsId: postId }).session(session);
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
    logger.error(`error in deleteEventPost: ${error.message}`, { error });
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
  createEvent,
  saveEventImages,
  editEventImages,
  searchEvents,
  deleteEventImage,
  editEventPost,
  getAllEventPostList,
  getTrendingEvents,
  getEventDetails,
  getEventByUserNearbyLocation,
  getEventByNearbyLocation,
  getInterestedUsers,
  getFilteredPost,
  getComments,
  getCommentsReply,
  saveInterestedUsers,
  saveComment,
  saveCommentReply,
  removeInterestedUsers,
  getInterestedEvents,
  updateEventStatus,
  deleteEventPost,
};
