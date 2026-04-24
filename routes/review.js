const { Router } = require("express");
const { createReviews, getReviewsList } = require("../controllers/reviews.js");
const { ensureAuth } = require("../middlewares/tokenIdentity.js");

const reviewRouter = Router();

reviewRouter.post("/createReview", ensureAuth, createReviews);
reviewRouter.get("/getReviews", getReviewsList);

module.exports = reviewRouter;
