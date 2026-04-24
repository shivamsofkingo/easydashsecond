const { Schema, model } = require('mongoose');

const otpSchema = new Schema({
  phoneNumber: String,
  otp: String,
  expirationTime: Date
}, { timestamps: true });

module.exports = model('OTP', otpSchema);