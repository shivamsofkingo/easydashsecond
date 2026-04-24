const User = require("../models/users.js");
const Student = require("../models/student.js");
const NonStudent = require("../models/nonStudent.js");
const Giveaway = require("../models/giveaways.js");
const Marketplace = require("../models/marketplace.js");
const Accomodation = require("../models/accomodation.js");
const Event = require("../models/event.js");

const {
  getUserProfile,
  uploadProfileImages,
  getpostByUser,
} = require("../utils/profile/profile.js");
const {
  createProfileUploadUrl,
  deleteProfileImages,
  createCoverImageUploadUrl,
} = require("../utils/fileUpload/file.js");
const { updateProfileImage, updateCoverImage, getNotifyAdsId } = require("../utils/ads/ads.js");
const { editProfileValidation } = require("../validations/validations.js");
const { logger } = require("../config/loggerConfig.js");
const constants = require("../constants/constants.js");

const createProfile = async (req, res) => {
  const session = await User.startSession();
  session.startTransaction();
  const {
    place,
    region,
    institution,
    profileType,
    nonStudentProfileType,
    schoolCommencement,
    completionYear,
    businessDescription,
    businessLocation,
    name,
    dateOfBirth,
    gender,
    fileNames,
    contentTypes,
  } = req.body;
  const userId = req.user._id;
  try {
    if (!profileType || !dateOfBirth || !gender) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    if (profileType === "Non Student") {
      if (!nonStudentProfileType) {
        await session.abortTransaction();
        return res.status(constants.httpStatus.badRequest).json({
          status: 0,
          msg: "missing required* fields",
          payload: {},
        });
      }
    } else {
      if (!institution || !schoolCommencement || !completionYear) {
        await session.abortTransaction();
        return res.status(constants.httpStatus.badRequest).json({
          status: 0,
          msg: "missing required* fields",
          payload: {},
        });
      }
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
    if (user.isProfileCreated === true) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.conflict).json({
        status: 0,
        msg: "profile already created",
        payload: {},
      });
    }
    if (profileType === "Student") {
      await Student.create(
        [
          {
            userId,
            schoolCommencement,
            completionYear,
            institution,
            name,
            dateOfBirth,
            gender,
          },
        ],
        { session }
      );
    } else {
      await NonStudent.create(
        [
          {
            userId,
            nonStudentProfileType,
            businessDescription: businessDescription ? businessDescription : null,
            businessLocation: businessLocation ? businessLocation : null,
            name,
            dateOfBirth,
            gender,
          },
        ],
        { session }
      );
    }
    let profilePicture = [];
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
      const imgUrls = await uploadProfileImages(param);
      for (const { fileName, uploadUrl, contentType } of imgUrls) {
        profilePicture.push({ fileName, uploadUrl, contentType });
      }
    }
    user.profileType = profileType;
    user.name = name ? name : user.name;
    user.place = place ? place : user.place;
    user.region = region ? region : null;
    user.isProfileCreated = true;
    await user.save({ session });
    await session.commitTransaction();
    user.password = undefined;
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        user,
        profileImageUploadUrl: profilePicture,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error(`error in createProfile: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  } finally {
    session.endSession();
  }
};

const saveProfileImage = async (req, res) => {
  const session = await User.startSession();
  session.startTransaction();
  const { userId, fileNames } = req.body;
  const myUserId = req.user._id;
  try {
    if (!userId || !fileNames) {
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
      const updateData = await updateProfileImage({
        userId,
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
        profileImage: updatedImages,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error(`error in saveProfileImages: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: `something went wrong ${error.message}`,
      payload: {},
    });
  } finally {
    session.endSession();
  }
};

const saveCoverImage = async (req, res) => {
  const session = await User.startSession();
  session.startTransaction();
  const { userId, fileNames, contentTypes } = req.body;
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
      const uploadUrl = await createCoverImageUploadUrl(
        fileName,
        contentType,
        userId
      );
      const param = {
        userId,
        fileNames: fileName,
        session,
      };
      await updateCoverImage(param);
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
    logger.error(`error in editCoverImage: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      paylaod: {},
    });
  } finally {
    session.endSession();
  }
}

const editProfileImage = async (req, res) => {
  const session = await User.startSession();
  session.startTransaction();
  const { userId, fileNames, contentTypes } = req.body;
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
      const uploadUrl = await createProfileUploadUrl(
        fileName,
        contentType,
        userId
      );
      const param = {
        userId,
        fileNames: fileName,
        session,
      };
      await updateProfileImage(param);
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
    logger.error(`error in editProfileImage: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      paylaod: {},
    });
  } finally {
    session.endSession();
  }
};

