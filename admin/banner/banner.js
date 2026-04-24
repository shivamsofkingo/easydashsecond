const Banner = require("../../models/banner.js");
const constants = require("../../constants/constants.js");
const { logger } = require("../../config/loggerConfig.js");
const { uploadBannerImages } = require("../../utils/banner/hanldeImages.js");
const { updateBannerImage } = require("../../utils/ads/ads.js");
const {
  createBannerUploadUrl,
  deleteBannerImages,
} = require("../../utils/fileUpload/file.js");

const createBanner = async (req, res) => {
  const session = await Banner.startSession();
  session.startTransaction();
  const { title, description, validity, expiryDate, fileNames, contentTypes } = req.body;
  const myUserId = req.user._id;
  try {
    if (!fileNames || !contentTypes) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const totalVisibleBanners = await Banner.countDocuments({
      visibility: true,
      isDeleted: false
    });
    let AdsImages = [];
    if (fileNames.length !== contentTypes.length) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "File names and content types must match in length",
        payload: {},
      });
    }
    const param = { userId: myUserId, fileNames, contentTypes };
    const imgUrls = await uploadBannerImages(param);
    for (const { fileName, uploadUrl, contentType } of imgUrls) {
      AdsImages.push({ fileName, uploadUrl, contentType });
    }
    const newBanner = await Banner.create(
      [
        {
          userId: myUserId,
          title: title ? title.trim() : "NA",
          description: description ? description.trim() : "NA",
          visibility: totalVisibleBanners <= 15 ? true : false,
          validity,
          expiryDate,
        },
      ],
      { session }
    );
    await session.commitTransaction();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        newBanner,
        uploadUrls: AdsImages,
      },
    });
  } catch (error) {
    logger.error(`error in createBanner: ${error.message}`, { error });
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

const saveBannerImages = async (req, res) => {
  const session = await Banner.startSession();
  session.startTransaction();
  const { userId, bannerId, fileNames } = req.body;
  const myUserId = req.user._id;
  try {
    if (!userId || !bannerId || !fileNames) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        paylaod: {},
      });
    }
    if (myUserId.toString() !== userId) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        paylaod: {},
      });
    }
    const updatedImages = [];
    for (const singleFileName of fileNames) {
      const updatedData = await updateBannerImage({
        userId,
        bannerId,
        fileNames: singleFileName,
        session,
      });
      updatedImages.push(...updatedData);
    }
    await session.commitTransaction();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {},
    });
  } catch (error) {
    logger.error(`error in saveBannerImages: ${error.message}`, { error });
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

const editBannerImages = async (req, res) => {
  const session = await Banner.startSession();
  session.startTransaction();
  const { bannerId, fileNames, contentTypes } = req.body;
  const myUserId = req.user._id;
  try {
    if (!bannerId || !fileNames || !contentTypes) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        paylaod: {},
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
      const uploadUrl = await createBannerUploadUrl(
        fileName,
        contentType,
        myUserId
      );
      const param = {
        userId: myUserId,
        bannerId,
        fileNames: fileName,
        session,
      };
      await updateBannerImage(param);
      uploadUrls.push({
        fileName,
        uploadUrl,
      });
    }
    await session.commitTransaction();
  } catch (error) {
    logger.error(`error in editBannerImages: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  } finally {
    session.endSession();
  }
};

const getAllBanners = async (req, res) => {
  const { pages = 1, limit = constants.perPage.pageLimit15 } = req.query;
  const page = parseInt(pages, 10) || 1;
  const skip = (page - 1) * limit;
  try {
    const totalCount = await Banner.countDocuments({
      visibility: true,
      isDeleted: false
    });
    const totalPages = Math.ceil(totalCount / limit);
    const banners = await Banner.find({ visibility: true, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        results: banners,
        meta: {
          currentPage: page,
          itemsPerPage: limit,
          totalPages,
          totalCount,
        },
      },
    });
  } catch (error) {
    logger.error(`error in getBanners: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getDeletedBanners = async (req, res) => {
  const { pages = 1, limit = constants.perPage.pageLimit15 } = req.query;
  const page = parseInt(pages, 10) || 1;
  const skip = (page - 1) * limit;
  try {
    const totalCount = await Banner.countDocuments({ isDeleted: true });
    const totalPages = Math.ceil(totalCount / limit);
    const banners = await Banner.find({ isDeleted: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    res.status(constants.httpStatus.ok).json({
      status: 0,
      msg: "success",
      payload: {
        results: banners,
        meta: {
          currentPage: page,
          itemsPerPage: limit,
          totalPages,
          totalCount,
        },
      },
    });
  } catch (error) {
    logger.error(`error in getDeletedBanners: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const updateBannerVisibility = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Missing required fields",
        payload: {},
      });
    }
    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "Banner not found",
        payload: {},
      });
    }
    if (!banner.visibility) {
      const totalVisibleBanners = await Banner.countDocuments({ visibility: true, isDeleted: false });
      if (totalVisibleBanners >= 15) {
        return res.status(constants.httpStatus.badRequest).json({
          status: 0,
          msg: "Limit reached. Turn off visibility of another banner first.",
          payload: {},
        });
      }
    }
    banner.visibility = !banner.visibility;
    await banner.save();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "Success",
      payload: { visibility: banner.visibility },
    });
  } catch (error) {
    logger.error(`Error in updateBannerVisibility: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

const getAllVisibleBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ visibility: true, isDeleted: false }).sort({ createdAt: -1 });
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        results: banners
      },
    });
  } catch (error) {
    logger.error(`Error in getAllVisibleBanners: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
}

const removeBanner = async (req, res) => {
  const { bannerId } = req.body;
  try {
    if (!bannerId) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const banner = await Banner.findById(bannerId);
    if (!banner) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "banner not found",
        payload: {},
      });
    }
    banner.isDeleted = true;
    await banner.save();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {},
    });
  } catch (error) {
    logger.error(`error in removeImages: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const deleteBanner = async (req, res) => {
  const { bannerId } = req.body;
  try {
    if (!bannerId) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const banner = await Banner.findByIdAndDelete(bannerId);
    if (!banner) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "banner not found",
        payload: {},
      });
    }
    const fileNames = banner.images;
    await deleteBannerImages(fileNames, banner.userId);
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {},
    });
  } catch (error) {
    logger.error(`error in deleteBanner: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

module.exports = {
  createBanner,
  saveBannerImages,
  editBannerImages,
  getAllBanners,
  getDeletedBanners,
  getAllVisibleBanners,
  updateBannerVisibility,
  removeBanner,
  deleteBanner,
};
