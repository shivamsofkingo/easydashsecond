const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/users');
const Kyc = require('../models/kyc');
const SubscriptionPlan = require('../models/subscriptionPlan');

async function createTestData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const plan = await SubscriptionPlan.findOne({ price: 5 });
        if (!plan) {
            console.log("Plan not found");
            process.exit(1);
        }

        for (let i = 1; i <= 10; i++) {
            const email = `testuser${i}_${Date.now()}@example.com`;
            const user = await User.create({
                name: `Test User ${i}`,
                email: email,
                password: `password_${i}_${Date.now()}`, 
                isProfileCreated: true,
                isActive: true
            });

            await Kyc.create({
                userId: user._id,
                fullName: `Test User ${i} Full Name`,
                accountHandle: `@testuser${i}`,
                email: email,
                phoneNumber: `+91000000000${i}`,
                nationalIdType: "Passport",
                frontImage: "https://example.com/front.jpg",
                backImage: "https://example.com/back.jpg",
                status: "PENDING"
            });

            console.log(`Created user ${i}: ${email}`);
        }

        console.log("10 test KYC records created with status PENDING");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

createTestData();