const deleteProfileImage = async (req, res) => {
  const { userId, fileNames, contentTypes } = req.body;
  const myUserId = req.user._id;
  try {
    if (!userId || !fileNames || !contentTypes) {
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
    const user = await User.findById(userId);
    if (!user) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "ad not found",
        payload: {},
      });
    }
    user.profileImage = "NA";
    await user.save();
    await deleteProfileImages(fileNames, myUserId);
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

const editProfile = async (req, res) => {
  const session = await User.startSession();
  session.startTransaction();
  const { name, countryCode, phoneNumber, dateOfBirth, gender, businessLocation, businessDescription, profileLinks } = req.body;
  const userId = req.user._id;
  try {
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "user not found",
        payload: {},
      });
    }
    // if (email) {
    //   const isValidate = editProfileValidation.safeParse({ email });
    //   if (!isValidate.success) {
    //     await session.abortTransaction();
    //     return res.status(constants.httpStatus.validationError).json({
    //       status: 0,
    //       msg: isValidate.error.errors[0].message,
    //       payload: {},
    //     });
    //   }
    //   if (user.isEmailChanged === true) {
    //     await session.abortTransaction();
    //     return res.status(constants.httpStatus.badRequest).json({
    //       status: 0,
    //       msg: "email already changed",
    //       payload: {},
    //     });if i want to show from where my accout has been accessed so whats the process for that like devive and location of overview  in email
    //   } else {
    //     if (user.email !== email) {
    //       user.email = email;
    //       user.isEmailChanged = true;
    //     }
    //   }
    // }
    if (user.profileType === "Student") {
      const student = await Student.findOne({ userId }).session(session);
      if (!student) {
        await session.abortTransaction();
        return res.status(constants.httpStatus.notFound).json({
          status: 0,
          msg: "profile not found",
          payload: {},
        });
      }
      // student.name = name ? name : student.name;
      student.countryCode = countryCode ? countryCode : student.countryCode;
      student.phoneNumber = phoneNumber ? phoneNumber : student.phoneNumber;
      student.dateOfBirth = dateOfBirth ? dateOfBirth : student.dateOfBirth;
      student.gender = gender ? gender : student.gender;
      await student.save({ session });
    } else {
      const nonStudent = await NonStudent.findOne({ userId }).session(session);
      if (!nonStudent) {
        await session.abortTransaction();
        return res.status(constants.httpStatus.notFound).json({
          status: 0,
          msg: "profile not found",
          payload: {},
        });
      }
      // nonStudent.name = name ? name : nonStudent.name;
      nonStudent.countryCode = countryCode
        ? countryCode
        : nonStudent.countryCode;
      nonStudent.phoneNumber = phoneNumber
        ? phoneNumber
        : nonStudent.phoneNumber;
      nonStudent.dateOfBirth = dateOfBirth
        ? dateOfBirth
        : nonStudent.dateOfBirth;
      nonStudent.gender = gender ? gender : nonStudent.gender;
      nonStudent.businessLocation = businessLocation ? businessLocation : nonStudent.businessLocation;
      nonStudent.businessDescription = businessDescription ? businessDescription : nonStudent.businessDescription;
      await nonStudent.save({ session });
    }
    user.name = name ? name : user.name;
    
    if (profileLinks && Array.isArray(profileLinks)) {
        if (!user.isKycVerified && profileLinks.length > 0) {
            await session.abortTransaction();
            return res.status(constants.httpStatus.forbidden).json({
                status: 0,
                msg: "You must be a verified user to add profile links.",
                payload: {},
            });
        }

        if (user.activeSubscription && user.subscriptionExpiresAt > new Date()) {
            if (profileLinks.length <= 3) {
                user.profileLinks = profileLinks;
            } else {
                await session.abortTransaction();
                return res.status(constants.httpStatus.badRequest).json({
                    status: 0,
                    msg: "Profile links exceed the maximum limit of 3",
                    payload: {},
                });
            }
        } else if (profileLinks.length > 0) {
            // Cannot add links without sub
            await session.abortTransaction();
            return res.status(constants.httpStatus.forbidden).json({
                status: 0,
                msg: "Active subscription required to add profile links",
                payload: {},
            });
        }
    }

    await user.save({ session });
    await session.commitTransaction();
    const param = {
      id: user._id,
      profileType: user.profileType,
    };
    const profileDetails = await getUserProfile(param);
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        user,
        profileDetails,
      },
    });
  } catch (error) {
    try { await session.abortTransaction(); } catch (e) {}
    logger.error(`error in editProfile: ${error.message}`, { error });
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  } finally {
    session.endSession();
  }
};

const getUserProfileDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "user not found",
        payload: {},
      });
    }
    const param = {
      id,
      profileType: user.profileType,
    };
    const profileDetails = await getUserProfile(param);
    if (!profileDetails) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "internal server error",
        payload: {},
      });
    }
    user.password = undefined;
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        user,
        profileDetails,
      },
    });
  } catch (error) {
    logger.error(`error in getUserProfileDetails: ${error.message}`, { error });
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getAllPostByUserId = async (req, res) => {
  const { userId, pages = 1, limit = 15 } = req.query;
  try {
    if (!userId) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Missing required fields",
        payload: {},
      });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "User not found",
        payload: {},
      });
    }
    const profileType =
      user.profileType === "Student"
        ? "Student"
        : (await NonStudent.findOne({ userId }))?.nonStudentProfileType;
    if (!profileType) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "Profile not found or not created",
        payload: {},
      });
    }
    const param = {
      userId,
      profile: profileType,
      perPage: limit,
      page: parseInt(pages, 10) || 1,
    };
    if (param.page < 1) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Invalid page number",
        payload: {},
      });
    }
    const data = await getpostByUser(param);
    if (!data) {
      return res.status(constants.httpStatus.serverError).json({
        status: 0,
        msg: "Internal server error",
        payload: {},
      });
    }
    const payload = Object.fromEntries(
      Object.entries(data).filter(
        ([key, value]) =>
          value?.length || key === "totalPages" || key === "totalCount"
      )
    );
    // console.log("payload -----> ", payload.ads);
    return res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "Success",
      payload: {
        ads: payload.ads || [],
        meta: {
          totalPages: payload.totalPages || 0,
          totalCount: payload.totalCount || 0,
        },
      },
    });
  } catch (error) {
    logger.error(`Error in getAllPostByUserId: ${error.message}`, { error });
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

const markAsSold = async (req, res) => {
  const { userId, postId, adsType } = req.body;
  const myUserId = req.user._id;
  try {
    if (!userId || !postId || !adsType) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
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
    let adPost;
    let isEvent = false;
    if (adsType === "Giveaway") {
      adPost = await Giveaway.findById(postId);
    } else if (adsType === "Marketplace") {
      adPost = await Marketplace.findById(postId);
    } else if (adsType === "Accomodation") {
      adPost = await Accomodation.findById(postId);
    } else if (adsType === "Event") {
      isEvent = true;
      adPost = await Event.findById(postId);
    } else {
      return res.status(constants.httpStatus.validationError).json({
        status: 0,
        msg: "invalid adsType",
        payload: {},
      });
    }
    if (!adPost) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "ad not found",
        payload: {},
      });
    }
    if (isEvent) {
      adPost.isEventCompleted = true;
    } else {
      adPost.isSold = true;
    }
    await adPost.save();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {},
    });
  } catch (error) {
    logger.error(`Error in markAsSold: ${error.message}`, { error });
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

const markAsUnsold = async (req, res) => {
  const { userId, postId, adsType } = req.body;
  const myUserId = req.user._id;
  try {
    if (!userId || !postId || !adsType) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
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
    let adPost;
    let isEvent = false;
    if (adsType === "Giveaway") {
      adPost = await Giveaway.findById(postId);
    } else if (adsType === "Marketplace") {
      adPost = await Marketplace.findById(postId);
    } else if (adsType === "Accomodation") {
      adPost = await Accomodation.findById(postId);
    } else if (adsType === "Event") {
      isEvent = true;
      adPost = await Event.findById(postId);
    } else {
      return res.status(constants.httpStatus.validationError).json({
        status: 0,
        msg: "invalid adsType",
        payload: {},
      });
    }
    if (!adPost) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "ad not found",
        payload: {},
      });
    }
    if (isEvent) {
      adPost.isEventCompleted = false;
    } else {
      adPost.isSold = false;
    }
    await adPost.save();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {},
    });
  } catch (error) {
    logger.error(`Error in markAsUnsold: ${error.message}`, { error });
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

module.exports = {
  createProfile,
  editProfile,
  getUserProfileDetails,
  getAllPostByUserId,
  saveProfileImage,
  saveCoverImage,
  editProfileImage,
  deleteProfileImage,
  markAsSold,
  markAsUnsold,
};
