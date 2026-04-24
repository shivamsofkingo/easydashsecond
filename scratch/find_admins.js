const mongoose = require('mongoose');
require('dotenv').config();
const Admin = require('../models/admin');

async function findAdmins() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const admins = await Admin.find({}).select('email');
        console.log('Admin Users:', JSON.stringify(admins, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findAdmins();
