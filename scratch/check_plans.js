const mongoose = require('mongoose');
require('dotenv').config();

async function checkPlans() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const SubscriptionPlan = mongoose.connection.collection('subscriptionplans');
        const AccomodationPlan = mongoose.connection.collection('accomodationplans');

        const subPlans = await SubscriptionPlan.find({}).toArray();
        const accPlans = await AccomodationPlan.find({}).toArray();

        console.log('--- Subscription Plans (Profile Verification) ---');
        console.log(JSON.stringify(subPlans, null, 2));

        console.log('--- Accomodation Plans (Boost Post) ---');
        console.log(JSON.stringify(accPlans, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
}

checkPlans();
