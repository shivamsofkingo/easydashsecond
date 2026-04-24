const mongoose = require("mongoose");
const Group = require("../models/group.js");
const User = require("../models/users.js");
const PendingRequest = require("../models/pendingGroupReq.js");
const Community = require("../models/community.js");
const { updateGroupImage, getAllGroup } = require("../utils/ads/ads.js");
const {
  createGroupUploadUrl,
  deleteGroupImages,
} = require("../utils/fileUpload/file.js");
const { uploadGroupImages } = require("../utils/group/handleImage.js");
const constants = require("../constants/constants.js");
const { logger } = require("../config/loggerConfig.js");

const createGroup = async (req, res) => {
  const session = await Group.startSession();
  session.startTransaction();
  const {
    groupName,
    groupDescription,
    communityCategory,
    groupCategory,
    isPrivate,
    fileNames,
    contentTypes,
    name,
    email,
    phoneNumber,
    communityId,
  } = req.body;
  const myUserId = req.user._id;
  try {
    if (
      !groupName ||
      !groupDescription ||
      !communityCategory ||
      !groupCategory ||
      !name ||
      !communityId
    ) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const user = await User.findById(myUserId).session(session);
    if (!user || user.profileType === "NONE") {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "user not found or incomplete profile",
        payload: {},
      });
    }
    if (!email && !phoneNumber) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "email or phone required",
        payload: {},
      });
    }
    let isSignInWithoutEmail = false;
    if (email) {
      if (user.email !== email) {
        if (user.email === null && phoneNumber) {
          isSignInWithoutEmail = true;
        } else {
          await session.abortTransaction();
          return res.status(constants.httpStatus.badRequest).json({
            status: 0,
            msg: "Email must be same as verified one",
            payload: {},
          });
        }
      }
    }
    if (phoneNumber && user.phoneNumber !== phoneNumber) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Phone number must be verified",
        payload: {},
      });
    }
    if(!user.role.includes("admin")) {
      if (user.totalGroupCreated > 2) {
        await session.abortTransaction();
        return res.status(constants.httpStatus.badRequest).json({
          status: 0,
          msg: "group creation limit exceeded!",
          payload: {},
        });
      }
    }
    const community = await Community.findById(communityId).session(session);
    if (!community) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "community not found",
        payload: {},
      });
    }
    const newGroup = await Group.create(
      [
        {
          groupName,
          groupDescription,
          communityCategory,
          groupCategory,
          isPrivate: isPrivate ? true : false,
          name,
          email: isSignInWithoutEmail ? null : email,
          phoneNumber: isSignInWithoutEmail ? phoneNumber : null,
          adminId: myUserId,
          communityId,
          members: [req.user._id],
          totalMembers: 1,
        },
      ],
      { session }
    );
    if (!newGroup) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Failed to create group",
        payload: {},
      });
    }

    user.totalGroupCreated += 1;
    user.role.includes("groupAdmin");
    newGroup[0].roomId = newGroup[0]._id;
    newGroup[0].isJoined = true;
    community.totalGroups += 1;
    community.groups.push(newGroup[0]._id);
    await newGroup[0].save({ session });
    await user.save({ session });
    await community.save({ session });
    let groupImages = [];
    if (fileNames && contentTypes) {
      if (fileNames.length !== contentTypes.length) {
        await session.abortTransaction();
        return res.status(constants.httpStatus.badRequest).json({
          status: 0,
          msg: "File names and content types must match in length",
          payload: {},
        });
      }
      const param = { groupId: newGroup[0]._id, fileNames, contentTypes };
      const imgUrls = await uploadGroupImages(param);
      for (const { fileName, uploadUrl, contentType } of imgUrls) {
        groupImages.push({ fileName, uploadUrl, contentType });
      }
    }
    await session.commitTransaction();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        newGroup,
        uploadUrls: groupImages,
      },
    });
  } catch (error) {
    logger.error(`error in createGroup: ${error.message}`, { error });
    await session.abortTransaction();
    return res.status(constants.httpStatus.badRequest).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  } finally {
    session.endSession();
  }
};

