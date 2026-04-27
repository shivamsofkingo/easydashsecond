const { Router } = require("express");
const { createReviews, getReviewsList, deleteReview } = require("../controllers/reviews.js");
const { ensureAuth } = require("../middlewares/tokenIdentity.js");

const reviewRouter = Router();

reviewRouter.post("/createReview", ensureAuth, createReviews);
reviewRouter.get("/getReviews", getReviewsList);
reviewRouter.delete("/:reviewId", ensureAuth, deleteReview);

module.exports = reviewRouter;
