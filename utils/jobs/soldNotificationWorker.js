const mongoose = require('mongoose');
const { Worker } = require("bullmq");
const Redis = require("../../config/redis.js");
const Notification = require("../../models/notification.js");
const notificationLogger = require("../../config/loggerConfig.js");

main().catch(err => console.log(err));
async function main() {
  await mongoose.connect("mongodb+srv://developers:2vSUIKckMw9zoYCv@easydash.xw4qe.mongodb.net/?retryWrites=true&w=majority&appName=easydash");
}

const soldNotificationWorker = new Worker(
  "soldNotification",
  async (job) => {
    const { recieverId, adsId, adsType, images, notificationType, message } = job.data;
    try {
      await Notification.create({
        recieverId,
        adsId,
        adsType,
        images,
        notificationType,
        message,
      });
    } catch (error) {
      notificationLogger.error(`Error processing notification: ${error.message}`, {error});
      throw new Error(error.message);
    }
  },
  {
    connection: Redis.getClient(),
    concurrency: 50,
    limiter: {
      max: 10,
      duration: 1000,
    },
    settings: {
      maxStalledCount: 2,
    },
  }
);

module.exports = {
  soldNotificationWorker
}
