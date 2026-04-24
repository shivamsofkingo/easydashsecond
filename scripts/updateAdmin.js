const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Load Admin Model
// Note: We're assuming the path is relative to the root where this script is run
const Admin = require('../models/admin.js');

const updateAdmin = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected successfully!');

        const newEmail = 'noreply@softkingo.com';
        const newPassword = 'No@soft@123';
        const saltRounds = 12;

        console.log(`Hashing new password...`);
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        console.log(`Searching for admins to update...`);
        const result = await Admin.updateMany(
            {}, // Update all admins
            { 
                $set: { 
                    email: newEmail, 
                    password: hashedPassword,
                    isActive: true // Ensure they are active
                } 
            }
        );

        console.log(`Update Result:`, result);

        if (result.matchedCount === 0) {
            console.log('No admin records found. Creating a default superAdmin...');
            await Admin.create({
                name: 'Super Admin',
                email: newEmail,
                password: hashedPassword,
                role: 'superAdmin',
                isActive: true
            });
            console.log('Default superAdmin created successfully!');
        } else {
            console.log(`Successfully updated ${result.modifiedCount} admin record(s).`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error updating admin:', error);
        process.exit(1);
    }
};

updateAdmin();
