const Event = require("../../models/event.js");
const { eventLogger } = require("../../config/loggerConfig.js");
const constants = require("../../constants/constants.js");

const updateEventCompletion = async () => {
  try {
    const currentDate = new Date();
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const events = await Event.find(
        {
          date: { $lt: currentDate },
          isEventCompleted: false,
        },
        { _id: 1 }
      )
        .skip(skip)
        .limit(constants.batchSize.default)
        .lean();

      if (events.length === 0) {
        hasMore = false;
        eventLogger.info("No more events to update.");
        break;
      }
      const eventIds = events.map((event) => event._id);
      const result = await Event.updateMany(
        {
          _id: { $in: eventIds },
        },
        {
          $set: { isEventCompleted: true },
        }
      );
      eventLogger.info(
        `event completion batch updated: ${result.modifiedCount} out of ${result.matchedCount}`
      );
      skip += constants.batchSize.default;
    }
  } catch (error) {
    eventLogger.info("Error in updateEventCompletion:", error.message);
    throw error;
  }
};

const deleteCancelledEvents = async () => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    let skip = 0;
    let hasMore = true;
    while (hasMore) {
      const events = await Event.find(
        {
          eventStatus: "cancelled",
          date: { $lt: oneWeekAgo },
          isDeleted: false,
        },
        { _id: 1 }
      )
        .skip(skip)
        .limit(constants.batchSize.default)
        .lean();

      if (events.length === 0) {
        hasMore = false;
        eventLogger.info("No more cancelled events to delete.");
        break;
      }
      const eventIds = events.map((event) => event._id);
      const result = await Event.updateMany(
        {
          _id: { $in: eventIds },
        },
        {
          $set: { isDeleted: true },
        }
      );
      eventLogger.info(
        `Cancelled events marked as deleted: ${result.modifiedCount} out of ${result.matchedCount}`
      );
      skip += constants.batchSize.default;
    }
  } catch (error) {
    eventLogger.info("Error in deleteCancelledEvents:", error.message);
    throw error;
  }
};

module.exports = {
  updateEventCompletion,
  deleteCancelledEvents,
};
