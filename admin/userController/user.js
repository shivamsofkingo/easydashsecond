const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../../models/users.js");
const Student = require("../../models/student.js");
const NonStudent = require("../../models/nonStudent.js");
const Giveaway = require("../../models/giveaways.js");
const Marketplace = require("../../models/marketplace.js");
const Accommodation = require("../../models/accomodation.js");
const Event = require("../../models/event.js");
const Admin = require("../../models/admin.js");
const Kyc = require("../../models/kyc.js");
const { getUserProfile } = require("../../utils/profile/profile.js");
const { createProfileUploadUrl, createProfileUploadUrlAdmin } = require("../../utils/fileUpload/file.js");
const { updateProfileImage, updateProfileImageAdmin } = require("../../utils/ads/ads.js");
const { hasPermission, isValidObjectId } = require("../utilities.js");
const constants = require("../../constants/constants.js");
const { adminLogger } = require("../../config/loggerConfig.js");
const { generateOTP, sendOTP } = require("../../utils/emailMessageConfig/message.js");


const loginUserWithEmail = async (req, res) => {
  const { email, password } = req.body;
  const { devicetype, deviceid } = req.headers;
  try {
    if (!email || !password) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const validEmail = email.trim().toLowerCase();
    const user = await Admin.findOne({ email: validEmail });
    if (!user || user.isActive === false) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "user does not exist",
        payload: {},
      });
    }
    const checkPassword = await bcrypt.compare(password, user.password);
    if (!checkPassword) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "invalid email/password",
        payload: {},
      });
    }
    if (devicetype) user.deviceType = devicetype;
    if (deviceid) user.deviceId = deviceid;
    const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY);
    user.token = token;
    await user.save();
    user.password = undefined;
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        user,
        token
      },
    });
  } catch (error) {
    adminLogger.error(`error in createUser: ${error}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getTotalUsersCount = async (req, res) => {
  const myUserId = req.user._id;
  try {
    if (!myUserId) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const totalUserCount = await User.countDocuments({ isActive: true });
    if (!totalUserCount) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "internal server error",
        payload: {},
      });
    }
    return res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        totalUserCount,
      },
    });
  } catch (error) {
    adminLogger.error(`error in getTotalUsersCount: ${error.message}`, { error });
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getAllUsers = async (req, res) => {
  const { pages = 1 } = req.query;
  const pageSize = 15;
  const page = parseInt(pages, 10) || 1;
  const skip = (page - 1) * pageSize;
  const myUserId = req.user._id;
  try {
    if (!myUserId) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "Unauthorized request",
        payload: {},
      });
    }
    const totalUsers = await User.countDocuments({
      _id: { $ne: myUserId },
      isActive: true
    });
    const totalPages = Math.ceil(totalUsers / pageSize);
    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: myUserId },
          isActive: true
        },
      },
      {
        $lookup: {
          from: "nonstudents",
          localField: "_id",
          foreignField: "userId",
          as: "nonStudentProfile",
        },
      },
      {
        $addFields: {
          nonStudentProfileType: {
            $arrayElemAt: ["$nonStudentProfile.nonStudentProfileType", 0],
          },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          role: 1,
          profileType: 1,
          phoneNumber: 1,
          place: 1,
          address: 1,
          profileImage: 1,
          isEmailChanged: 1,
          totalAdsPosted: 1,
          totalGroupCreated: 1,
          googleId: 1,
          deviceType: 1,
          deviceId: 1,
          nonStudentProfileType: 1,
          totalReports: 1,
          createdAt: 1,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: pageSize },
    ]);
    if (!users || users.length === 0) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "No users found",
        payload: {},
      });
    }
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "Success",
      payload: {
        users,
        meta: {
          currentPage: page,
          adsPerPage: pageSize,
          totalPages,
          totalUsers,
        },
      },
    });
  } catch (error) {
    adminLogger.error(`Error in getAllUsers: ${error.message}`, { error });
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

const getTotalStudents = async (req, res) => {
  const myUserId = req.user._id;
  try {
    if (!myUserId) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const result = await Student.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      {
        $match: {
          "userDetails.isActive": true
        }
      },
      {
        $count: "totalStudents"
      }
    ])
    if (!result) {
      return res.status(constants.httpStatus.serverError).json({
        status: 0,
        msg: "something went wrong",
        payload: {},
      });
    }
    const studentCount = result[0]?.totalStudents || 0;
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        studentCount
      },
    });
  } catch (error) {
    adminLogger.error(`error in getTotalStudents: ${error.message}`, { error });
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getTotalVendors = async (req, res) => {
  const myUserId = req.user._id;
  try {
    if (!myUserId) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const result = await NonStudent.aggregate([
      {
        $match: {
          nonStudentProfileType: "Vendor"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      {
        $match: {
          "userDetails.isActive": true
        }
      },
      {
        $count: "totalVendors"
      }
    ])
    if (!result) {
      return res.status(constants.httpStatus.serverError).json({
        status: 0,
        msg: "something went wrong",
        payload: {},
      });
    }
    const vendorsCount = result[0]?.totalVendors || 0;
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        vendorsCount
      },
    });
  } catch (error) {
    adminLogger.error(`error in getTotalVendors: ${error.message}`, { error });
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getTotalPropertyManagers = async (req, res) => {
  const myUserId = req.user._id;
  try {
    if (!myUserId) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const result = await NonStudent.aggregate([
      {
        $match: {
          nonStudentProfileType: "Property Manager"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      {
        $match: {
          "userDetails.isActive": true
        }
      },
      {
        $count: "totalPropertyManagers"
      }
    ])
    if (!result) {
      return res.status(constants.httpStatus.serverError).json({
        status: 0,
        msg: "something went wrong",
        payload: {},
      });
    }
    const propertyManagersCount = result[0]?.totalPropertyManagers || 0;
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        propertyManagersCount,
      },
    });
  } catch (error) {
    adminLogger.error(`error in getTotalPropertyManagers: ${error.message}`, { error });
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getTotalEventManagers = async (req, res) => {
  const myUserId = req.user._id;
  try {
    if (!myUserId) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const result = await NonStudent.aggregate([
      {
        $match: {
          nonStudentProfileType: "Event Manager"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      {
        $match: {
          "userDetails.isActive": true
        }
      },
      {
        $count: "totalEventManagers"
      }
    ])
    if (!result) {
      return res.status(constants.httpStatus.serverError).json({
        status: 0,
        msg: "something went wrong",
        payload: {},
      });
    }
    const eventManagersCount = result[0]?.totalEventManagers || 0;
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        eventManagersCount,
      },
    });
  } catch (error) {
    adminLogger.error(`error in getTotalEventManagers: ${error.message}`, { error });
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getUserById = async (req, res) => {
  const myUserId = req.user._id;
  try {
    const user = await Admin.findById(myUserId);
    if (!user || user.isActive === false) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "user not found",
        payload: {},
      });
    }
    // const param = {
    //   id: myUserId,
    //   profileType: user.profileType,
    // };
    // const profileDetails = await getUserProfile(param);
    // if (!profileDetails) {
    //   return res.status(constants.httpStatus.badRequest).json({
    //     status: 0,
    //     msg: "internal server error",
    //     payload: {},
    //   });
    // }
    user.password = undefined;
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        user
      },
    });
  } catch (error) {
    adminLogger.error(`error in getUser: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const editProfileImage = async (req, res) => {
  const session = await User.startSession();
  session.startTransaction();
  const myUserId = req.user._id;
  const { userId, fileNames, contentTypes } = req.body;
  try {
    if (!userId || !fileNames || !contentTypes) {
      await session.abortTransaction();
      session.endSession();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    if (myUserId.toString() !== userId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    if (fileNames.length !== contentTypes.length) {
      await session.abortTransaction();
      session.endSession();
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
    session.endSession();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: uploadUrls,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    adminLogger.error(`error in editProfileImage: ${error.message}`, { error });
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
  const {
    name,
    countryCode,
    phoneNumber,
    location,
    gender
  } = req.body;
  const myUserId = req.user._id;
  try {
    const user = await Admin.findById(myUserId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "user not found",
        payload: {},
      });
    }
    user.name = name ? name : user.name;
    user.countryCode = countryCode ? countryCode : user.countryCode;
    user.phoneNumber = phoneNumber ? phoneNumber : user.phoneNumber;
    user.address = location ? location : user.address;
    user.gender = gender ? gender : user.gender;
    await user.save({ session });
    await session.commitTransaction();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        user
      },
    });
  } catch (error) {
    adminLogger.error(`error in editProfile: ${error.message}`, { error });
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

const searchUser = async (req, res) => {
  const { keyword, page = 1, limit = constants.perPage.pageLimit16 } = req.query;
  const pages = parseInt(page, 10) || 1;
  const skip = (pages - 1) * limit;
  try {
    if (!keyword) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        message: "requires keyword for search",
        payload: {},
      });
    }
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalPages = Math.ceil(totalUsers / limit);
    const searchCriteria = {
      isActive: true,
      $or: [
        { name: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } },
        ...(isValidObjectId(keyword) ? [{ _id: keyword }] : []),
      ],
    };
    const users = await User.find(searchCriteria)
      .select("-password -__v")
      .skip(skip)
      .limit(limit)
      .lean();

    if (!users) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "users not found",
        payload: {}
      });
    }
    const usersWithProfile = await Promise.all(
      users.map(async (user) => {
        const param = {
          id: user._id,
          profileType: user.profileType,
        };
        const profileDetails = await getUserProfile(param);
        return {
          ...user,
          nonStudentProfileType: profileDetails?.nonStudentProfileType || null,
        };
      })
    );
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        usersWithProfile,
        meta: {
          currentPage: pages,
          searchResultPerPage: limit,
          totalPages,
          totalUsers
        },
      },
    });
  } catch (error) {
    adminLogger.error(`error in searchUser: ${error.message}`, { error });
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getUsersCountByDevice = async (req, res) => {
  const { page = 1, limit = 12 } = req.query;
  try {
    const skip = (page - 1) * limit;
    const usersByDevice = await User.aggregate([
      {
        $match: {
          deviceType: { $in: ["ANDROID", "IOS", "WEB"] },
          isActive: true
        },
      },
      {
        $project: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          deviceType: 1,
        },
      },
      {
        $group: {
          _id: { year: "$year", month: "$month", deviceType: "$deviceType" },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: { year: "$_id.year", month: "$_id.month" },
          devices: {
            $push: {
              deviceType: "$_id.deviceType",
              count: "$count",
            },
          },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
      {
        $skip: skip,
      },
      {
        $limit: parseInt(limit),
      },
    ]);
    const totalCount = await User.aggregate([
      {
        $match: {
          deviceType: { $in: ["ANDROID", "IOS", "WEB"] },
          isActive: true
        },
      },
      {
        $project: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
      },
      {
        $group: {
          _id: { year: "$year", month: "$month" },
        },
      },
      {
        $count: "total",
      },
    ]);
    const results = usersByDevice.map((item) => {
      const mobileUsersCount = item.devices
        .filter((d) => d.deviceType === "ANDROID" || d.deviceType === "IOS")
        .reduce((acc, curr) => acc + curr.count, 0);
      const webUsersCount = item.devices
        .filter((d) => d.deviceType === "WEB")
        .reduce((acc, curr) => acc + curr.count, 0);

      return {
        year: item._id.year,
        month: item._id.month,
        mobileUsersCount,
        webUsersCount,
      };
    });
    const totalRecords = totalCount.length > 0 ? totalCount[0].total : 0;
    const totalPages = Math.ceil((totalCount.length > 0 ? totalCount[0].total : 0) / limit);
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        results,
        meta: {
          currentPage: parseInt(page),
          totalRecords,
          totalPages
        },
      },
    });
  } catch (error) {
    adminLogger.error(`error in getUsersCountByDevice: ${error.message}`, { error });
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getUserCountByMonth = async (req, res) => {
  const myUserId = req.user._id;
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const userCounts = await User.aggregate([
      {
        $match: {
          isActive: true
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          count: 1,
        },
      },
      { $skip: skip },
      { $limit: limit },
    ]);
    const totalRecords = await User.aggregate([
      {
        $match: {
          isActive: true
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
        },
      },
      { $count: "total" },
    ]);
    const totalItems = totalRecords.length > 0 ? totalRecords[0].total : 0;
    return res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        userCounts,
        meta: {
          currentPage: page,
          resultPerPage: limit,
          totalPages: Math.ceil(totalItems / limit),
          totalItems,
        },
      },
    });
  } catch (error) {
    adminLogger.error(`error in getUserCountByMonth: ${error.message}`, { error });
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const restoreUser = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "user not found",
        payload: {}
      });
    }
    user.isActive = true;
    await user.save();
    await Giveaway.updateMany({ userId: user._id }, { $set: { isDeleted: false } });
    await Marketplace.updateMany({ userId: user._id }, { $set: { isDeleted: false } });
    await Accommodation.updateMany({ userId: user._id }, { $set: { isDeleted: false } });
    await Event.updateMany({ userId: user._id }, { $set: { isDeleted: false } });
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {},
    })
  } catch (error) {
    adminLogger.error(`error in restoreUser: ${error.message}`, { error });
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
}

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    if (req?.user?._id.toString() === id?.toString()) {
      const user = await User.findById(id);
      if (!user) {
        return res.status(constants.httpStatus.notFound).json({
          status: 0,
          msg: "user not found",
          payload: {}
        });
      }
      user.isActive = false;
      await user.save();
      await Giveaway.updateMany({ userId: user._id }, { $set: { isDeleted: true } });
      await Marketplace.updateMany({ userId: user._id }, { $set: { isDeleted: true } });
      await Accommodation.updateMany({ userId: user._id }, { $set: { isDeleted: true } });
      await Event.updateMany({ userId: user._id }, { $set: { isDeleted: true } });
      res.status(constants.httpStatus.ok).json({
        status: 1,
        msg: "success",
        payload: {
          deletedUser: user,
        },
      });
    }
    else {
      res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "Not Authorized ,you are not the Owner ",
        payload: {},
      });
    }

  } catch (error) {
    adminLogger.error(`error in deleteUser: ${error.message}`, { error });
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const adminUser = await Admin.findOne({ email });
    if (!adminUser || !adminUser.isActive) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "admin not found",
        payload: {},
      });
    }
    const otp = generateOTP();
    adminUser.resetOtp = otp;
    adminUser.otpExpiration = Date.now() + 5 * 60 * 1000;
    await adminUser.save();
    await sendOTP(email, otp);
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "OTP sent to your email",
      payload: {},
    });
  } catch (error) {
    adminLogger.error(`error in forgotPassword admin: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    if (!email || !otp) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const adminUser = await Admin.findOne({ email });
    if (!adminUser) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "admin not found",
        payload: {},
      });
    }
    if (adminUser.resetOtp !== otp || Date.now() > adminUser.otpExpiration) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Invalid or expired OTP",
        payload: {},
      });
    }
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "OTP verified. Proceed to reset password.",
      payload: {},
    });
  } catch (error) {
    adminLogger.error(`error in verifyOtp admin: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    if (!email || !newPassword) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const adminUser = await Admin.findOne({ email });
    if (!adminUser) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "admin not found",
        payload: {},
      });
    }
    const hashPassword = await bcrypt.hash(newPassword, 12);
    adminUser.password = hashPassword;
    adminUser.resetOtp = null;
    adminUser.otpExpiration = null;
    await adminUser.save();

    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "Password has been reset successfully",
      payload: {},
    });
  } catch (error) {
    adminLogger.error(`error in resetPassword admin: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const logoutAdmin = async (req, res) => {
  try {
    res.clearCookie('token');
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "Successfully logged out.",
      payload: {}
    });
  } catch (error) {
    adminLogger.error(`error in logoutAdmin: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getAllKycRequests = async (req, res) => {
  const { status } = req.query;
  try {
    const filter = { status: { $ne: "AWAITING_PAYMENT" } };
    if (status) {
      filter.status = status;
    }
    const kycRequests = await Kyc.find(filter).populate("userId", "name email profileType place").sort({ createdAt: -1 });
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: { kycRequests }
    });
  } catch (error) {
    adminLogger.error(`error in getAllKycRequests: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {}
    });
  }
};

const getKycById = async (req, res) => {
  const { id } = req.params;
  try {
    const kycRequest = await Kyc.findById(id)
      .populate({
        path: "userId",
        select: "name email phoneNumber profileImage activeSubscription subscriptionExpiresAt profileType place address",
        populate: { path: "activeSubscription", select: "planName price" }
      })
      .populate("reviewedBy", "name email");

    if (!kycRequest) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "KYC request not found",
        payload: {}
      });
    }

    // If Non-Student, fetch their specific profile details for DOB and Type
    let profileDetails = null;
    if (kycRequest.userId && kycRequest.userId.profileType === 'Non Student') {
        profileDetails = await NonStudent.findOne({ userId: kycRequest.userId._id });
    } else if (kycRequest.userId && kycRequest.userId.profileType === 'Student') {
        profileDetails = await Student.findOne({ userId: kycRequest.userId._id });
    }

    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: { 
        kycRequest,
        profileDetails
      }
    });
  } catch (error) {
    adminLogger.error(`error in getKycById: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {}
    });
  }
};

