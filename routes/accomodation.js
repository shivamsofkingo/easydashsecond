const { Router } = require("express");
const { ensureAuth } = require("../middlewares/tokenIdentity.js");
const { 
    createAccomodations,
    saveAccomodationImages, 
    editAcoomodationAdsImages, 
    getAllAccomodationPostList, 
    deleteAccomodationImage,
    getAccomodationDetails,
    getAllFilteredPostListByPropertyType,
    getAllFilteredPostListByRoomType,
    getAllFilteredPostListByBedType,
    getAccommodationByUserNearbyLocation,
    getAccommodationByNearbyLocation,
    getTopRatedAccommodations,
    searchAccomodations,
    deleteAccomodationPost,
    editAccomodationPost,
    getFilteredPost,
    boostAccomodation,
    getFeaturedBanners,
    getBoostedAds
} = require("../controllers/accomodation.js");

const accomodationRoute = Router();

accomodationRoute.post("/createPost", ensureAuth, createAccomodations);
accomodationRoute.post("/saveImages", ensureAuth, saveAccomodationImages);
accomodationRoute.post("/editImages", ensureAuth, editAcoomodationAdsImages);
accomodationRoute.post("/editPost/:id", ensureAuth, editAccomodationPost);
accomodationRoute.post("/deletePost", ensureAuth, deleteAccomodationPost);
accomodationRoute.post("/deleteImages", ensureAuth, deleteAccomodationImage);
accomodationRoute.post("/boost/:id", ensureAuth, boostAccomodation);

accomodationRoute.get("/search", searchAccomodations);
accomodationRoute.get("/getAllPost", getAllAccomodationPostList);
accomodationRoute.get("/getPostDetails/:id", getAccomodationDetails);
accomodationRoute.get("/getPostByPropertyType", getAllFilteredPostListByPropertyType),
accomodationRoute.get("/getPostByRoomType", getAllFilteredPostListByRoomType),
accomodationRoute.get("/getPostByBedType", getAllFilteredPostListByBedType),
accomodationRoute.get("/getFilteredPost", getFilteredPost);
accomodationRoute.get("/getUserNearbyPost", ensureAuth, getAccommodationByUserNearbyLocation),
accomodationRoute.get("/getTopRatedPost", getTopRatedAccommodations),
accomodationRoute.get("/getNearByPost", getAccommodationByNearbyLocation),
accomodationRoute.get("/getFeaturedBanners", getFeaturedBanners),
accomodationRoute.get("/getBoostedAds", getBoostedAds),

module.exports = accomodationRoute;