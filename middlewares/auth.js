const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const axios = require("axios");

const User = require("../models/users.js");
const admin = require("../config/firebaseAdminConfig.js");
const AdminUser = require("../models/admin.js");

const firebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      msg: "Token required*",
    });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decodedValue = await admin.auth().verifyIdToken(token);
    if (decodedValue) {
      const user = await User.findOne({ email: decodedValue.email });
      if (!user) {
        return res.status(401).json({ message: "user does'nt exist" });
      }
      user.googleId = decodedValue.uid;
      await user.save();
      user.email = undefined;
      req.user = user;
      return next();
    } else {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
  } catch (error) {
    console.log("Error during token verification:", error.message);
    return res
      .status(500)
      .json({ message: "Internal Error", error: error.message });
  }
};

const jwtToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json("Token not provided.");
    }
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const admin = await AdminUser.findById(decoded.id);
    const user = await User.findById(decoded.id);
    if (!user && !admin) {
      return res.status(401).json("User not found.");
    }
    if(admin) {
      req.user = admin;
    } else {
      req.user = user;
    }
    next();
  } catch (err) {
    return res.status(401).json("Invalid token.");
  }
};

const appleToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "Token required*" });
  }
  const identityToken = authHeader.split(" ")[1];
  try {
    const decodedHeader = jwt.decode(identityToken, { complete: true });
    if (!decodedHeader) {
      return res.status(401).json({ message: "Invalid token format" });
    }
    const { kid } = decodedHeader.header;
    const appleKeysResponse = await axios.get(
      "https://appleid.apple.com/auth/keys"
    );
    const appleKeys = appleKeysResponse.data.keys;
    const appleKey = appleKeys.find((key) => key.kid === kid);
    if (!appleKey) {
      return res.status(401).json({ message: "Invalid key ID" });
    }
    const publicKey = jwt.keyToPEM(appleKey);
    const verifiedToken = jwt.verify(identityToken, publicKey, {
      algorithms: ["RS256"],
      issuer: "https://appleid.apple.com",
      audience: process.env.APPLE_CLIENT_ID,
    });
    const { sub: appleId, email } = verifiedToken;
    let user = await User.findOne({ appleId });
    if (!user) {
      user = await User.findOne({ email });
      if (!user) {
        user = new User({ email, appleId, profileType: "NONE" });
        await user.save();
      } else {
        user.appleId = appleId;
        await user.save();
      }
    }
    req.user = user;
    next();
  } catch (error) {
    console.error("Error during Apple token verification:", error.message);
    return res
      .status(500)
      .json({ message: "Internal Error", error: error.message });
  }
};

module.exports = { firebaseToken, jwtToken, appleToken };
