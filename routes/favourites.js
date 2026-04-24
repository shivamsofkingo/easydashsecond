const { Router } = require("express");
const { 
    saveLikedPost,
    getLikedPosts
} = require("../controllers/favourites");
const { ensureAuth } = require("../middlewares/tokenIdentity");

const favouritesRouter = Router();

favouritesRouter.post("/likePost", ensureAuth, saveLikedPost)
favouritesRouter.get("/getLikedPost", ensureAuth, getLikedPosts);

module.exports = favouritesRouter;