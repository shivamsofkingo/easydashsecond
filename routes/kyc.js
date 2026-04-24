const { Router } = require("express");
const { ensureAuth } = require("../middlewares/tokenIdentity.js");
const { submitKyc, getKycStatus } = require("../controllers/kycController.js");

const kycRouter = Router();

kycRouter.post("/submit", ensureAuth, submitKyc);
kycRouter.get("/status", ensureAuth, getKycStatus);

module.exports = kycRouter;
