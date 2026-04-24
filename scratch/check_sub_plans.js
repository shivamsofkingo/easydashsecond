const mongoose = require('mongoose');
require('dotenv').config();

async function checkSubPlans() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const SubscriptionPlan = mongoose.connection.collection('subscriptionplans');
        const plans = await SubscriptionPlan.find({}).toArray();
        console.log('Subscription Plans:', JSON.stringify(plans, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
}
checkSubPlans();
