require("dotenv").config();
const jwt = require("jsonwebtoken");
const twilio = require("twilio");
const {
  saveOTP,
  validateOTP,
  generateOTP,
} = require("../../utils/twilio/helper.js");
const { getUserProfile } = require("../../utils/profile/profile.js");
const User = require("../../models/users.js");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const createWhatsAppOTP = async (countryCode, phoneNumber, otp) => {
  try {
    await client.messages.create({
      body: `Your verification code is: ${otp}`,
      from: "whatsapp:+14155238886",
      to: `whatsapp:+${countryCode}${phoneNumber}`,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending OTP to WhatsApp:", error);
    return { success: false, error };
  }
};

const sendWhatsappOtp = async (req, res) => {
  const { countryCode, phoneNumber } = req.body;
  try {
    if (!countryCode || !phoneNumber) {
      return res.status(400).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const otp = generateOTP();
    await saveOTP(phoneNumber, otp);
    const response = await createWhatsAppOTP(countryCode, phoneNumber, otp);
    console.log("response", response);
    if (response.success) {
      res.status(200).json({
        status: 1,
        msg: "OTP sent successfully!",
        payload: {},
      });
    } else {
      res.status(400).json({
        status: 0,
        msg: "Failed to send OTP",
        payload: {},
      });
    }
  } catch (error) {
    console.log("error in sendWhatsappOtp", error.messages);
    res.status(500).json({
      status: 0,
      msg: "Failed to send OTP",
      payload: {},
    });
  }
};

const verifyWhatsappOtp = async (req, res) => {
  const session = await User.startSession();
  session.startTransaction();
  try {
    const { phoneNumber, otp } = req.body;
    const isValid = await validateOTP(phoneNumber, otp);
    if (!isValid) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: 0,
        msg: "invalid OTP",
        payload: {},
      });
    }
    // console.log("whatsapp token =====> ", token);
    let newUser;
    let profileDetails;
    const user = await User.findOne({ phoneNumber }).session(session);
    if(!user) {
      newUser = await User.create(
        [
          { 
            countryCode, 
            phoneNumber,
          }
        ],
        { session }
      );
      if (devicetype) {
        newUser[0].deviceType = devicetype;
      }
      if (deviceid) {
        newUser[0].deviceId = deviceid;
      }
      newUser[0].alternateSignIn = true;
      await newUser[0].save({ session });
    } else {
      const param = {
        id: user._id,
        profileType: user.profileType,
      };
      profileDetails = await getUserProfile(param);
    }
    await session.commitTransaction();
    session.endSession();
    const token = jwt.sign(
      { id: newUser[0]._id, phoneNumber: phoneNumber },
      process.env.SECRET_KEY
    );
    res.status(200).json({
      status: 1,
      msg: "Login successfully!",
      payload: {
        user: newUser ? newUser : user,
        profileDetails,
        token
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log("error in verifyWhatsappOtp", error.messages);
    res.status(500).json({
      status: 0,
      msg: "Failed to send OTP",
      payload: {},
    });
  }
};

module.exports = { sendWhatsappOtp, verifyWhatsappOtp };
