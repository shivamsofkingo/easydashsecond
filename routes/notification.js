const { Router } = require("express");
const { getNotifications, getUnreadNotificationCount, getNotificationAdDetails } = require("../controllers/notification.js");
const { ensureAuth } = require("../middlewares/tokenIdentity.js");

const notificationRouter = Router();

notificationRouter.get("/", ensureAuth, getNotifications);
notificationRouter.get("/unreadCount/:id", ensureAuth, getUnreadNotificationCount);
notificationRouter.get("/getAdDetails", ensureAuth, getNotificationAdDetails);

module.exports = notificationRouter;