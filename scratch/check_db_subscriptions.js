const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const UserSubscription = require('../models/userSubscription');

async function findSubscriptions() {
    const localURI = "mongodb://localhost:27017/my-easy-dash";
    const atlasURI = "mongodb+srv://developers:2vSUIKckMw9zoYCv@easydash.xw4qe.mongodb.net/?retryWrites=true&w=majority&appName=easydash";

    console.log('--- Checking Local Database ---');
    try {
        await mongoose.connect(localURI);
        const count = await UserSubscription.countDocuments({});
        console.log(`Subscriptions in Local: ${count}`);
        await mongoose.disconnect();
    } catch (err) {
        console.log(`Local DB Error: ${err.message}`);
    }
    
    console.log('\n--- Checking Atlas Database ---');
    try {
        await mongoose.connect(atlasURI);
        const count = await UserSubscription.countDocuments({});
        console.log(`Subscriptions in Atlas: ${count}`);
        if (count > 0) {
            const sample = await UserSubscription.findOne({});
            console.log(`Sample Subscription Found: PlanID ${sample.planId}, Status: ${sample.status}`);
        }
        await mongoose.disconnect();
    } catch (err) {
        console.log(`Atlas DB Error: ${err.message}`);
    }
}

findSubscriptions();
