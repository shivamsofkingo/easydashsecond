const mongoose = require('mongoose');
require('dotenv').config();

async function cleanupBoostPlans() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const BoostPlan = mongoose.connection.collection('boostplans');
        
        // Remove 'features' field from all documents
        const result = await BoostPlan.updateMany({}, { $unset: { features: "" } });
        console.log(`Updated ${result.modifiedCount} documents. Removed 'features' field.`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
}

cleanupBoostPlans();
