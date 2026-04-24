const { Router } = require('express');
const { 
    createGiveawayPost,
    saveGiveawayImages,
    editGiveawayAdsImages,
    deleteGiveawayImage,
    getAllGiveawayPostList,
    getPostByCategory,
    getGiveawayPostDetails,
    getGiveawayByUserNearbyLocation,
    getGiveawayByNearbyLocation,
    editGiveawayPost,
    deleteGiveawayPost,
    searchGiveaway,
} = require('../controllers/giveaways.js');
const { ensureAuth } = require('../middlewares/tokenIdentity.js');

const giveawayRoute = Router();

giveawayRoute.post("/createPost", ensureAuth, createGiveawayPost);
giveawayRoute.post("/saveImages", ensureAuth, saveGiveawayImages);
giveawayRoute.post("/editImages", ensureAuth, editGiveawayAdsImages);
giveawayRoute.post("/editPost/:id", ensureAuth, editGiveawayPost);
giveawayRoute.post('/deletePost', ensureAuth, deleteGiveawayPost);
giveawayRoute.post('/deleteImages', ensureAuth, deleteGiveawayImage);

giveawayRoute.get("/getAllPost", getAllGiveawayPostList);
giveawayRoute.get("/getCategoryPost", getPostByCategory);
giveawayRoute.get("/getPostDetails/:id", getGiveawayPostDetails);
giveawayRoute.get("/getSearchedPost", searchGiveaway);
giveawayRoute.get("/getUserNearbyPost", ensureAuth, getGiveawayByUserNearbyLocation);
giveawayRoute.get("/getNearByPost", getGiveawayByNearbyLocation);


module.exports = giveawayRoute;