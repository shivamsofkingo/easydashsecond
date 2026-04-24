const { Router } = require('express');
const { 
    createMarketplacePost,
    saveMarketplaceImages,
    editMarketplaceAdsImages,
    editMarketplacePost,
    getAllMarketplacePostList,
    getPostByCategory,
    getMarketplacePostDetails,
    getMarketplaceByUserNearbyLocation,
    getMarketplaceByNearbyLocation,
    deleteMarketplaceImage,
    deleteMarketplacePost,
    searchMarketplace,
} = require('../controllers/marketplace.js');
const { ensureAuth } = require('../middlewares/tokenIdentity.js');

const marketplaceRoute = Router();

marketplaceRoute.post("/createPost", ensureAuth, createMarketplacePost);
marketplaceRoute.post("/saveImages", ensureAuth, saveMarketplaceImages);
marketplaceRoute.post("/editImages", ensureAuth, editMarketplaceAdsImages);
marketplaceRoute.post("/editPost/:id", ensureAuth, editMarketplacePost);
marketplaceRoute.post('/deletePost', ensureAuth, deleteMarketplacePost);
marketplaceRoute.post('/deleteImages', ensureAuth, deleteMarketplaceImage);

marketplaceRoute.get("/getAllPost", getAllMarketplacePostList);
marketplaceRoute.get("/getCategoryPost", getPostByCategory);
marketplaceRoute.get("/getPostDetails/:id", getMarketplacePostDetails);
marketplaceRoute.get("/getSearchedPost", searchMarketplace);
marketplaceRoute.get("/getUserNearbyPost", ensureAuth, getMarketplaceByUserNearbyLocation);
marketplaceRoute.get("/getNearByPost", getMarketplaceByNearbyLocation);


module.exports = marketplaceRoute;