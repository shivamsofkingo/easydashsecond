const { Router } = require("express");
const { blockuser, getallBlockedUsers,unblockUser } = require("../controllers/blockuser.js");
const { ensureAuth } = require("../middlewares/tokenIdentity.js");


const blockRouter = Router();

blockRouter.post("/:userId", ensureAuth, blockuser);
blockRouter.get('/getallblockeduser', ensureAuth, getallBlockedUsers);
blockRouter.get('/unblockuser/:userId', ensureAuth, unblockUser);

module.exports = { blockRouter };


