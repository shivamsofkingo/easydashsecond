const express = require("express");
const compression = require("compression");
const fileUpload = require("express-fileupload");
const cors = require("cors");
var cookieParser = require('cookie-parser')
// const { RateLimiterMemory } = require("rate-limiter-flexible");
require("dotenv").config();
require("./config/redis.js");
//require('./utils/event/cronJobs.js');


const connectDB = require("./db/dbConfig.js");
const { app, server } = require("./socket/socket.js");

// const swaggerUi = require("swagger-ui-express");
// const swaggerDocument = require("./swagger.js");

const userRoute = require("./routes/user.js");
const profileRoute = require("./routes/profile.js");
const accomodationRoute = require("./routes/accomodation.js");
const reviewRouter = require("./routes/review.js");
const giveawayRoute = require("./routes/giveaway.js");
const marketplaceRoute = require("./routes/marketplace.js");
const eventRouter = require("./routes/event.js");
const groupRouter = require("./routes/group.js");
const messageRouter = require("./routes/message.js");
const followRouter = require("./routes/follow.js");
const favouritesRouter = require("./routes/favourites.js");
const notificationRouter = require("./routes/notification.js");
const communityRouter = require("./routes/community.js");
const adminRouter = require("./admin/routes/routes.js");
const reportRouter = require("./routes/report.js");
const { logger } = require("./config/loggerConfig.js");
const { bannerRouter } = require("./routes/banner.js");
const blockFilter = require("./middlewares/blockFilter.js");
const { blockRouter } = require("./routes/blockRouter.js");
const optionalAuth = require("./middlewares/optionalAuth.js");
const bookingRouter = require("./routes/bookingRouter.js");
const webhooksRouter = require("./routes/webhooksRouter.js");
const stripeConnectRouter = require("./routes/stripeConnectRouter.js");
const kycRouter = require("./routes/kyc.js");
const subscriptionRouter = require("./routes/subscription.js");
const { handleStripeWebhook } = require("./controllers/subscriptionController.js");

connectDB();
app.post("/api/subscription/webhook", express.raw({ type: 'application/json' }), handleStripeWebhook);
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(fileUpload());
app.use(compression({
  level: 6,
  threshold: 100 * 1000
}));


// const rateLimiter = new RateLimiterMemory({
//   points: 100,
//   duration: 900 * 60,
// });
// app.use(async (req, res, next) => {
//   try {
//     await rateLimiter.consume(req.ip);
//     next();
//   } catch {
//     res.status(429).json({ 
//       status: 0, msg: "Too many requests, please try again later" 
//     });
//   }
// });
app.use(optionalAuth, blockFilter);
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api/admin", adminRouter);
app.use("/api/banner", bannerRouter);
app.use("/api/user", userRoute);
app.use("/api/block", blockRouter);
app.use("/api/profile", profileRoute);
app.use("/api/giveaway", giveawayRoute);
app.use("/api/marketplace", marketplaceRoute);
app.use("/api/accommodation", accomodationRoute);
app.use("/api/event", eventRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/stripe-connect", stripeConnectRouter);
app.use("/api/community", communityRouter);
app.use("/api/group", groupRouter);
app.use("/api/message", messageRouter);
app.use("/api/webhooks", webhooksRouter);
app.use("/api/kyc", kycRouter);
app.use("/api/subscription", subscriptionRouter);

app.use("/api/notification", notificationRouter);
app.use("/api/follow", followRouter);
app.use("/api/favourites", favouritesRouter)
app.use("/api/review", reviewRouter);
app.use("/api/report", reportRouter);

app.get("/", (req, res) => {
  res.send("Hello");
});

app.get("/test/test1", (req, res) => {
  res.send("Test1");
});

app.use((err, req, res, next) => {
  logger.error(`uncaught error: ${err.message}`, { err });
  res.status(500).json({
    status: 0,
    msg: "Something went wrong!",
    payload: {},
  });
});

// app.listen(process.env.PORT, () => {
//   console.log(`server running on port ${process.env.PORT}`);
// });
 
server.listen(process.env.PORT, () => {
  console.log(`server running on port ${process.env.PORT}`);
});

//crob-jobs
require("./utils/jobs/scheduler.js");