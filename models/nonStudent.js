const { Schema, model } = require('mongoose');

const nonStudentSchema = new Schema({

    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    nonStudentProfileType: { type: String, enum: ['Vendor', 'Event Manager', 'Property Manager']},
    shopName: { type: String, default: null },
    shopLocation: { type: String, default: null },
    businessDescription: { type: String, default: null },
    businessLocation: { type: String, default: null },
    dateOfBirth: { type: Date, default: null },
    gender: { type: String, default: null },    
}, { timestamps: true }); 

module.exports = model('NonStudent', nonStudentSchema);