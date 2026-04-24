const { Schema, model } = require("mongoose");

const adminSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, default: null },
    countryCode: { type: String, default: null },
    phoneNumber: { type: String, default: null },
    password: { type: String, unique: true },
    profileImage: { type: String, default: "NA" },
    address: { type: String, default: "NA" },
    gender: { type: String, default: "NA" },
    role: { type: String, enum: ["superAdmin", "admin"], required: true },
    deviceId: { type: String, default: null },
    deviceToken: { type: String, default: null },
    alternateSignIn: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    googleId: { type: String, default: null },
    appleId: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    resetOtp: { type: String, default: null },
    otpExpiration: { type: Date, default: null }
}, { timestamps: true });

module.exports = model("Admin", adminSchema);