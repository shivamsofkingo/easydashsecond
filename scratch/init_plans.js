const mongoose = require('mongoose');
require('dotenv').config();
const SubscriptionPlan = require('./models/subscriptionPlan');
const Admin = require('./models/admin');

async function init() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const admin = await Admin.findOne();
        if (!admin) {
            console.log('No admin found, cannot initialize plans');
            return;
        }

        const defaultPlans = [
            { planName: 'Monthly', price: 20, features: ["Verified badge", "Increased account protection", "Enhanced support", "Upgraded profile links"] },
            { planName: 'Annually', price: 200, features: ["Verified badge", "Increased account protection", "Enhanced support", "Upgraded profile links"] }
        ];

        for (const plan of defaultPlans) {
            await SubscriptionPlan.findOneAndUpdate(
                { planName: plan.planName },
                { $setOnInsert: { ...plan, adminId: admin._id } },
                { upsert: true }
            );
        }
        console.log('Plans initialized');
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
}
init();
