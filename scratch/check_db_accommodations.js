const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const Accommodation = require('../models/accomodation');

async function checkDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const totalCount = await Accommodation.countDocuments({});
        console.log(`Total Accommodations in DB: ${totalCount}`);

        const samples = await Accommodation.find({}).limit(5);
        console.log('Direct DB Samples:');
        samples.forEach(s => {
            console.log(`- ID: ${s._id}, Title: ${s.title}, Region: ${s.region}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkDB();
