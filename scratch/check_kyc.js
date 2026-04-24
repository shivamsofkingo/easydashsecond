const mongoose = require('mongoose');
require('dotenv').config();
const Kyc = require('../models/kyc');

async function checkKyc() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const userId = "69e9a839f4e203420d9608af";
        const kyc = await Kyc.find({ userId });
        console.log('KYC Records for user:', JSON.stringify(kyc, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkKyc();
