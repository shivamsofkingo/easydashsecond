const { Queue } = require("bullmq");
const Redis = require("../../config/redis.js");

const notificationQueue = new Queue("notifications", {
  connection: Redis.getClient(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000
    },
    removeOnComplete: true
  },
});

// const notificationQueueForAds = new Queue("adsNotification", {
//   connection: Redis.getClient(),
//   defaultJobOptions: {
//     attempts: 2,
//     backoff: {
//       type: "exponential",
//       delay: 1000
//     },
//   },
// });

module.exports = notificationQueue;