const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const axios = require("axios");

const User = require("../models/users.js");
const GuestUser = require("../models/guestUser.js");
const GuestInteraction = require("../models/guestInteraction.js");

const {
  userValidation,
  loginValidation,
  passwordValidation,
} = require("../validations/validations.js");
const {
  generateOTP,
  sendOTP,
  sendNewDeviceLoginEmail
} = require("../utils/emailMessageConfig/message.js");
const { getUserProfile } = require("../utils/profile/profile.js");
const { logger } = require("../config/loggerConfig.js");
const constants = require("../constants/constants.js");

const registerUser = async (req, res) => {
  const session = await User.startSession();
  session.startTransaction();
  const { name, email, password, place, region, institution } = req.body;
  const { devicetype, deviceid } = req.headers;
  try {
    if (!name || !email || !password || !place) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const validEmail = email.trim().toLowerCase();
    const isValidate = userValidation.safeParse({
      name,
      email: validEmail,
      password,
      place,
    });
    if (!isValidate.success) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.validationError).json({
        status: 0,
        msg: isValidate.error.errors[0].message,
        payload: {},
      });
    }
    const isExist = await User.findOne({ email: validEmail }).session(session);
    if (isExist) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.conflict).json({
        status: 0,
        msg: "user already exists",
        payload: {},
      });
    }
    const hashPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create(
      [
        {
          name,
          email: validEmail,
          password: hashPassword,
          place,
          region: region ? region : null,
          institution: institution ? institution : null,
        },
      ],
      { session }
    );
    if (devicetype) {
      newUser[0].deviceType = devicetype;
    }
    if (deviceid) {
      newUser[0].deviceId = deviceid;
    }
    newUser[0].isEmailVerified = true;
    await newUser[0].save({ session });
    await session.commitTransaction();
    const token = jwt.sign({ id: newUser[0]._id }, process.env.SECRET_KEY);
    // const accessToken = jwt.sign(
    //   {
    //     id: newUser[0]._id,
    //   },
    //   process.env.SECRET_KEY,
    //   {
    //     expiresIn: "1h",
    //     issuer: "ezydash"
    //   }
    // );
    // const refreshToken = jwt.sign(
    //   { 
    //     id: newUser[0]._id 
    //   },
    //   process.env.REFRESH_SECRET,
    //   {
    //     expiresIn: "45d",
    //     issuer: "ezydash"
    //   }
    // );
    newUser[0].password = undefined;
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        user: newUser[0],
        token
        // token: accessToken,
        // refreshToken
      },
    });
  } catch (error) {
    logger.error(`Error in registerUser: ${error.message}`, { error });
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

const googleSignInCreateUser = async (req, res) => {
  const session = await User.startSession();
  session.startTransaction();
  const { email, googleId, name } = req.body;
  const { devicetype, deviceid } = req.headers;
  try {
    if (!email || !googleId || !name) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    function generateRandomString(length = 10) {
      const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let result = "";
      const charactersLength = characters.length;
      for (let i = 0; i < length; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * charactersLength)
        );
      }
      return result;
    }
    const randomPassword = generateRandomString();
    const hashPassword = await bcrypt.hash(randomPassword, 12);
    let newUser;
    let profileDetails;
    const user = await User.findOne({ email }).session(session);
    if (!user) {
      newUser = await User.create(
        [
          {
            name,
            email,
            password: hashPassword,
            googleId,
            profileType: "NONE",
          },
        ],
        { session }
      );
      if (devicetype) {
        newUser[0].deviceType = devicetype;
      }
      if (deviceid) {
        newUser[0].deviceId = deviceid;
      }
      await newUser[0].save({ session });
    } else {
      const param = {
        id: user._id,
        profileType: user.profileType,
      };
      profileDetails = await getUserProfile(param);
    }
    await session.commitTransaction();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        user: newUser ? newUser : user,
        profileDetails: profileDetails ? profileDetails : null,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error(`error in googleSignupCreateUser: ${error.message}`, {
      error,
    });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  } finally {
    session.endSession();
  }
};

