const { Router } = require("express");
const { ensureAuth } = require("../middlewares/tokenIdentity.js");
const { createPaymentCheckout, createBooking, applyCoupon, getOrderDetailsList, getCoupons } = require("../controllers/Booking.js");

const bookingRouter = Router();
//user

bookingRouter.post("/create", ensureAuth, createBooking);
bookingRouter.post("/apply-coupon/:bookingId", ensureAuth, applyCoupon);


bookingRouter.post("/createPaymentCheckout/:bookingId", ensureAuth, createPaymentCheckout);
//organzier
//bookingRouter.get("/orderDetails/:postId", ensureAuth, getOrderDetailsList);

//public
bookingRouter.get("/getCoupons", getCoupons);

module.exports = bookingRouter;