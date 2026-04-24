const { Router } = require("express");
const { ensureAuth } = require("../../middlewares/tokenIdentity.js");
const { 
    loginUserWithEmail,
    getAllUsers, 
    getTotalUsersCount, 
    getTotalStudents, 
    getTotalVendors, 
    getTotalPropertyManagers, 
    getTotalEventManagers, 
    getUserById,
    getUsersCountByDevice,
    getUserCountByMonth,
    editProfileImage,
    editProfile, 
    searchUser,
    restoreUser,
    deleteUser,
    forgotPassword,
    verifyOtp,
    resetPassword,
    logoutAdmin,
    getAllKycRequests,
    getKycById,
    approveKyc,
    rejectKyc
} = require("../userController/user.js");
const {
    createPlan,
    getAllPlans,
    updatePlan,
    deletePlan
} = require("../planController/plan.js");
const {
    initializeAccomodationPlans,
    getAccomodationPlans,
    updateAccomodationPlan
} = require("../planController/accomodationPlan.js");
const {
    initializeBoostPlans,
    getAllBoostPlans,
    updateBoostPlan
} = require("../planController/boostPlan.js");
const { 
    getGiveawaysCount, 
    getMarketplaceCount,
    getAccommodationCount,
    getEventCount,
    getTotalAds,
    getAllAds,
    getAdsCountByMonths,
    getAllGiveaways,
    getAllMarketplace,
    getAllAccommodation,
    getAllEvent,
    deleteGiveawayPost,
    deleteMarketplacePost,
    deleteAccommodationPost,
    deleteEventPost,
    searchAds,
    getGroupsCountInCoummunitites,
    getDeletedGiveawayAds,
    getDeletedMarketplaceAds,
    getDeletedAccommodationAds,
    getDeletedEventsAds,
    getEventDashboardStats,
    getAllEvents,
    removeAds,
    restoreAds,
    getAccommodationRegions
} = require("../adsController/ads.js");
const { 
    getAllReports,
    getAllUsersReport, 
    getAllAdsReport,
    searchReport,
    deleteAdsReport,
    deleteUserReport,
} = require("../reportController/report.js");
const {
    getAllAdmins,
    createAdmin,
    uploadProfileImage,
    editProfileAdmin,
    searchAdmins,
    removeAdmin,
    removeUser,
} = require("../roles/roles.js");
const { 
    createBanner, 
    saveBannerImages,
    editBannerImages,
    updateBannerVisibility,
    getAllBanners,
    getAllVisibleBanners,
    getDeletedBanners,
    removeBanner,
    deleteBanner,
} = require("../banner/banner.js");
const roleIdentity = require("../../middlewares/roleIdentity.js");
const constants = require("../../constants/constants.js");

const adminRouter = Router();

// --------------------- user ---------------------------------
adminRouter.post("/loginWithEmail", loginUserWithEmail);
adminRouter.post("/forgotPassword", forgotPassword);
adminRouter.post("/verifyOtp", verifyOtp);
adminRouter.post("/resetPassword", resetPassword);
adminRouter.post("/logout", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), logoutAdmin);

adminRouter.post("/editProfileImage", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), editProfileImage);
adminRouter.post("/editprofile", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), editProfile);
adminRouter.post("/removeUser/:id", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), deleteUser);
adminRouter.post("/restoreUser/:id", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), restoreUser);
adminRouter.post("/deleteUser", ensureAuth, roleIdentity(constants.role.superAdmin), removeUser);

adminRouter.get("/searchUser", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), searchUser);
adminRouter.get("/getAllUsers", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getAllUsers);
adminRouter.get("/getTotalUsers", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getTotalUsersCount);
adminRouter.get("/getTotalStudents", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getTotalStudents);
adminRouter.get("/getTotalVendors", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getTotalVendors);
adminRouter.get("/getTotalPropertyManagers", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getTotalPropertyManagers);
adminRouter.get("/getTotalEventManagers", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getTotalEventManagers);
adminRouter.get("/getUsersCountByDevice", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getUsersCountByDevice);
adminRouter.get("/getUserById", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getUserById);
adminRouter.get("/getUserCountByMonth", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getUserCountByMonth);

adminRouter.get("/kyc", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getAllKycRequests);
adminRouter.get("/kyc/:id", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getKycById);
adminRouter.put("/kyc/:id/approve", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), approveKyc);
adminRouter.put("/kyc/:id/reject", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), rejectKyc);

