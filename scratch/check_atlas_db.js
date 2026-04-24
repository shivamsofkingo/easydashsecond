const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const Accommodation = require('../models/accomodation');

async function checkDB() {
    try {
        const atlasURI = "mongodb+srv://developers:2vSUIKckMw9zoYCv@easydash.xw4qe.mongodb.net/?retryWrites=true&w=majority&appName=easydash";
        await mongoose.connect(atlasURI);
        console.log('Connected to Atlas MongoDB');

        const totalCount = await Accommodation.countDocuments({});
        console.log(`Total Accommodations in Atlas: ${totalCount}`);

        const samples = await Accommodation.find({}).limit(5);
        console.log('Atlas DB Samples:');
        samples.forEach(s => {
            console.log(`- ID: ${s._id}, Title: ${s.title}, Region: ${s.region}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkDB();
