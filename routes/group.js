const { Router } = require("express");
const { ensureAuth } = require("../middlewares/tokenIdentity.js");
const {
  createGroup,
  saveGroupImages,
  editGroupImages,
  editGroupPost,
  joinGroup,
  leaveGroup,
  removeGroupMember,
  getAllMembers,
  approveGroupJoiningRequests,
  getAllGroupList,
  deleteGroupImage,
  getPendingRequests,
  rejectGroupJoiningRequests,
  getJoinedGroupList,
  deleteGroup,
} = require("../controllers/group.js");

const groupRouter = Router();

groupRouter.post("/createGroup", ensureAuth, createGroup);
groupRouter.post("/saveImage", ensureAuth, saveGroupImages);
groupRouter.post("/editGroupImage", ensureAuth, editGroupImages);
groupRouter.post("/editGroup", ensureAuth, editGroupPost);
groupRouter.post("/joinGroup", ensureAuth, joinGroup);
groupRouter.post("/leaveGroup", ensureAuth, leaveGroup);
groupRouter.post("/removeGroupMember", ensureAuth, removeGroupMember);
groupRouter.post("/approvePendingRequests", ensureAuth, approveGroupJoiningRequests);
groupRouter.post("/rejectPendingRequests", ensureAuth, rejectGroupJoiningRequests);
groupRouter.post("/deleteGroup", ensureAuth, deleteGroup);
groupRouter.post("/deleteGroupImage", ensureAuth, deleteGroupImage);
groupRouter.get("/getAllMembers", ensureAuth, getAllMembers);
groupRouter.get("/getAllGroups", ensureAuth, getAllGroupList);
groupRouter.get("/getJoinedGroupList", ensureAuth, getJoinedGroupList);
groupRouter.get("/getPendingRequests", ensureAuth, getPendingRequests);

module.exports = groupRouter;