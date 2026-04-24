const { Queue } = require("bullmq");
const Redis = require("../../config/redis.js");

const soldNotificationQueue = new Queue("soldNotification", {
  connection: Redis.getClient(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000
    },
    removeOnComplete: true,
  },
});

module.exports = soldNotificationQueue;