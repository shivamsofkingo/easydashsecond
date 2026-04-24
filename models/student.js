const { Schema, model} = require('mongoose');

const studentSchema = new Schema({

    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    schoolCommencement: { type: Date, default: null },
    completionYear: { type: Date, default: null },
    institution: { type: String, default: null },
    dateOfBirth: { type: Date, default: null },
    gender: { type: String, default: null },
}, { timestamps: true }); 

module.exports = model('Student', studentSchema);