const { Router } = require("express");
const { ensureAuth } = require("../middlewares/tokenIdentity.js");
const { 
    reportUser,
    reportAd,
    reportProblem,
    saveReportProblemImages
} = require("../controllers/report.js");

const reportRouter = Router();

reportRouter.post("/reportUser", ensureAuth, reportUser);
reportRouter.post("/reportAd", ensureAuth, reportAd);
reportRouter.post("/reportProblem", ensureAuth, reportProblem);
reportRouter.post("/saveReportImages", ensureAuth, saveReportProblemImages);

module.exports = reportRouter;
