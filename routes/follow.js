const { Router } = require("express");
const { followUser, unFollowUser, getFollowers, getFollowings, isFollowing } = require("../controllers/follow.js");
const { ensureAuth } = require("../middlewares/tokenIdentity");

const followRouter = Router();

followRouter.post("/followUser", ensureAuth, followUser);
followRouter.post("/unfollowUser", ensureAuth, unFollowUser);
followRouter.get("/getFollowers/:id", getFollowers);
followRouter.get("/getFollowings/:id", getFollowings);
followRouter.get("/isFollowing/:id", ensureAuth, isFollowing);

module.exports = followRouter;