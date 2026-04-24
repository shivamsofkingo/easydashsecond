const { Router } = require("express");
const {
  registerUser,
  loginUserWithEmail,
  createGuestUser,
  guestInteraction,
  forgotPassword,
  verifyOtp,
  resetPassword,
  googleSignInCreateUser,
  getUserById,
  getUserByEmail,
  verifyEmail,
  emailVerifyOtp,
  getUserLocationForGuest,
  updateUserLocation,
  getClosestUniversities,
  appleSignInCreateUser
} = require("../controllers/authController.js");
const { ensureAuth } = require("../middlewares/tokenIdentity.js");
const { sendWhatsappOtp, verifyWhatsappOtp } = require("../services/twilio/config.js");
const { deleteUser } = require("../admin/userController/user.js");

const userRoute = Router();

userRoute.post('/signup', registerUser);
userRoute.post('/googleSignupCreateUser', googleSignInCreateUser);
userRoute.post('/appleSignInCreateUser', appleSignInCreateUser);
userRoute.post('/loginWithEmail', loginUserWithEmail);
userRoute.post('/createGuestUser', createGuestUser);
userRoute.post('/guestInteraction', guestInteraction);
userRoute.post('/deleteUser/:id', ensureAuth, deleteUser);
userRoute.post('/forgotPassword', forgotPassword);
userRoute.post('/verifyOtp', verifyOtp);
userRoute.post('/resetPassword', resetPassword);
userRoute.post('/sendWhatsappOtp', sendWhatsappOtp);
userRoute.post('/verifyWhatappOtp', verifyWhatsappOtp);
userRoute.post('/verifyEmail', ensureAuth, verifyEmail);
userRoute.post('/emailOtpVerify', ensureAuth, emailVerifyOtp);

userRoute.get('/getUserById/:id', getUserById);
userRoute.get('/getUserByEmail', getUserByEmail);
userRoute.post('/updateUserLocation', ensureAuth, updateUserLocation);
userRoute.post('/getLocation', getUserLocationForGuest);
userRoute.post('/getClosestUniversities', getClosestUniversities);

module.exports = userRoute;
