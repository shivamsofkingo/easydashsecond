const { Schema, model } = require("mongoose");

const eventCommentSchema = new Schema({
    eventId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Event"
    },
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    parentComment: {
        type: Schema.Types.ObjectId,
        default: null
    },
    comment: {
        type: String,
        default: "NA",
    },
    totalLikes: {
        type: Number,
        default: 0,
    },
    totalComments: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = model("EventComment", eventCommentSchema);