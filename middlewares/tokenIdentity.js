const admin = require("../config/firebaseAdminConfig.js");
const { firebaseToken, jwtToken } = require("../middlewares/auth.js");

const ensureAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "Token required*" });
  }
  const token = authHeader.split(" ")[1];
  // console.log("token check --------> ", token);
  try {
    const decodedValue = await admin.auth().verifyIdToken(token);
    if (decodedValue) {
      return firebaseToken(req, res, next);
    }
  } catch (firebaseError) {
    try {
      // console.error("Firebase token verification failed:", firebaseError.message);
      return jwtToken(req, res, next);
    } catch (jwtError) {
      console.error("Both Firebase and JWT token verification failed");
      return res.status(401).json({ msg: "Unauthorized: Invalid token" });
    }
  }
};

module.exports = { ensureAuth };