// -------------------- ads -------------------------------------
adminRouter.post("/deleteGiveawayPost", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), deleteGiveawayPost);
adminRouter.post("/deleteMarketplacePost", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), deleteMarketplacePost);
adminRouter.post("/deleteAccommodationPost", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), deleteAccommodationPost);
adminRouter.post("/deleteEventPost", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), deleteEventPost);
adminRouter.post("/restoreAds", ensureAuth, roleIdentity(constants.role.superAdmin), restoreAds);
adminRouter.post("/removeAds", ensureAuth, roleIdentity(constants.role.superAdmin), removeAds);

adminRouter.get("/getTotalGiveawaysCount", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getGiveawaysCount);
adminRouter.get("/getTotalMarketplaceCount", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getMarketplaceCount);
adminRouter.get("/getTotalAccommodationCount", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getAccommodationCount);
adminRouter.get("/getTotalEventCount", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getEventCount);
adminRouter.get("/getTotalAdsCount", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getTotalAds);
adminRouter.get("/getAllAds", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getAllAds);
adminRouter.get("/getAdsCountByMonth", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getAdsCountByMonths);
adminRouter.get("/getSearchAds", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), searchAds);
adminRouter.get("/getAllGiveaways", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getAllGiveaways);
adminRouter.get("/getAllMarketplaces", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getAllMarketplace);
adminRouter.get("/getAllAccommodations", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getAllAccommodation);
adminRouter.get("/getAccommodationRegions", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getAccommodationRegions);
adminRouter.get("/getGroupsCountInCoummunitites", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getGroupsCountInCoummunitites);
adminRouter.get("/getDeletedGiveaways", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getDeletedGiveawayAds);
adminRouter.get("/getDeletedMarketplaces", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getDeletedMarketplaceAds);
adminRouter.get("/getDeletedAccommodations", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getDeletedAccommodationAds);
adminRouter.get("/getDeletedEvents", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getDeletedEventsAds);
adminRouter.get("/getEventDashboardStats", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getEventDashboardStats);
adminRouter.get("/getAllEvents", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getAllEvents);

// ------------------- roles -----------------------------------
adminRouter.post("/createAdmin", ensureAuth, roleIdentity(constants.role.superAdmin), createAdmin);
// adminRouter.post("/editProfileImage", ensureAuth, roleIdentity(constants.role.admin), editProfileImage);
adminRouter.post("/editProfile", ensureAuth, roleIdentity(constants.role.admin), editProfileAdmin);
adminRouter.post("/removeAdmin", ensureAuth, roleIdentity(constants.role.superAdmin), removeAdmin);

adminRouter.get("/getAllAdmins", ensureAuth, roleIdentity(constants.role.superAdmin), getAllAdmins);
adminRouter.get("/searchAdmins", ensureAuth, roleIdentity(constants.role.superAdmin), searchAdmins);

// ------------------- report -----------------------------------
adminRouter.post("/deleteAdsReport", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), deleteAdsReport);
adminRouter.post("/deleteUserReport", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), deleteUserReport);

adminRouter.get("/getAllReports", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getAllReports);
adminRouter.get("/getUserReports", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getAllUsersReport);
adminRouter.get("/getAdsReports", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getAllAdsReport);
adminRouter.get("/searchReport", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), searchReport);

// ------------------ banner -------------------------------------
adminRouter.post("/createBanner", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), createBanner);
adminRouter.post("/saveBannerImages", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), saveBannerImages);
adminRouter.post("/editBannerImages", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), editBannerImages);
adminRouter.post("/updateBannerVisibility/:id", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), updateBannerVisibility);
adminRouter.post("/removeBanner", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), removeBanner);
adminRouter.post("/deleteBanner", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), deleteBanner);
adminRouter.get("/getAllBanners", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getAllBanners);
adminRouter.get("/getAllVisibleBanners", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getAllVisibleBanners);
adminRouter.get("/getDeletedBanners", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getDeletedBanners);

// ------------------- subscription plans -----------------------------------
adminRouter.post("/createPlan", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), createPlan);
adminRouter.get("/getAllPlans", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getAllPlans);
adminRouter.patch("/updatePlan/:id", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), updatePlan);
adminRouter.post("/deletePlan/:id", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), deletePlan);

// ------------------- accommodation plans -----------------------------------
adminRouter.post("/initializeAccomodationPlans", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), initializeAccomodationPlans);
adminRouter.get("/getAccomodationPlans", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getAccomodationPlans);
adminRouter.patch("/updateAccomodationPlan/:id", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), updateAccomodationPlan);

// ------------------- boost plans -----------------------------------
adminRouter.post("/initializeBoostPlans", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), initializeBoostPlans);
adminRouter.get("/getBoostPlans", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), getAllBoostPlans);
adminRouter.patch("/updateBoostPlan/:id", ensureAuth, roleIdentity(constants.role.superAdmin, constants.role.admin), updateBoostPlan);

module.exports = adminRouter;