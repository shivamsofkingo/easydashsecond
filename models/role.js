const { Schema, model } = require("mongoose");

const roleSchema = new Schema({
    roleType: { 
        type: String,
        enum: [
            "superAdmin",
            "admin",
            "groupAdmin",
            "user"
        ],
    }
});

module.exports = model("Role", roleSchema);