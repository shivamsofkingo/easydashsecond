const { Schema, model } = require("mongoose");

const groupMessageSchema = new Schema({
    senderId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    groupId: {
        type: Schema.Types.ObjectId,
        ref: "Group",
        required: true,
        index: true
    },
    message: {
        type: String,
        required: true
    },
    deletedFor: [{
        type: Schema.Types.ObjectId,
        ref: "User"
    }]
}, { timestamps: true });

groupMessageSchema.index({ groupId: 1, createdAt: -1 });

module.exports = model("GroupMessage", groupMessageSchema);