const appleSignInCreateUser = async (req, res) => {
  const session = await User.startSession();
  session.startTransaction();
  const { email, appleId } = req.body;
  const { devicetype, deviceid } = req.headers;
  try {
    if (!appleId) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Invalid Apple authentication",
        payload: {},
      });
    }

    let user = await User.findOne({ appleId }).session(session);
    let profileDetails = null;

    if (!user) {
      // fallback: find by email if Apple only gave us email on first sign in
      if (email) {
        user = await User.findOne({ email }).session(session);
      }

      if (!user) {
        // ---- First sign in ----
        function generateRandomString(length = 10) {
          const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
          return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
        }

        const randomPassword = generateRandomString();
        const hashPassword = await bcrypt.hash(randomPassword, 12);

        const createdUser = await User.create(
          [
            {
              name:"User",
              email: email || null, // Apple may not always send email
              password: hashPassword,
              appleId,
              profileType: "NONE",
              deviceType: devicetype || null,
              deviceId: deviceid || null,
            },
          ],
          { session }
        );
        user = createdUser[0];
      } else {
        // Existing user by email, link AppleId
        user.appleId = appleId;
        await user.save({ session });
      }
    } else {
      // ---- Login ----
      if (user.activeSubscription && user.subscriptionExpiresAt > new Date()) {
         if (deviceid && user.deviceId && user.deviceId !== deviceid) {
            sendNewDeviceLoginEmail(user.email).catch(err => logger.error('Failed to send new device alert', { err }));
         }
      }

      if (devicetype) user.deviceType = devicetype;
      if (deviceid) user.deviceId = deviceid;
      await user.save({ session });

      const param = { id: user._id, profileType: user.profileType };
      profileDetails = await getUserProfile(param);
    }
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email },
      process.env.SECRET_KEY,
      { expiresIn: "7d" }
    );

    await session.commitTransaction();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        user,
        profileDetails,
        token,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error(`error in appleSignInCreateUser: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  } finally {
    session.endSession();
  }
};

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
    const isValidate = loginValidation.safeParse({
      email: validEmail,
      password,
    });
    if (!isValidate.success) {
      return res.status(constants.httpStatus.validationError).json({
        status: 0,
        msg: isValidate.error.errors[0].message,
        payload: {},
      });
    }
    const user = await User.findOne({ email: validEmail });
    if (!user) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "user does not exist",
        payload: {},
      });
    }
    const checkPassword = await bcrypt.compare(password, user.password);
    if (!checkPassword) {
      return res.status(constants.httpStatus.conflict).json({
        status: 0,
        msg: "invalid email/password",
        payload: {},
      });
    }
    if (user.activeSubscription && user.subscriptionExpiresAt > new Date()) {
      if (deviceid && user.deviceId && user.deviceId !== deviceid) {
        sendNewDeviceLoginEmail(user.email).catch(err => logger.error('Failed to send new device alert', { err }));
      }
    }

    if (devicetype) user.deviceType = devicetype;
    if (deviceid) user.deviceId = deviceid;
    const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY);
    // const accessToken = jwt.sign(
    //   {
    //     id: user._id,
    //   },
    //   process.env.SECRET_KEY,
    //   {
    //     expiresIn: "1h",
    //     issuer: "ezydash"
    //   }
    // );
    // const refreshToken = jwt.sign(
    //   { 
    //     id: `${user._id}`
    //   },
    //   process.env.REFRESH_SECRET,
    //   {
    //     expiresIn: "45d",
    //     issuer: "ezydash"
    //   }
    // );
    await user.save();
    const param = {
      id: user._id,
      profileType: user.profileType,
    };
    const profileDetails = await getUserProfile(param);
    user.password = undefined;
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        user,
        profileDetails,
        token,
        // refreshToken
      },
    });
  } catch (error) {
    console.log("error in loginUserWithEmail", error);
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",

      payload: {},
    });
  }
};

const refreshAccessToken = async (req, res) => {
  const { refreshToken, userId } = req.body;
  try {
    if (!refreshToken) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {}
      });
    }

    const newAccessToken = jwt.sign(
      {
        id: userId
      },
      process.env.SECRET_KEY,
      {
        expiresIn: "1h",
        issuer: "ezydash"
      }
    );
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        newToken: newAccessToken
      }
    });
  } catch (error) {
    logger.error(`error in refreshAccessToken: ${error.message}`, { error });
    return res.status(constants.httpStatus.serverError).json({
      status: 1,
      msg: "something went wrong",
      payload: {}
    });
  }
}

const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const user = await User.findById(id).populate('accommodationPlan').populate('activeSubscription');
    if (!user) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "user not found",
        payload: {},
      });
    }
    let profileDetails;
    if (user.profileType !== "NONE") {
      const param = {
        id,
        profileType: user.profileType,
      };
      profileDetails = await getUserProfile(param);
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
    logger.error(`error in getUser: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getUserByEmail = async (req, res) => {
  const { email } = req.query;
  try {
    if (!email) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "user not found",
        payload: {},
      });
    }
    let profileDetails;
    if (user.profileType !== "NONE") {
      const param = {
        id: user._id,
        profileType: user.profileType,
      };
      profileDetails = await getUserProfile(param);
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
    logger.error(`error in getUser: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const createGuestUser = async (req, res) => {
  const { guestId } = req.body;
  try {
    if (!guestId) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "invalid login",
        payload: {},
      });
    }
    let guestUser = await GuestUser.findOne({ guestId });
    if (!guestUser) {
      guestUser = await GuestUser.create({
        guestId,
        createdAt: new Date(),
      });
    }
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {},
    });
  } catch (error) {
    console.log("error in createGuestUser", error.message);
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const updateGuestUser = async (req, res) => {
  const { guestId } = req.body;
  try {
    await GuestUser.updateOne({ guestId }, { lastSeen: new Date() });
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {},
    });
  } catch (error) {
    console.log("error in updateGuestUser", error.message);
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const guestInteraction = async (req, res) => {
  const { guestId, action, metadata } = req.body;
  try {
    await GuestInteraction.create({
      guestId,
      action,
      metadata,
      timestamp: new Date(),
    });
    res.status(constants.httpStatus.ok).json({ success: true });
  } catch (error) {
    console.log("error in guestUserInteraction", error.message);
    res.status(constants.httpStatus.serverError).json({
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
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "user not found",
        payload: {},
      });
    }
    const otp = generateOTP();
    user.resetOtp = otp;
    user.otpExpiration = Date.now() + 5 * 60 * 1000;
    await user.save();
    await sendOTP(email, otp);
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "OTP sent to your email",
      payload: {},
    });
  } catch (error) {
    logger.error(`error in forgotPassword: ${error.message}`, { error });
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
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "user not found",
        payload: {},
      });
    }
    if (user.resetOtp !== otp || Date.now() > user.otpExpiration) {
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
    logger.error(`error in verifyOtp: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const resetPassword = async (req, res) => {
  const session = await User.startSession();
  session.startTransaction();
  const { email, newPassword } = req.body;
  try {
    if (!email || !newPassword) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const isValidate = passwordValidation.safeParse({
      password: newPassword,
    });
    if (!isValidate.success) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: isValidate.error.errors[0].message,
        payload: {},
      });
    }
    const user = await User.findOne({ email }).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({
        status: 0,
        msg: "User not found",
        payload: {},
      });
    }
    const hashPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashPassword;
    user.resetOtp = null;
    user.otpExpiration = null;
    await user.save({ session });
    await session.commitTransaction();
    const newToken = jwt.sign({ id: user._id }, process.env.SECRET_KEY);
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "Password has been reset successfully",
      payload: {
        newToken: newToken ? newToken : null,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error(`error in resetPassword: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  } finally {
    session.endSession();
  }
};

const verifyEmail = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "user not found",
        payload: {},
      });
    }
    const otp = generateOTP();
    user.resetOtp = otp;
    user.otpExpiration = Date.now() + 2 * 60 * 1000;
    await user.save();
    await sendOTP(email, otp);
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "OTP sent to your email",
      payload: {},
    });
  } catch (error) {
    logger.error(`error in verifyEmail: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const emailVerifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    if (!email || !otp) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "user not found",
        payload: {},
      });
    }
    if (user.resetOtp !== otp || Date.now() > user.otpExpiration) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Invalid or expired OTP",
        payload: {},
      });
    }
    user.resetOtp = null;
    user.otpExpiration = null;
    user.isEmailVerified = true;
    await user.save();
    res.status(constants.httpStatus.ok).json({
      status: 0,
      msg: "OTP verified",
      payload: {},
    });
  } catch (error) {
    logger.error(`error in emailVerifyOtp: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const updateUserLocation = async (req, res) => {
  const { userId, latitude, longitude } = req.body;
  const myUserId = req.user._id;
  try {
    if (!latitude || !longitude) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Missing required fields: latitude and longitude",
        payload: {},
      });
    }
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.GOOGLE_API_KEY}`
    );
    const { results } = response.data;

    if (!results || results.length === 0) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Address not found for the provided coordinates",
        payload: {},
      });
    }
    const address = results[0].formatted_address;
    if (userId && myUserId && userId === myUserId.toString()) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          status: 0,
          msg: "User not found.",
          payload: {},
        });
      }
      user.regionUpdate = {
        type: "Point",
        coordinates: [longitude, latitude],
      };
      user.address = address;
      await user.save();
    }
    return res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "Success",
      payload: {
        region: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        address,
      },
    });
  } catch (error) {
    console.error("Error in getUserLocation", error.message);
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

const getUserLocationForGuest = async (req, res) => {
  const { latitude, longitude } = req.body;
  try {
    if (!latitude || !longitude) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Missing required fields",
        payload: {},
      });
    }
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.GOOGLE_API_KEY}`
    );
    const { results } = response.data;
    if (!results || results.length === 0) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Address not found",
        payload: {},
      });
    }
    const address = results[0].formatted_address;
    const addressComponents = results[0].address_components;
    let country = "";
    let countryCode = "";
    for (const component of addressComponents) {
      if (component.types.includes("country")) {
        country = component.long_name;
        countryCode = component.short_name;
        break;
      }
    }
    console.log("location api hits =============");
    return res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "Success",
      payload: {
        address,
        country,
        countryCode,
      },
    });
  } catch (error) {
    logger.error(`Error in getUserLocationForGuest ${error.message}`, {
      error,
    });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

const getClosestUniversities = async (req, res) => {
  const { latitude, longitude } = req.body;
  const radius = 10000;
  const placeType = "university";
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${placeType}&key=${process.env.GOOGLE_API_KEY}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (!data) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "internal errror",
        payload: {},
      });
    }
    console.log("uni========>");
    return res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        closestUniversities: data.results,
      },
    });
  } catch (error) {
    logger.error(`Error in getClosestUniversities ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

module.exports = {
  registerUser,
  googleSignInCreateUser,
  appleSignInCreateUser,
  loginUserWithEmail,
  refreshAccessToken,
  getUserById,
  getUserByEmail,
  createGuestUser,
  updateGuestUser,
  guestInteraction,
  forgotPassword,
  verifyOtp,
  resetPassword,
  verifyEmail,
  emailVerifyOtp,
  updateUserLocation,
  getUserLocationForGuest,
  getClosestUniversities,
};