const saveGroupImages = async (req, res) => {
  const session = await Group.startSession();
  session.startTransaction();
  const { userId, groupId, fileNames } = req.body;
  const myUserId = req.user._id;
  try {
    if (!userId || !groupId || !fileNames) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    if (myUserId.toString() !== userId.toString()) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const group = await Group.findById(groupId).session(session);
    if (!group) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "group not found",
        payload: {},
      });
    }
    // const isAuthorizedAdmin = group.adminId.toString() === myUserId || group.additionalAdmins.some((adminId) => adminId.toString() === myUserId);
    const isAuthorizedAdmin = group.adminId.toString() === myUserId.toString();
    if (!isAuthorizedAdmin) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.conflict).json({
        status: 0,
        msg: "Action not allowed",
        payload: {},
      });
    }
    const updatedImages = [];
    for (const singleFileName of fileNames) {
      const updateData = await updateGroupImage({
        groupId,
        fileNames: singleFileName,
        session,
      });
      updatedImages.push(...updateData);
    }
    await session.commitTransaction();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {},
    });
  } catch (error) {
    logger.error(`error in saveGroupImages: ${error.message}`, { error });
    await session.abortTransaction();
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      paylaod: {},
    });
  } finally {
    session.endSession();
  }
};

const editGroupImages = async (req, res) => {
  const session = await Group.startSession();
  session.startTransaction();
  const { groupId, fileNames, contentTypes } = req.body;
  const myUserId = req.user._id;
  try {
    if (!groupId || !fileNames || !contentTypes) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const group = await Group.findById(groupId).session(session);
    if (!group) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "group not found",
        payload: {},
      });
    }
    const isAuthorizedAdmin = group.adminId.toString() === myUserId.toString();
    if (!isAuthorizedAdmin) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.conflict).json({
        status: 0,
        msg: "action not allowed",
        payload: {},
      });
    }
    if (fileNames.length !== contentTypes.length) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "fileNames and content types must match in length",
        payload: {},
      });
    }
    const uploadUrls = [];
    for (let i = 0; i < fileNames.length; i++) {
      const fileName = fileNames[i];
      const contentType = contentTypes[i];
      const uploadUrl = await createGroupUploadUrl(
        fileName,
        contentType,
        groupId
      );
      const param = {
        groupId,
        fileNames: fileName,
        session,
      };
      await updateGroupImage(param);
      uploadUrls.push({
        fileName,
        uploadUrl,
      });
    }
    await session.commitTransaction();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: uploadUrls,
    });
  } catch (error) {
    logger.error(`error in editGroupImages: ${error.message}`, { error });
    await session.abortTransaction();
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      paylaod: {},
    });
  } finally {
    session.endSession();
  }
};

const deleteGroupImage = async (req, res) => {
  const { userId, groupId, fileNames, contentTypes } = req.body;
  const myUserId = req.user._id;
  try {
    if (!userId || !groupId || !fileNames || !contentTypes) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Missing required* fields",
        payload: {},
      });
    }
    if (myUserId.toString() !== userId.toString()) {
      return res.status(constants.httpStatus.conflict).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "group not found",
        payload: {},
      });
    }
    const isAuthorizedAdmin = group.adminId.toString() === myUserId.toString();
    if (!isAuthorizedAdmin) {
      return res.status(constants.httpStatus.conflict).json({
        status: 0,
        msg: "Action not allowed",
        payload: {},
      });
    }
    const groupCreator = await User.findOne({ email: group.email });
    if (!groupCreator) {
      return res.status(constants.httpStatus.conflict).json({
        status: 0,
        msg: "cannot reach bucket",
        payload: {},
      });
    }
    group.groupImage = "NA";
    await group.save();
    await deleteGroupImages(fileNames, groupCreator._id);
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {},
    });
  } catch (error) {
    logger.error(`error in deleteGroupImage: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      paylaod: {},
    });
  }
};

const getAllGroupList = async (req, res) => {
  const { communityId, pages } = req.query;
  const myUserId = req.user._id;
  try {
    if (!communityId) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const param = {
      perPage: constants.perPage.pageLimit16,
      page: parseInt(pages, 10) || 1,
      communityId,
      myUserId,
    };
    if (param.page < 1) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Invalid page number",
        payload: {},
      });
    }
    const data = await getAllGroup(param);
    if (data === false) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "internal server error",
        payload: {},
      });
    }
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        groups: data.groups,
        meta: {
          currentPage: param.page,
          totalGroups: data.totalGroups,
          totalPages: data.totalPages,
        },
      },
    });
  } catch (error) {
    logger.error(`error in getAllGroupList: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      paylaod: {},
    });
  }
};

