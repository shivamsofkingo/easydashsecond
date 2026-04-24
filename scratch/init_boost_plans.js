const mongoose = require('mongoose');
require('dotenv').config();
const BoostPlan = require('./models/boostPlan');
const Admin = require('./models/admin');

async function initBoost() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const admin = await Admin.findOne();
        if (!admin) {
            console.log('No admin found');
            return;
        }

        const defaultPlans = [
            { duration: 3, price: 20, adminId: admin._id },
            { duration: 7, price: 40, adminId: admin._id },
            { duration: 14, price: 60, adminId: admin._id }
        ];

        for (const plan of defaultPlans) {
            await BoostPlan.findOneAndUpdate(
                { duration: plan.duration },
                { $setOnInsert: plan },
                { upsert: true }
            );
        }
        console.log('Boost plans initialized');
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
}
initBoost();
