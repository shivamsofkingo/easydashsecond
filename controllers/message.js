const mongoose = require("mongoose");
const Conversation = require("../models/conversation.js");
const Message = require("../models/chatMessage.js");
const Giveaway = require("../models/giveaways.js");
const Marketplace = require("../models/marketplace.js");
const Accommodation = require("../models/accomodation.js");
const Event = require("../models/event.js");
const AdsPost = require("../models/adsPost.js");
const Group = require("../models/group.js");
const GroupMessage = require("../models/groupMessage.js");
const User = require("../models/users.js");
const { putObject } = require("../utils/chat/putObject.js");
const { MetadataDirective } = require("@aws-sdk/client-s3");
const constants = require("../constants/constants.js");
const { io, userSocketMap, usersOnChatListPage, getReceiverSocketId } = require("../socket/socket.js");
const { encryptMessage, decryptMessage } = require("../utils/chat/chat.js");
const { logger } = require("../config/loggerConfig.js");

const sendMessage = async (req, res) => {
  const { receiverId, adsId, message } = req.body;
  const myUserId = req.user._id;
  try {
    if (!myUserId) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "Unauthorized request",
        payload: {},
      });
    }
    const senderId = myUserId;
    const participants = [senderId.toString(), receiverId.toString()].sort();
    const roomId = `${adsId}_${participants[0]}_${participants[1]}`;
    let currentConversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
      adsId,
    });
    if (!currentConversation) {
      currentConversation = await Conversation.create({
        participants: [senderId, receiverId],
        adsId,
        roomId,
      });
    }
    // const encryptedMessage = encryptMessage(message);
    // console.log("encrypt msg =====> ", encryptedMessage);
    const newMessage = await Message.create({
      senderId,
      receiverId,
      adsId,
      message,
      readStatus: false,
    });
    if (!newMessage) {
      return res.status(constants.httpStatus.serverError).json({
        status: 0,
        msg: "internal server error",
        payload: {},
      });
    }
    currentConversation.messages.push(newMessage._id);
    currentConversation.lastMessage = newMessage._id;
    currentConversation.updatedAt = new Date();
    await currentConversation.save();
    io.to(roomId).emit("newMessage", newMessage);
    // console.log("usersOnChatListPage in send message api ====> ", usersOnChatListPage);
    if (usersOnChatListPage.includes(receiverId.toString())) {
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessageOnChatList", newMessage);
      }
    }
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        newMessage,
      },
    });
  } catch (error) {
    logger.error(`Error in sendMessage: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

const sendImage = async (req, res) => {
  const { receiverId, adsId, fileName } = req.body;
  const { file } = req.files;
  const myUserId = req.user._id;
  try {
    if (!myUserId) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const senderId = myUserId;
    const participants = [senderId.toString(), receiverId.toString()].sort();
    const roomId = `${adsId}_${participants[0]}_${participants[1]}`;
    let currentConversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
      adsId,
      isDeleted: false
    });
    if (!currentConversation) {
      currentConversation = await Conversation.create({
        participants: [senderId, receiverId],
        adsId,
        roomId,
      });
    }
    const { url, key } = await putObject(file.data, fileName, myUserId);
    if (!url || !key) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "image not uploaded",
        payload: {},
      });
    }
    const newMessage = await Message.create({
      senderId,
      receiverId,
      adsId,
      message: url,
      readStatus: false,
    });
    if (!newMessage) {
      return res.status(constants.httpStatus.serverError).json({
        status: 0,
        msg: "internal server errror",
        payload: {},
      });
    }
    currentConversation.messages.push(newMessage._id);
    await currentConversation.save();
    io.to(roomId).emit("newMessage", newMessage);
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessageNotification", {
        message: newMessage,
        adsId,
        senderId,
      });
    }
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        newMessage,
      },
    });
  } catch (error) {
    logger.error(`Error in sendImage: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

const getMessages = async (req, res) => {
  const { senderId, adsId, page = 1, limit = constants.perPage.pageLimit20 } = req.query;
  const receiverId = req.user._id;
  try {
    if (!receiverId || !adsId) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    const currentPage = parseInt(page, 10) || 1;
    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
      adsId,
    });
    if (!conversation) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "no conversation found",
        payload: {},
      });
    }
    // const receiverDeletionTimestamp = conversation.deletedBy.get(receiverId.toString());
    // let filteredMessages = conversation.messages;
    // if (receiverDeletionTimestamp) {
    //   filteredMessages = filteredMessages.filter((msg) => new Date(msg.createdAt) > new Date(receiverDeletionTimestamp));
    // }
    // await Message.updateMany(
    //   {
    //     _id: { $in: filteredMessages.map((msg) => msg._id) },
    //     receiverId,
    //     readStatus: false,
    //   },
    //   { $set: { readStatus: true, updatedAt: new Date() } }
    // );
    // const paginatedMessages = filteredMessages
    //   .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    //   .slice((currentPage - 1) * limit, currentPage * limit);
    if (conversation?.messages?.length > 0) {
      await Message.updateMany(
        {
          _id: { $in: conversation.messages },
          receiverId,
          readStatus: false,
        },
        { $set: { readStatus: true, updatedAt: new Date() } }
      );
    }
    const messages = await Message.find({
      _id: { $in: conversation.messages },
    })
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * limit)
      .limit(limit);


    // const decryptedMessages = messages.map((msg) => ({
    //   _id: msg._id,
    //   senderId: msg.senderId,
    //   receiverId: msg.receiverId,
    //   adsId: msg.adsId,
    //   message: decryptMessage(msg.message),
    //   readStatus: msg.readStatus,
    //   createdAt: msg.createdAt,
    // }));

    const totalMessages = conversation.messages.length;
    const totalPages = Math.ceil(totalMessages / limit);
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        messages,
        meta: {
          totalMessages,
          currentPage,
          totalPages,
        },
      },
    });
  } catch (error) {
    logger.error(`Error in getMessages: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

const getMessageList = async (req, res) => {
  const { pages = 1, limit = constants.perPage.pageLimit16 } = req.query;
  const myUserId = req.user._id;
  try {
    if (!myUserId) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Unauthorized request",
        payload: {},
      });
    }
    const currentPage = parseInt(pages, 10) || 1;
    const totalConversations = await Conversation.countDocuments({
      participants: myUserId,
    });

    const totalPages = Math.ceil(totalConversations / limit);
    const conversations = await Conversation.find({
      participants: myUserId,
    })
      .sort({ updatedAt: -1 })
      .skip((currentPage - 1) * limit)
      .limit(limit)
      .populate({
        path: "lastMessage",
        model: "ChatMessage",
        select: "message senderId receiverId readStatus updatedAt",
      });

    if (!conversations || conversations.length === 0) {
      return res.status(constants.httpStatus.ok).json({
        status: 1,
        msg: "No conversations found",
        payload: {
          chatList: [],
        },
      });
    }
    const chatList = await Promise.all(
      conversations.map(async (conversation) => {
        const adsId = conversation.adsId;
        const adsPost = await AdsPost.findById(adsId).lean();
        if (!adsPost) {
          return null;
        }
        const adsType = adsPost.adsType;
        let post = null;
        if (adsType === "Giveaway") {
          post = await Giveaway.findOne({ adsId: adsPost._id, isDeleted: false })
            .select("_id adsId title itemImages")
            .lean();
        } else if (adsType === "Marketplace") {
          post = await Marketplace.findOne({ adsId: adsPost._id, isDeleted: false })
            .select("_id adsId title itemImages price")
            .lean();
        } else if (adsType === "Accomodation") {
          post = await Accommodation.findOne({ adsId: adsPost._id, isDeleted: false })
            .select("_id adsId title itemImages rentSchedule price")
            .lean();
        } else if (adsType === "Event") {
          post = await Event.findOne({ adsId: adsPost._id, isDeleted: false })
            .select("_id adsId title itemImages amount")
            .lean();
        }
        if (post === null || !post) {
          return null
        }
        const otherParticipantId = conversation.participants.find(
          (id) => id.toString() !== myUserId.toString()
        );
        const userDetails = await User.findById(otherParticipantId)
          .select("name")
          .lean();

        return {
          adsDetails: post,
          adsType,
          userDetails,
          lastMessage: conversation.lastMessage,
        };
      })
    );
    const filteredChatList = chatList.filter((chat) => chat !== null);
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "Success",
      payload: {
        chatList: filteredChatList,
        meta: {
          currentPage,
          limit,
          totalPages
        },
      },
    });
  } catch (error) {
    console.log("Error in getMessageList:", error.message);
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

const getUnreadNotificationCount = async (req, res) => {
  const myUserId = req.user._id;
  try {
    if (!myUserId) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorized request",
        payload: {},
      });
    }
    const unreadCount = await Message.countDocuments({
      receiverId: myUserId,
      readStatus: false,
    });
    return res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: { 
        unreadMessages: unreadCount > 0 ? true : false
      },
    });
  } catch (error) {
    logger.error(`Error in getUnreadNotificationCount: ${error.message}`, { error });
    return res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

// const deleteChat = async (req, res) => {
//   const { senderId, adsId } = req.query;
//   const receiverId = req.user._id;
//   try {
//     if(!senderId || !adsId) {
//       res.status(constants.httpStatus.badRequest).json({
//         status: 0,
//         msg: "missing required* fields",
//         payload: {}
//       });
//     }
//     const participants = [senderId.toString(), receiverId.toString()].sort();
//     const roomId = `${adsId}_${participants[0]}_${participants[1]}`; 
//     const conversation = await Conversation.findOne({ adsId, roomId });
//     if(!conversation) {
//       res.status(constants.httpStatus.badRequest).json({
//         status: 0,
//         msg: "no conversation found",
//         payload: {}
//       });
//     }
//     conversation.deletedBy.set(receiverId.toString(), new Date());
//     await conversation.save();
//     res.status(constants.httpStatus.ok).json({
//       status: 1,
//       msg: "success",
//       payload: {}
//     });
//   } catch (error) {
//     console.log("error in deleteChat", error.message);
//     res.status(constants.httpStatus.serverError).json({
//       status: 0,
//       msg: "something went wrong",
//       payload: {}
//     });
//   }
// }

const sendGroupMessages = async (req, res) => {
  const { groupId, message } = req.body;
  const myUserId = req.user._id;
  try {
    if (!myUserId) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const newMessage = await GroupMessage.create({
      senderId: myUserId,
      groupId,
      message,
    });
    if (!newMessage) {
      return res.status(constants.httpStatus.serverError).json({
        status: 0,
        msg: "internal server error",
        payload: {},
      });
    }
    const user = await User.findById(myUserId).select("_id name profileImage");
    const modifiedMessage = {
      ...newMessage.toObject(),
      senderId: user,
    };
    io.to(groupId).emit("newGroupMessage", modifiedMessage);
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        newMessage,
      },
    });
  } catch (error) {
    console.log("Error in sendGroupMessages:", error.message);
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

const sendImageGroupChat = async (req, res) => {
  const { groupId, fileName } = req.body;
  const { file } = req.files;
  const myUserId = req.user._id;
  try {
    if (!myUserId) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const { url, key } = await putObject(file.data, fileName, myUserId);
    if (!url || !key) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "image not uploaded",
        payload: {},
      });
    }
    const newMessage = await Message.create({
      senderId: myUserId,
      groupId,
      message: url,
    });
    if (!newMessage) {
      return res.status(constants.httpStatus.serverError).json({
        status: 0,
        msg: "internal server error",
        payload: {},
      });
    }
    io.to(groupId).emit("newGroupMessage", {
      senderId: myUserId,
      groupId,
      message: newMessage.message,
      // createdAt: newMessage.updatedAt,
    });
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "success",
      payload: {
        newMessage,
      },
    });
  } catch (error) {
    console.log("Error in sendImageGroupChat:", error.message);
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

const getAllGroupMessages = async (req, res) => {
  const { groupId, pages = 1, limit = constants.perPage.pageLimit20 } = req.query;
  const myUserId = req.user._id;
  try {
    if (!groupId) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "missing required* groupId",
        payload: {},
      });
    }
    if (!myUserId) {
      return res.status(constants.httpStatus.unauthorize).json({
        status: 0,
        msg: "unauthorized request",
        payload: {},
      });
    }
    const filter = {
      groupId,
      ...(Array.isArray(req.blockedUserIds) && req.blockedUserIds.length > 0
        && { senderId: { $nin: req.blockedUserIds.map(id => new mongoose.Types.ObjectId(id)) } }
      )
    }
    const pageNumber = parseInt(pages, 10) || 1;
    const messages = await GroupMessage.find({ groupId })
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limit)
      .limit(limit)
      .populate("senderId", "name profileImage")
      .lean();

    const totalMessages = await GroupMessage.countDocuments({ groupId });
    const totalPages = Math.ceil(totalMessages / limit);
    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "Success",
      payload: {
        messages,
        meta: {
          currentPage: pageNumber,
          messagePerPage: limit,
          totalMessages,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.log("Error in getAllGroupMessage:", error.message);
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};
// const deleteGroupMessage = async (req, res) => {
//   const { groupId, messageId  } = req.query;
//   const myUserId = req.user._id;
//   try {
//     if(!groupId || !messageId) {
//       return res.status(constants.httpStatus.badRequest).json({
//         status: 0,
//         msg: "missing required* fields",
//         payload: {}
//       });
//     }
//     const groupMessage = await GroupMessage.findById(messageId);
//     if(!groupMessage) {
//       return res.status(constants.httpStatus.badRequest).json({
//         status: 0,
//         msg: "msg not found",
//         payload: {}
//       });
//     }
//     groupMessage.deletedFor.push(myUserId);
//     await groupMessage.save();
//     res.status(constants.httpStatus.ok).json({
//       status: 1,
//       msg: "success",
//       payload: {}
//     });
//   } catch (error) {
//     console.log("error")
//   }
// }

module.exports = {
  sendMessage,
  sendImage,
  getMessages,
  getMessageList,
  getUnreadNotificationCount,
  // deleteChat,
  sendGroupMessages,
  sendImageGroupChat,
  getAllGroupMessages,
  // deleteGroupMessage
};