const getJoinedGroupList = async (req, res) => {
  const {
    communityId,
    pages = 1,
    limit = constants.perPage.pageLimit16,
  } = req.query;
  const myUserId = req.user._id;
  const currentPage = parseInt(pages, 10);
  try {
    if (!communityId) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const totalGroups = await Group.countDocuments({
      communityId,
      members: myUserId,
      isDeleted: false,
    });
    const totalPages = Math.ceil(totalGroups / limit);
    const predefinedGroups = await Group.find({
      communityId,
      members: myUserId,
      isCreatedByAdmin: true,
      isDeleted: false,
    })
      .select(
        "_id groupName name groupDescription groupImage adminId totalMembers communityCategory groupCategory isPrivate createdAt"
      )
      .skip((currentPage - 1) * limit)
      .limit(limit)
      .lean();

    const groups = await Group.find({
      communityId,
      members: myUserId,
      isCreatedByAdmin: false,
      isDeleted: false,
    })
      .select(
        "_id groupName name groupDescription groupImage adminId totalMembers communityCategory groupCategory isPrivate createdAt"
      )
      .skip((currentPage - 1) * limit)
      .limit(limit)
      .lean();

    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "Groups fetched successfully",
      payload: {
        groups: [...predefinedGroups, ...groups],
        meta: {
          totalGroups,
          currentPage,
          groupsPerPage: limit,
          totalPages,
        },
      },
    });
  } catch (error) {
    logger.error(`Error in getJoinedGroupList: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

const editGroupPost = async (req, res) => {
  const session = await Group.startSession();
  session.startTransaction();
  const {
    groupId,
    groupName,
    groupDescription,
    category,
    // isPrivate,
    // fileNames,
    // contentTypes,
    name,
    email,
    phoneNumber,
  } = req.body;
  const myUserId = req.user._id;
  try {
    if (!groupId) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const group = await Group.findOne({
      _id: groupId,
      adminId: myUserId,
    }).session(session);
    if (!group) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "group not found",
        payload: {},
      });
    }
    const user = await User.findById(myUserId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "User not found",
        payload: {},
      });
    }
    // const isAuthorizedAdmin = group.adminId.toString() === userId.toString() || group.additionalAdmins.some((adminId) => adminId.toString() === userId.toString());
    const isAuthorizedAdmin = group.adminId.toString() === myUserId.toString();
    if (!isAuthorizedAdmin) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.conflict).json({
        status: 0,
        msg: "Action not allowed",
        payload: {},
      });
    }
    let isSignInWithoutEmail = false;
    if (email && user.email !== email) {
      if (user.email === null && phoneNumber) {
        isSignInWithoutEmail = true;
      } else {
        await session.abortTransaction();
        return res.status(constants.httpStatus.badRequest).json({
          status: 0,
          msg: "Email must be same as verified one",
          payload: {},
        });
      }
    }
    if (phoneNumber && user.phoneNumber !== phoneNumber) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Phone number must be verified",
        payload: {},
      });
    }
    group.groupName = groupName ? groupName : group.groupName;
    group.groupDescription = groupDescription
      ? groupDescription
      : group.groupDescription;
    group.category = category ? category : group.category;
    // group.isPrivate = isPrivate ? isPrivate : group.isPrivate;
    group.name = name ? name : group.name;
    group.email = isSignInWithoutEmail ? null : email;
    group.phoneNumber = isSignInWithoutEmail ? phoneNumber : null;

    // let updatedImages = [];
    // if (fileNames && contentTypes) {
    //   if (fileNames.length !== contentTypes.length) {
    //     await session.abortTransaction();
    //     session.endSession();
    //     return res.status(constants.httpStatus.badRequest).json({
    //       status: 0,
    //       msg: "File names and content types must match in length",
    //       payload: {},
    //     });
    //   }

    //   const param = { userId, fileNames, contentTypes };
    //   const imgUrls = await uploadGroupImages(param);
    //   for (const { fileName, uploadUrl, contentType } of imgUrls) {
    //     updatedImages.push({ fileName, uploadUrl, contentType });
    //   }
    //   group.groupImage = updatedImages;
    // }

    await group.save({ session });
    await session.commitTransaction();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        udatedGroup: group,
      },
    });
  } catch (error) {
    logger.error(`Error in editGroupPost: ${error.message}`, { error });
    await session.abortTransaction();
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  } finally {
    session.endSession();
  }
};

const deleteGroup = async (req, res) => {
  const session = await Group.startSession();
  session.startTransaction();
  const { groupId } = req.body;
  const myUserId = req.user._id;
  try {
    if (!groupId) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const group = await Group.findById(groupId).session(session);
    if (!group) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "group not found",
        payload: {},
      });
    }
    const community = await Community.findById(group.communityId).session(session);
    if(!community) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "community not found",
        payload: {},
      });
    }
    const isAuthorizedAdmin = group.adminId.toString() === myUserId.toString();
    if (!isAuthorizedAdmin) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.conflict).json({
        status: 0,
        msg: "action not allowed",
        payload: {},
      });
    }
    const user = await User.findById(myUserId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "user not found",
        payload: {},
      });
    }
    user.totalGroupCreated = user.totalGroupCreated - 1;
    group.isDeleted = true;
    community.totalGroups -= 1;
    await user.save({ session });
    await group.save({ session });
    await community.save({ session });
    await session.commitTransaction();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {},
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error(`error in deleteGroup: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  } finally {
    session.endSession();
  }
};

