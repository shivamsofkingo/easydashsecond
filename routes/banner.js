const { Router } = require("express");
const { getAllBanners } = require("../admin/banner/banner.js");

const bannerRouter = Router();

bannerRouter.get("/getAllBanners", getAllBanners);

module.exports = {
    bannerRouter
}