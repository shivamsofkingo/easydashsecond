const cron = require("node-cron");
const constants = require("../../constants/constants.js");
const {
  updateEventCompletion,
  deleteCancelledEvents,
} = require("./eventUpdate.js");
const { updateBannerVisibility } = require("./bannerValidity.js");
const { updateBoostValidity } = require("./boostValidity.js");
const { updateSubscriptionValidity } = require("./subscriptionValidity.js");
const { eventLogger, bannerLogger } = require("../../config/loggerConfig.js");

cron.schedule(`${constants.schedule.at0After15} ${constants.schedule.at0} * * *`, async () => {
  eventLogger.info("Running scheduled job to update completed events");
  await updateEventCompletion();
});

cron.schedule(`${constants.schedule.at1After20} ${constants.schedule.at1} * * *`, async () => {
  eventLogger.info("Running scheduled job to delete cancelled events");
  await deleteCancelledEvents();
});

cron.schedule(`${constants.schedule.at2After15} ${constants.schedule.at2} * * *`, async () => {
  bannerLogger.info("Running scheduled job to update banner visibility");
  await updateBannerVisibility();
});

cron.schedule(`30 3 * * *`, async () => {
  bannerLogger.info("Running scheduled job to update boost validity");
  await updateBoostValidity();
});

cron.schedule(`0 4 * * *`, async () => {
  bannerLogger.info("Running scheduled job to update subscription validity");
  await updateSubscriptionValidity();
});