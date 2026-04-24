const Kyc = require("../models/kyc.js");
const User = require("../models/users.js");
const { createKycUploadUrl } = require("../utils/fileUpload/file.js");
const constants = require("../constants/constants.js");
const { logger } = require("../config/loggerConfig.js");

const submitKyc = async (req, res) => {
  const session = await Kyc.startSession();
  session.startTransaction();
  const { fullName, accountHandle, email, phoneNumber, nationalIdType, fileNames, contentTypes } = req.body;
  const userId = req.user._id;

  try {
    if (!fullName || !accountHandle || !email || !phoneNumber || !nationalIdType || !fileNames || !contentTypes) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Missing required KYC fields",
        payload: {},
      });
    }

    if (fileNames.length !== 2 || contentTypes.length !== 2) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Exactly 2 photos (front and back) are required",
        payload: {},
      });
    }

    // Check if user already submitted KYC that is pending or approved
    const existingKyc = await Kyc.findOne({ 
      userId, 
      status: { $in: ["PENDING", "APPROVED", "AWAITING_PAYMENT"] } 
    }).session(session);

    if (existingKyc) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.conflict).json({
        status: 0,
        msg: "KYC already submitted or approved.",
        payload: {},
      });
    }

    // Generate S3 Pre-signed URLs for front and back images
    const uploadUrls = [];
    const imagePaths = [];
    for (let i = 0; i < 2; i++) {
        const url = await createKycUploadUrl(fileNames[i], contentTypes[i], userId.toString());
        uploadUrls.push({ fileName: fileNames[i], uploadUrl: url });
        imagePaths.push(url.split("?")[0]); // Public readable URL
    }

    const newKyc = await Kyc.create([{
        userId,
        fullName,
        accountHandle,
        email,
        phoneNumber,
        nationalIdType,
        frontImage: imagePaths[0],
        backImage: imagePaths[1],
        status: "AWAITING_PAYMENT"
    }], { session });

    await session.commitTransaction();

    res.status(constants.httpStatus.ok).json({
        status: 1,
        msg: "KYC application submitted successfully",
        payload: {
            kycId: newKyc[0]._id,
            uploadUrls
        }
    });
    
  } catch (error) {
    logger.error(`Error in submitKyc: ${error.message}`, { error });
    await session.abortTransaction();
    res.status(constants.httpStatus.serverError).json({
        status: 0,
        msg: "Something went wrong",
        payload: {},
    });
  } finally {
    session.endSession();
  }
};

const getKycStatus = async (req, res) => {
    const userId = req.user._id;
    try {
        const kycParams = await Kyc.findOne({ userId }).sort({ createdAt: -1 }); // Get latest
        res.status(constants.httpStatus.ok).json({
            status: 1,
            msg: "Success",
            payload: {
                kyc: kycParams || null
            }
        });
    } catch (error) {
        logger.error(`Error in getKycStatus: ${error.message}`, { error });
        res.status(constants.httpStatus.serverError).json({
            status: 0,
            msg: "Something went wrong",
            payload: {}
        });
    }
};

module.exports = { submitKyc, getKycStatus };
