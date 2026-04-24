const Accomodation = require("../models/accomodation.js");
const Reviews = require("../models/reviews.js");

const createReviews = async (req, res) => {
  const session = await Reviews.startSession();
  session.startTransaction();
  const { userId, adsId, review, ratings } = req.body;
  const myUserId = req.user._id;
  try {
    if (!userId || !adsId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    if (!review && !ratings) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: 0,
        msg: "please add either review or ratings",
        payload: {},
      });
    }
    if (review && review.length < 1) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: 0,
        msg: "content length must be greater than one letter",
        payload: {},
      });
    }
    if (myUserId.toString() !== userId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: 0,
        msg: "unauthorized request",
        payload: {},
      });
    }
    const accomodation = await Accomodation.findById(adsId).session(session);
    if (!accomodation) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: 0,
        msg: "not found",
        payload: {},
      });
    }
    let newReview;
    const isExists = await Reviews.findOne({ userId, adsId }).session(session);
    if (isExists) {
      if (ratings) {
        isExists.ratings = ratings;
      }
      if (review) {
        isExists.review = review;
      }
      await isExists.save({ session });
    } else {
      newReview = await Reviews.create(
        [
          {
            userId,
            adsId,
            review: review ? review : null,
            ratings: ratings ? ratings : null,
          },
        ],
        { session }
      );
      if (!newReview) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          status: 0,
          msg: "review not published",
          payload: {},
        });
      }
      if (review) {
        accomodation.totalReviews += 1;
      }
      await accomodation.save({ session });
    }
    const reviews = await Reviews.find({ adsId }).session(session);
    const totalRatings = reviews.reduce((sum, r) => sum + (r.ratings || 0), 0);
    const totalCount = reviews.filter(r => r.ratings !== null).length;
    const newAverage = totalCount > 0 ? totalRatings / totalCount : 0;
    const ratingScore =  accomodation.averageRatings * (Math.log10(totalRatings + 1) + 1);
    accomodation.totalRatings = totalCount;
    accomodation.averageRatings = newAverage.toFixed(1);
    accomodation.ratingScore = ratingScore;
    await accomodation.save({ session });

    await session.commitTransaction();
    session.endSession();
    res.status(200).json({
      status: 1,
      msg: "success",
      payload: {
        result: isExists ? isExists : newReview
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log("error in createReviews", error.message);
    res.status(500).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};


const getAllReviews = async (param) => {
  try {
    const adsId = param.adsId;
    const pageSize = param.perPage;
    const page = param.page;
    const totalCount = await Reviews.countDocuments({
      adsId,
    });
    const totalPages = Math.ceil(totalCount / pageSize);
    if (page > totalPages) {
      return { reviews: [], totalPages };
    }
    const skip = (page - 1) * pageSize;
    const reviews = await Reviews.find({ adsId })
      .populate("userId", "name profileImage")
      .select("_id adsId review ratings createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .exec();
    return { reviews, totalPages, totalCount };
  } catch (error) {
    console.log("error in getAllReviews", error.message);
    return false;
  }
};

const getReviewsList = async (req, res) => {
  const { adsId, pages } = req.query;
  try {
    if (!adsId) {
      return res.status(400).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const param = {
      adsId,
      perPage: 10,
      page: parseInt(pages, 10) || 1,
    };
    if (param.page < 1) {
      return res.status(400).json({
        status: 0,
        msg: "Invalid page number",
        payload: {},
      });
    }
    const data = await getAllReviews(param);
    if (data === false) {
      return res.status(400).json({
        status: 0,
        msg: "internal server error",
        payload: {},
      });
    }
    res.status(200).json({
      status: 1,
      msg: "success",
      payload: {
        reviews: data.reviews,
        totalPages: data.totalPages,
        totalCount: data.totalCount,
        currentPage: param.page,
      },
    });
  } catch (error) {
    console.log("error in getReviewsList", error.message);
    res.status(500).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const updateReview = async (req, res) => {
  const { userId, adsId, review, ratings } = req.body;
  try {
    if (!userId || !adsId) {
      return res.status(400).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    if (!review && !ratings) {
      return res.status(400).json({
        status: 0,
        msg: "please add either review or ratiings",
        payload: {},
      });
    }
    const myUserId = req.user._id.toString();
    if (myUserId !== userId) {
      return res.status(400).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const currentReview = await Reviews.findOne({ adsId });
    if (!currentReview) {
      return res.status(400).json({
        status: 0,
        msg: "review not found",
        payload: {},
      });
    }
    if (review) {
      currentReview.review = review;
    }
    if (ratings) {
      currentReview.ratings = ratings;
    }
    await currentReview.save();
    res.status(200).json({
      status: 1,
      msg: "success",
      payload: {
        updatedReview: currentReview,
      },
    });
  } catch (error) {
    console.log("error in updateReviews", error.message);
    res.status(500).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

// const deleteReview = async (req, res) => {
//   const { userId, adsId } = req.body;
//   try {
//     if (!userId || !adsId) {
//       return res.status(400).json({
//         status: 0,
//         msg: "missing required* fields",
//         payload: {},
//       });
//     }
//     const myUserId = req.user._id.toString();
//     if (myUserId !== userId) {
//       return res.status(400).json({
//         status: 0,
//         msg: "unauthorize request",
//         payload: {},
//       });
//     }
//     const review = await Reviews.findOne({ userId, adsId });
//     if (!review) {
//       return res.status(400).json({
//         status: 0,
//         msg: "review not found",
//         payload: {},
//       });
//     }
//     await review.deleteOne();
//     res.status(200).json({
//       status: 1,
//       msg: "success",
//       payload: {},
//     });
//   } catch (error) {
//     console.log("error in deleteReview", error.message);
//     res.status(500).json({
//       status: 0,
//       msg: "something went wrong",
//       payload: {},
//     });
//   }
// };

const deleteReview = async (req, res) => {
  const session = await Reviews.startSession();
  session.startTransaction();

  const { reviewId } = req.params;
  const userId = req.user._id.toString();

  try {
    if (!reviewId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const review = await Reviews.findById(reviewId).session(session);
    if (!review) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: 0,
        msg: "review not found",
        payload: {},
      });
    }
    if (review.userId.toString() !== userId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const adsId = review.adsId;
    const ad = await Accomodation.findById(adsId).session(session);
    if (ad) {
      ad.totalReviews = Math.max(0, (ad.totalReviews || 0) - 1);
      await ad.save({ session });
    }
    const deletedReview = await Reviews.findByIdAndDelete(reviewId).session(
      session
    );
    if (!deletedReview) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        status: 0,
        msg: "Failed to delete review",
        payload: {},
      });
    }
    await session.commitTransaction();
    session.endSession();
    return res.status(200).json({
      status: 1,
      msg: "success",
      payload: deletedReview,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error in deleteReview:", error.message);
    return res.status(500).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

module.exports = {
  createReviews,
  getReviewsList,
  updateReview,
  deleteReview,
};
