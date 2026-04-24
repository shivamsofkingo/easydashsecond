const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const Marketplace = require('../models/marketplace');

async function checkMarketplace() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to Local MongoDB');

        const samples = await Marketplace.find({}).limit(10);
        console.log('Marketplace DB Samples:');
        samples.forEach(s => {
            console.log(`- ID: ${s._id}, Title: ${s.title}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkMarketplace();
