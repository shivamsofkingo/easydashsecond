const bcrypt = require("bcryptjs");
const User = require("../../models/users.js");
const Admin = require("../../models/admin.js");
const Student = require("../../models/student.js");
const NonStudent = require("../../models/nonStudent.js");
const Giveaway = require("../../models/giveaways.js");
const Marketplace = require("../../models/marketplace.js");
const Accommodation = require("../../models/accomodation.js");
const Event = require("../../models/event.js");
const AdsPost = require("../../models/adsPost.js");
const constants = require("../../constants/constants.js");
const { hasPermission, isValidObjectId } = require("../utilities.js");
const {
  createProfileUploadUrlAdmin,
} = require("../../utils/fileUpload/file.js");
const { updateProfileImageAdmin } = require("../../utils/ads/ads.js");
const { adminValidation } = require("../../validations/validations.js");
const { adminLogger } = require("../../config/loggerConfig.js");

const createAdmin = async (req, res) => {
  const { name, email, countryCode, phoneNumber, password } = req.body;
  try {
    if (!name || !email || !password) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const validateEmail = email.trim().toLowerCase();
    const isValidate = adminValidation.safeParse({
      name,
      email: validateEmail,
      password,
    });
    if (!isValidate.success) {
      return res.status(constants.httpStatus.validationError).json({
        status: 0,
        msg: isValidate.error.errors[0].message,
        payload: {},
      });
    }
    const isExist = await Admin.findOne({ email: validateEmail });
    if (isExist) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "user already exists",
        payload: {},
      });
    }
    const hashPassword = await bcrypt.hash(password, 12);
    const newAdmin = await Admin.create({
      name,
      email: validateEmail,
      countryCode: countryCode ? countryCode : null,
      phoneNumber: phoneNumber ? phoneNumber : null,
      password: hashPassword,
      role: "admin",
    });
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        newAdmin,
      },
    });
  } catch (error) {
    adminLogger.error(`error in createAdmin: ${error.message}`, { error });
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const uploadProfileImage = async (req, res) => {
  console.log("start")
  const session = await Admin.startSession();
  session.startTransaction();
  const { userId, fileNames, contentTypes } = req.body;
  console.log("req --> ", req.body);
  try {
    if (!userId || !fileNames || !contentTypes) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
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
      const uploadUrl = await createProfileUploadUrlAdmin(
        fileName,
        contentType,
        userId
      );
      const param = {
        userId,
        fileNames: fileName,
        session,
      };
      await updateProfileImageAdmin(param);
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
    adminLogger.error(`error in editProfileImage: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      paylaod: {},
    });
  } finally {
    session.endSession();
  }
};

const editProfileAdmin = async (req, res) => {
  const { name, countrycode, phoneNumber, address } = req.body;
  const myUserId = req.user._id;
  try {
    const user = await Admin.findById(myUserId);
    if (!user) {
      res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "user not found",
        payload: {},
      });
    }
    user.name = name ? name : user.name;
    user.countryCode = countrycode ? countrycode : user.countryCode;
    user.phoneNumber = phoneNumber ? phoneNumber : user.phoneNumber;
    user.address = address ? address : user.address;
    await user.save();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        updatedData: user,
      },
    });
  } catch (error) {
    adminLogger.error(`error in editProfileAdmin: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      paylaod: {},
    });
  }
};

const getAllAdmins = async (req, res) => {
  const { pages = 1 } = req.params;
  const page = parseInt(pages, 10) || 1;
  const limit = constants.perPage.pageLimit20;
  const myUserId = req.user._id;
  try {
    if(!myUserId) {
      res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const totalCount = await Admin.countDocuments({ role: constants.role.admin });
    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;
    const admins = await Admin.find({ role: constants.role.admin })
      .select("-password -__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    if (!admins) {
      res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "internal server Error",
        payload: {},
      });
    }
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "sucess",
      payload: {
        results: admins,
        meta: {
          currentPage: page,
          totalPages,
          totalCount 
        }
      }
    })
  } catch (error) {
    adminLogger.error(`error in getAllAdmins: ${error.message}`, { error });
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const searchAdmins = async(req, res) => {
  const { keyword, pages = 1, limit = constants.perPage.pageLimit16 } = req.query;
  const page = parseInt(pages, 10) || 1;
  const skip = (page - 1) * limit;
  try {
    if(!keyword) {
      res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {}
      });
    }
    const totalAdmins = await Admin.countDocuments({ role: constants.role.admin });
    const totalPages = Math.ceil(totalAdmins/limit);
    const searchCriteria = {
      isActive: true,
      $or: [
        { name: { $regex: keyword, $options: "i"} },
        { email: {$regex: keyword, $options: "i"} },
        { phoneNumber: {$regex: keyword, $options: "i"} },
        ...(isValidObjectId(keyword) ? [{_id: keyword}] : [])
      ]
    }
    const admins = await Admin.find(searchCriteria)
      .select("-password -__v")
      .skip(skip)
      .limit(limit)
      .lean()

    if(!admins) {
      res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "admins not found",
        payload: {}
      });
    }
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        results: admins,
        meta: {
          currentPage: page,
          searchResultPerPage: limit,
          totalPages,
          totalAdmins
        }
      }
    });
  } catch (error) {
    adminLogger.error(`error in searchAdmins: ${error.message}`, {error});
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {}
    });
  }
}

const removeAdmin = async (req, res) => {
  const session = await Admin.startSession();
  session.startTransaction();
  const { adminId } = req.query;
  try {
    if(!adminId) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {}
      });
    }
    const admin = await Admin.findById(adminId).session(session);
    if(!admin || admin.role === constants.role.superAdmin) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "admin not found or invalid action",
        payload: {}
      });
    }
    await admin.deleteOne({ session });
    await session.commitTransaction();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {}
    });
  } catch (error) {
    adminLogger.error(`error in removeAdmin: ${error.message}`, { error });
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

const removeUser = async (req, res) => {
  const session = await User.startSession();
  session.startTransaction();
  const { userId } = req.query;
  try {
    if(!userId) {
      await session.abortTransaction();
      res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {}
      });
    }
    const user = await User.findById(userId).session(session);
    if(!user) {
      await session.abortTransaction();
      res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "user not found",
        payload: {}
      });
    }
    if(user.profileType === "Student") {
      const student = await Student.findOne({ userId }).session(session);
      if(!student) {
        await session.abortTransaction();
        res.status(constants.httpStatus.notFound).json({
          status: 0,
          msg: "profile not found",
          payload: {}
        });
      }
      await student.deleteOne({ session });
    } else if(user.profileType === "Non Student") {
      const nonStudent = await NonStudent.findOne({ userId }).session(session);
      if(!nonStudent) {
        await session.abortTransaction();
        res.status(constants.httpStatus.notFound).json({
          status: 0,
          msg: "profile not found",
          payload: {}
        });
      }
      await nonStudent.deleteOne({ session });
    }
    await AdsPost.deleteMany({ userId }).session(session);
    await Giveaway.deleteMany({ userId }).session(session);
    await Marketplace.deleteMany({ userId }).session(session);
    await Accommodation.deleteMany({ userId }).session(session);
    await Event.deleteMany({ userId }).session(session);
    await user.deleteOne({ session });
    await session.commitTransaction();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {}
    });
  } catch (error) {
    adminLogger.error(`error in removeUser: ${error.message}`, {error});
    await session.abortTransaction();
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {}
    });
  } finally {
    session.endSession();
  }
}

module.exports = {
  createAdmin,
  uploadProfileImage,
  editProfileAdmin,
  getAllAdmins,
  searchAdmins,
  removeAdmin,
  removeUser
};
