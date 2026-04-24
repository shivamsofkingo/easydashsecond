const { Router } = require("express");
const { ensureAuth } = require("../middlewares/tokenIdentity.js");
const {
    createEvent,
    saveEventImages,
    editEventImages,
    searchEvents,
    editEventPost,
    getAllEventPostList,
    getEventByUserNearbyLocation,
    getEventByNearbyLocation,
    getFilteredPost,
    saveInterestedUsers,
    saveComment,
    saveCommentReply,
    removeInterestedUsers,
    updateEventStatus,
    deleteEventPost,
    getEventDetails,
    deleteEventImage,
    getTrendingEvents,
    getComments,
    getCommentsReply,
    getInterestedUsers,
    getInterestedEvents,
} = require("../controllers/event.js");
const optionalAuth = require("../middlewares/optionalAuth.js");
const { getOrderDetails } = require("../controllers/Booking.js");
const eventRouter = Router();

eventRouter.post("/createPost", ensureAuth, createEvent);
eventRouter.post("/saveImages", ensureAuth, saveEventImages);
eventRouter.post("/editImages", ensureAuth, editEventImages);
eventRouter.post("/editPost/:id", ensureAuth, editEventPost);
eventRouter.post("/saveInterest", ensureAuth, saveInterestedUsers);
eventRouter.post("/saveComment", ensureAuth, saveComment);
eventRouter.post("/saveCommentReply", ensureAuth, saveCommentReply);
eventRouter.post("/removeInterestedUser", ensureAuth, removeInterestedUsers);
eventRouter.post("/updateStatus", ensureAuth, updateEventStatus);
eventRouter.post("/deleteImages", ensureAuth, deleteEventImage);
eventRouter.post("/deletePost", ensureAuth, deleteEventPost);

eventRouter.get("/getBookingDetails/:eventId",ensureAuth,getOrderDetails);

eventRouter.get("/getAllPost", getAllEventPostList);
eventRouter.get("/getPostDetails/:id", getEventDetails);
eventRouter.get("/getSearchedPost", searchEvents);
eventRouter.get("/getTrendingEvents", getTrendingEvents);
eventRouter.get("/getUserNearbyPost", ensureAuth, getEventByUserNearbyLocation);
eventRouter.get("/getNearByPost", getEventByNearbyLocation);
eventRouter.get("/getInterestedUsere", getInterestedUsers);
eventRouter.get("/getFilteredPost", getFilteredPost);
eventRouter.get("/getComments", getComments);
eventRouter.get("/getCommentsReply", getCommentsReply);
eventRouter.get("/getInterestedEvents", ensureAuth, getInterestedEvents);

module.exports = eventRouter;