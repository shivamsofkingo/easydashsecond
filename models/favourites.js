const { Schema, model } = require("mongoose");

const favouritesSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // adsPostId: { type: Schema.Types.ObjectId, ref: "AdsPost", required: true },
    adsId: { type: Schema.Types.ObjectId, required: true },
    adsType: { type: String, required: true},
},{timestamps: true});

module.exports = model("Favourite", favouritesSchema);