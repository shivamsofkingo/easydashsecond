const { Schema, model } = require("mongoose");

const chatMessageSchema = new Schema({
    senderId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiverId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    adsId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    readStatus: {
        type: Boolean,
        default: false
    },
    message: [{
        type: String,
    }],
    deletedFor: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }]
}, { timestamps: true });

module.exports = model("ChatMessage", chatMessageSchema);