const joinGroup = async (req, res) => {
  const { groupId } = req.body;
  const myUserId = req.user._id;
  const profileType = req.user.profileType;
  try {
    if (!groupId) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    // later work
    // if(profileType !== "Student") {
    //   return res.status(constants.httpStatus.conflict).json({
    //     status: 0,
    //     msg: "invalid profile type",
    //     payload: {},
    //   });
    // }
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "group not found",
        payload: {},
      });
    }
    if (group.members.includes(myUserId)) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "user already a member of the group",
        payload: {},
      });
    }
    if (group.isPrivate === false) {
      group.members.push(myUserId);
      group.totalMembers += 1;
      await group.save();
      res.status(constants.httpStatus.ok).json({
        status: 1,
        msg: "success",
        payload: {
          user: myUserId,
          groupJoined: groupId,
        },
      });
    } else if (group.isPrivate === true) {
      const pendingRequest = await PendingRequest({
        userId: myUserId,
        groupId,
        status: "PENDING",
      });
      if (pendingRequest) {
        return res.status(constants.httpStatus.ok).json({
          status: 1,
          msg: "request already sent",
          payload: {},
        });
      }
      const request = new PendingRequest({ userId: myUserId, groupId });
      await request.save();
      return res.status(constants.httpStatus.ok).json({
        status: 1,
        msg: "Request sent to group admin.",
        payload: {},
      });
    } else {
      res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "invalid request",
        payload: {},
      });
    }
  } catch (error) {
    logger.error(`error in joinGroup: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const leaveGroup = async (req, res) => {
  const session = await Group.startSession();
  session.startTransaction();
  const { groupId } = req.body;
  const myUserId = req.user._id;
  try {
    if (!groupId) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Missing required* fields",
        payload: {},
      });
    }
    const group = await Group.findById(groupId)
      .populate("members", "_id name")
      .session(session);
    if (!group) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "Group not found",
        payload: {},
      });
    }
    const user = await User.findById(myUserId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "User not found",
        payload: {},
      });
    }
    if (
      !group.members.some(
        (member) => member._id.toString() === myUserId.toString()
      )
    ) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "User is not a member of this group",
        payload: {},
      });
    }
    if (group.adminId.toString() === myUserId.toString()) {
      const otherMembers = group.members.filter(
        (member) => member._id.toString() !== myUserId.toString()
      );
      if (otherMembers.length === 0) {
        await session.abortTransaction();
        return res.status(constants.httpStatus.badRequest).json({
          status: 0,
          msg: "No other members in the group to transfer admin rights",
          payload: {},
        });
      }
      const newAdmin =
        otherMembers[Math.floor(Math.random() * otherMembers.length)];
      group.adminId = newAdmin._id;
      user.totalGroupCreated -= 1;
      if (user.totalGroupCreated <= 0) {
        user.role = user.role.filter((r) => r !== "groupAdmin");
      }
      await user.save({ session });
    }
    group.members = group.members.filter(
      (member) => member._id.toString() !== myUserId.toString()
    );
    group.totalMembers -= 1;
    await group.save({ session });
    await session.commitTransaction();
    return res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        groupId,
        adminId: group.adminId.toString(),
      },
    });
  } catch (error) {
    logger.error(`Error in leaveGroup: ${error.message}`, { error });
    await session.abortTransaction();
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  } finally {
    session.endSession();
  }
};

const removeGroupMember = async (req, res) => {
  const { userId, groupId } = req.body;
  const myUserId = req.user._id;
  try {
    if (!userId || !groupId) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "group not found",
        payload: {},
      });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "user not found",
        payload: {},
      });
    }
    if (
      group.adminId.toString() !== myUserId.toString() ||
      group.adminId.toString() === userId.toString()
    ) {
      return res.status(constants.httpStatus.conflict).json({
        status: 0,
        msg: "action not allowed",
        payload: {},
      });
    }
    const isMember = group.members.some(
      (member) => member.toString() === userId
    );
    if (!isMember) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "User is not a member of the group",
        payload: {},
      });
    }
    group.members = group.members.filter(
      (member) => member.toString() !== userId
    );
    group.totalMembers = Math.max(0, group.totalMembers - 1);
    await group.save();
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        removedMember: userId,
      },
    });
  } catch (error) {
    logger.error(`error in remove user from group: ${error.message}`, {
      error,
    });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getAllMembers = async (req, res) => {
  const {
    groupId,
    page = 1,
    limit = constants.perPage.pageLimit16,
  } = req.query;
  const myUserId = req.user._id;
  try {
    if (!groupId) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required fields",
        payload: {},
      });
    }
    const group = await Group.findById(groupId).populate({
      path: "adminId",
      select: "_id name profileImage",
    });
    if (!group) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "group not found",
        payload: {},
      });
    }
    const isMemberOrAdmin =
      group.members.includes(myUserId) ||
      group.adminId._id.toString() === myUserId.toString();
    if (!isMemberOrAdmin) {
      return res.status(constants.httpStatus.conflict).json({
        status: 0,
        msg: "access denied",
        payload: {},
      });
    }
    const skip = (page - 1) * limit;
    const members = await Group.findById(groupId)
      .select("members")
      .populate({
        path: "members",
        select: "_id name profileImage",
        options: { sort: { name: 1 } },
      });

    if (!members || members.members.length === 0) {
      return res.status(constants.httpStatus.ok).json({
        status: 1,
        msg: "no members found",
        payload: { members: [], total: 0 },
      });
    }
    const admin = {
      _id: group.adminId._id,
      name: group.adminId.name,
      profileImage: group.adminId.profileImage,
      isAdmin: true,
    };
    const nonAdminMembers = members.members.filter(
      (member) => member._id.toString() !== group.adminId._id.toString()
    );
    const paginatedMembers = nonAdminMembers.slice(skip, skip + limit);
    const totalMembers = group.members.length;
    return res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        members: [admin, ...paginatedMembers],
        meta: {
          totalMembers,
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalMembers / limit),
        },
      },
    });
  } catch (error) {
    logger.error(`Error in getAllMembers: ${error.message}`, { error });
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getPendingRequests = async (req, res) => {
  const { groupId, pages = 1 } = req.query;
  const limit = constants.perPage.pageLimit16;
  const page = parseInt(pages, 10) || 1;
  const myUserId = req.user._id;
  try {
    if (!groupId) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Missing required fields",
        payload: {},
      });
    }
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "Group not found",
        payload: {},
      });
    }
    const isAuthorizedAdmin = group.adminId.toString() === myUserId.toString();
    if (!isAuthorizedAdmin) {
      return res.status(constants.httpStatus.conflict).json({
        status: 0,
        msg: "Action not allowed",
        payload: {},
      });
    }
    const totalCount = await PendingRequest.countDocuments({
      groupId,
      status: "PENDING",
    });
    const totalPages = Math.ceil(totalCount / limit);
    if (page > totalPages) {
      return res.status(constants.httpStatus.ok).json({
        status: 0,
        msg: "success",
        payload: {
          pendingRequests: [],
          meta: {
            currentPage: page,
            totalCount,
            totalPages,
          },
        },
      });
    }
    const skip = (page - 1) * limit;
    const pendingRequests = await PendingRequest.find({
      groupId,
      status: "PENDING",
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name profileImage")
      .exec();
    if (!pendingRequests || pendingRequests.length == 0) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "no pending request found",
        payload: {},
      });
    }
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "Success",
      payload: {
        pendingRequests,
        meta: {
          currentPage: page,
          totalCount,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.log("Error in getPendingRequests:", error.message);
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

const approveGroupJoiningRequests = async (req, res) => {
  const { groupId, requestedId } = req.body;
  const myUserId = req.user._id;
  try {
    if (!groupId || !requestedId) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Missing required fields or invalid format",
        payload: {},
      });
    }
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        status: 0,
        msg: "Group not found",
        payload: {},
      });
    }
    const isAuthorizedAdmin = group.adminId.toString() === myUserId.toString();
    if (!isAuthorizedAdmin) {
      return res.status(constants.httpStatus.conflict).json({
        status: 0,
        msg: "Action not allowed",
        payload: {},
      });
    }
    const pendingRequest = await PendingRequest.findOne({
      userId: requestedId,
      status: "PENDING",
    });

    if (!pendingRequest) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Request does not exist or has already been approved/rejected",
        payload: {},
      });
    }
    group.members.push(new mongoose.Types.ObjectId(requestedId));
    group.totalMembers += 1;
    pendingRequest.status = "APPROVED";
    await group.save();
    await pendingRequest.save();

    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "User successfully approved",
      payload: { approvedUserId: requestedId },
    });
  } catch (error) {
    console.error("Error in approveGroupJoiningRequests:", error.message);
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

const rejectGroupJoiningRequests = async (req, res) => {
  const { groupId, requestedId } = req.body;
  const myUserId = req.user._id;
  try {
    if (!groupId || !requestedId) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Missing required fields or invalid format",
        payload: {},
      });
    }
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        status: 0,
        msg: "Group not found",
        payload: {},
      });
    }
    const isAuthorizedAdmin = group.adminId.toString() === myUserId.toString();
    if (!isAuthorizedAdmin) {
      return res.status(constants.httpStatus.conflict).json({
        status: 0,
        msg: "Action not allowed",
        payload: {},
      });
    }
    const pendingRequest = await PendingRequest.findOne({
      userId: requestedId,
      status: "PENDING",
    });

    if (!pendingRequest) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Request does not exist or has already been approved or rejected",
        payload: {},
      });
    }
    pendingRequest.status = "REJECTED";
    await pendingRequest.save();

    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "request rejected",
      payload: { rejectedUserId: requestedId },
    });
  } catch (error) {
    console.error("Error in approveGroupJoiningRequests:", error.message);
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

module.exports = {
  createGroup,
  saveGroupImages,
  editGroupImages,
  editGroupPost,
  deleteGroupImage,
  getAllGroupList,
  getJoinedGroupList,
  deleteGroup,
  joinGroup,
  leaveGroup,
  removeGroupMember,
  getAllMembers,
  approveGroupJoiningRequests,
  rejectGroupJoiningRequests,
  getPendingRequests,
};
