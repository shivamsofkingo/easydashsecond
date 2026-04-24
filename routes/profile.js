const { Router } = require("express");
const {
  createProfile,
  editProfile,
  getUserProfileDetails,
  saveProfileImage,
  saveCoverImage,
  editProfileImage,
  deleteProfileImage,
  getAllPostByUserId,
  markAsSold,
  markAsUnsold,
} = require("../controllers/profile.js");
const { ensureAuth } = require("../middlewares/tokenIdentity.js");

const profileRoute = Router();

profileRoute.post("/createProfile", ensureAuth, createProfile);
profileRoute.post("/editProfile", ensureAuth, editProfile);
profileRoute.post("/saveProfileImage", ensureAuth, saveProfileImage);
profileRoute.post("/saveCoverImage", ensureAuth, saveCoverImage);
profileRoute.post("/editUserProfileImage", ensureAuth, editProfileImage);
profileRoute.post("/markAsSold", ensureAuth, markAsSold);
profileRoute.post("/markAsUnsold", ensureAuth, markAsUnsold);
profileRoute.post("/deleteProfileImage", ensureAuth, deleteProfileImage);
profileRoute.get("/getUserProfile/:id", getUserProfileDetails);
profileRoute.get("/getUserPost", getAllPostByUserId);

module.exports = profileRoute;