const approveKyc = async (req, res) => {
  const session = await Kyc.startSession();
  session.startTransaction();
  const { id } = req.params;
  const adminId = req.user._id;

  try {
    const kycRequest = await Kyc.findById(id).session(session);
    if (!kycRequest) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({ status: 0, msg: "KYC not found" });
    }

    kycRequest.status = "APPROVED";
    kycRequest.reviewedBy = adminId;
    kycRequest.reviewedAt = new Date();
    await kycRequest.save({ session });

    const user = await User.findById(kycRequest.userId).session(session);
    if (user) {
      user.isKycVerified = true;
      
      // Activate the subscription if one was pending
      if (kycRequest.pendingPlanId) {
          user.activeSubscription = kycRequest.pendingPlanId;
          user.subscriptionExpiresAt = kycRequest.planExpiryDate;
          
          // Clear pending fields in KYC record
          kycRequest.pendingPlanId = null;
          kycRequest.planExpiryDate = null;
          await kycRequest.save({ session });
          
          adminLogger.info(`Subscription activated for user ${user._id} upon KYC approval.`);
      }
      
      await user.save({ session });
    }

    await session.commitTransaction();
    res.status(constants.httpStatus.ok).json({ status: 1, msg: "KYC Approved", payload: {} });
  } catch (error) {
    await session.abortTransaction();
    adminLogger.error(`error in approveKyc: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({ status: 0, msg: "something went wrong", payload: {} });
  } finally {
    session.endSession();
  }
};

const rejectKyc = async (req, res) => {
  const { id } = req.params;
  const adminId = req.user._id;

  try {
    const kycRequest = await Kyc.findById(id);
    if (!kycRequest) {
      return res.status(constants.httpStatus.notFound).json({ status: 0, msg: "KYC not found" });
    }

    kycRequest.status = "REJECTED";
    kycRequest.reviewedBy = adminId;
    kycRequest.reviewedAt = new Date();
    await kycRequest.save();

    res.status(constants.httpStatus.ok).json({ status: 1, msg: "KYC Rejected", payload: {} });
  } catch (error) {
    adminLogger.error(`error in rejectKyc: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({ status: 0, msg: "something went wrong", payload: {} });
  }
};

module.exports = {
  loginUserWithEmail,
  getTotalUsersCount,
  getAllUsers,
  getTotalStudents,
  getTotalVendors,
  getTotalPropertyManagers,
  getTotalEventManagers,
  getUsersCountByDevice,
  getUserById,
  getUserCountByMonth,
  editProfileImage,
  editProfile,
  searchUser,
  restoreUser,
  deleteUser,
  forgotPassword,
  verifyOtp,
  resetPassword,
  logoutAdmin,
  getAllKycRequests,
  getKycById,
  approveKyc,
  rejectKyc
};
