const { Schema, model } = require("mongoose");

const emailVerifySchema = new Schema({
    otp: { type: String, default: null },
    otpExpiration: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now() }
}, {timestamps: true});

module.exports = model("EmailVerify", emailVerifySchema);