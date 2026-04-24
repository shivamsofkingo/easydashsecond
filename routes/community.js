const { Router } = require("express");
const { ensureAuth } = require("../middlewares/tokenIdentity.js");
const { 
    createCommunity,
    saveCommunityImage,
    editCommunityImage,
    editCommunity,
    getAllCommunities,
    deleteCommunityImage,
    deleteCommunity,

} = require("../controllers/community.js");

const communityRouter = Router();

communityRouter.post("/createCommunity", ensureAuth, createCommunity);
communityRouter.post("/saveImage", ensureAuth, saveCommunityImage);
communityRouter.post("/editImage", ensureAuth, editCommunityImage);
communityRouter.post("/editCommunity", ensureAuth, editCommunity);
communityRouter.post("/deleteImage", ensureAuth, deleteCommunityImage);
communityRouter.post("/deleteCommunity", ensureAuth, deleteCommunity);
communityRouter.get("/getAllCommunities", getAllCommunities);

module.exports = communityRouter;