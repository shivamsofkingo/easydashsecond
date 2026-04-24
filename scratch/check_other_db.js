const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const Accommodation = require('../models/accomodation');

async function checkDB() {
    try {
        const uri = "mongodb://localhost:27017/ezydash-backend";
        await mongoose.connect(uri);
        console.log('Connected to ezydash-backend MongoDB');

        const totalCount = await Accommodation.countDocuments({});
        console.log(`Total Accommodations in ezydash-backend: ${totalCount}`);

        const samples = await Accommodation.find({}).limit(5);
        console.log('DB Samples:');
        samples.forEach(s => {
            console.log(`- ID: ${s._id}, Title: ${s.title}, Region: ${s.region}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkDB();
