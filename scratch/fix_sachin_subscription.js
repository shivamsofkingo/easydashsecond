const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/users');
const Kyc = require('../models/kyc');
const SubscriptionPlan = require('../models/subscriptionPlan');

async function fixUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const email = "sachin@gmail.com";
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log("User not found");
            process.exit(1);
        }

        const planId = "69c38096819faacd241adc63"; // $5 Monthly plan
        const plan = await SubscriptionPlan.findById(planId);
        
        if (!plan) {
            console.log("Plan not found");
            process.exit(1);
        }

        // Set subscription (1 month from now)
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + 1);
        
        user.activeSubscription = planId;
        user.subscriptionExpiresAt = expiry;
        await user.save();
        console.log("Subscription updated for user");

        // Set KYC status to PENDING
        const kycUpdate = await Kyc.findOneAndUpdate(
            { userId: user._id, status: "AWAITING_PAYMENT" },
            { status: "PENDING" },
            { new: true }
        );

        if (kycUpdate) {
            console.log("KYC status moved to PENDING. Admin can now see it in the verification list.");
        } else {
            console.log("No KYC record found in AWAITING_PAYMENT status.");
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixUser();
