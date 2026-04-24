const { Router } = require("express");
const { 
    sendMessage, 
    getMessages, 
    getMessageList, 
    sendImage, 
    sendGroupMessages,
    getAllGroupMessages,
    getUnreadNotificationCount,
    // deleteChat,
    // deleteGroupMessage,
} = require("../controllers/message.js");
const { ensureAuth } = require("../middlewares/tokenIdentity.js");

const messageRouter = Router();

messageRouter.post("/sendMessage", ensureAuth, sendMessage);
messageRouter.post("/sendImage", ensureAuth, sendImage);
messageRouter.post("/sendGroupMessage", ensureAuth, sendGroupMessages);
messageRouter.get("/getUnreadMessageCount", ensureAuth, getUnreadNotificationCount);
// messageRouter.post("/deleteChat", ensureAuth, deleteChat);
// messageRouter.post("/deleteGroupChat", ensureAuth, deleteGroupMessage);
messageRouter.get("/getMessages", ensureAuth, getMessages);
messageRouter.get("/getMessageList", ensureAuth, getMessageList);
messageRouter.get("/getGroupMessages", ensureAuth, getAllGroupMessages);

module.exports = messageRouter;