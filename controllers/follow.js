const mongoose = require("mongoose");
const User = require("../models/users.js");
const Follow = require("../models/follow.js");
const notificationQueue = require("../utils/queues/notificationQueues.js");
const { logger } = require("../config/loggerConfig.js");

const followUser = async (req, res) => {
  const { followeeId } = req.body;
  try {
    const followerId = req.user._id.toString();
    if (followerId === followeeId) {
      return res.status(400).json({
        status: 0,
        msg: "user cannot unfollow themselves",
        payload: {},
      });
    }
    const [follower, followee] = await Promise.all([
      User.findById(followerId),
      User.findById(followeeId),
    ]);
    if (!follower || !followee) {
      return res.status(404).json({
        status: 0,
        msg: "User(s) not found",
        payload: {},
      });
    }
    const isFollowing = await Follow.findOne({ followerId, followeeId });
    if (isFollowing) {
      return res.status(200).json({
        status: 0,
        msg: "You are already following this user",
        payload: {},
      });
    }
    await Follow.create({ followerId, followeeId });
    follower.followingCount += 1;
    followee.followersCount += 1;
    await Promise.all([follower.save(), followee.save()]);
    const user = await User.findById(followerId);
    if (!user) {
      return res.status(200).json({
        status: 0,
        msg: "user not found",
        payload: {},
      });
    }
    await notificationQueue.add("follow", {
      senderId: followerId,
      recieverId: followeeId,
      images: user.profileImage,
      notificationType: "Follow",
      message: `${follower.name} started following you`,
    });
    return res.status(200).json({
      status: 1,
      msg: "success",
      payload: {},
    });
  } catch (error) {
    console.log("error in followUser", error);
    res.status(500).json({
      status: 0,
      msg: `something went wrong ${error.message}`,
      payload: {},
    });
  }
};

const unFollowUser = async (req, res) => {
  const { followeeId } = req.body;
  try {
    const followerId = req.user._id;
    if (followerId === followeeId) {
      return res.status(400).json({
        status: 0,
        msg: "user cannot unfollow themselves",
        payload: {},
      });
    }
    const [follower, followee] = await Promise.all([
      User.findById(followerId),
      User.findById(followeeId),
    ]);
    if (!follower || !followee) {
      return res.status(404).json({
        status: 0,
        msg: "User(s) not found",
        payload: {},
      });
    }
    const followRelation = await Follow.findOne({ followerId, followeeId });
    if (!followRelation) {
      return res.status(400).json({
        status: 0,
        msg: "You are not following this user",
        payload: {},
      });
    }
    await Follow.deleteOne({ followerId, followeeId });
    if (follower.followingCount > 0) {
      follower.followingCount -= 1;
    }
    if (followee.followersCount > 0) {
      followee.followersCount -= 1;
    }
    await Promise.all([follower.save(), followee.save()]);
    return res.status(200).json({
      status: 1,
      msg: "success",
      payload: {},
    });
  } catch (error) {
    console.log("error in unFollowUser", error);
    res.status(500).json({
      status: 0,
      msg: "something went wrong",
      payload: {},
    });
  }
};

const getFollowers = async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 16 } = req.query;
  const userId = id;

  try {
    const pageInt = parseInt(page, 10);
    const limitInt = parseInt(limit, 10);
    if (isNaN(pageInt) || isNaN(limitInt) || pageInt < 1 || limitInt < 1) {
      return res.status(400).json({
        status: 0,
        msg: "Invalid pagination parameters",
        payload: {},
      });
    }
    const filter = {
      followeeId: userId,
      ...(Array.isArray(req.blockedUserIds) && req.blockedUserIds.length > 0
        ? { followerId: { $nin: req.blockedUserIds.map(id => new mongoose.Types.ObjectId(id)) } }
        : {})
    }
    const totalFollowers = await Follow.countDocuments(filter);
    const followers = await Follow.find(filter)
      .populate("followerId", "name profileImage")
      .skip((pageInt - 1) * limitInt)
      .limit(limitInt)
      .select("-_id");

    const result = followers.map((follow) => ({
      id: follow.followerId._id,
      name: follow.followerId.name,
      profileImage: follow.followerId.profileImage,
    }));

    return res.status(200).json({
      status: 1,
      msg: "success",
      payload: {
        followers: result,
        pagination: {
          currentPage: pageInt,
          totalPages: Math.ceil(totalFollowers / limitInt),
          totalFollowers,
          perPage: limitInt,
        },
      },
    });
  } catch (error) {
    logger.error("Error in getFollowers:", error);
    return res.status(500).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

const getFollowings = async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 16 } = req.query;
  const userId = id;

  try {
    const pageInt = parseInt(page, 10);
    const limitInt = parseInt(limit, 10);

    if (isNaN(pageInt) || isNaN(limitInt) || pageInt < 1 || limitInt < 1) {
      return res.status(400).json({
        status: 0,
        msg: "Invalid pagination parameters",
        payload: {},
      });
    }
    const filter = {
      followerId: userId,
      ...(Array.isArray(req.blockedUserIds) && req.blockedUserIds.length > 0
        ? { followeeId: { $nin: req.blockedUserIds.map(id => new mongoose.Types.ObjectId(id)) } }
        : {})

    }
    const totalFollowings = await Follow.countDocuments(filter);
    const followings = await Follow.find(filter)
      .populate("followeeId", "name profileImage")
      .skip((pageInt - 1) * limitInt)
      .limit(limitInt)
      .select("-_id");

    const result = followings
      .filter(f => f.followeeId) // remove nulls
      .map(f => ({
        id: f.followeeId._id,
        name: f.followeeId.name,
        profileImage: f.followeeId.profileImage,
      }));

    return res.status(200).json({
      status: 1,
      msg: "success",
      payload: {
        followings: result,
        pagination: {
          currentPage: pageInt,
          totalPages: Math.ceil(totalFollowings / limitInt),
          totalFollowings,
          perPage: limitInt,
        },
      },
    });
  } catch (error) {
    logger.error("Error in getFollowings:", error);
    return res.status(500).json({
      status: 0,
      msg: "Something went wrong",
      payload: {},
    });
  }
};

const isFollowing = async (req, res) => {
  const { id } = req.params;
  const myUserId = req.user._id;
  try {
    if (!id) {
      return res.status(400).json({
        status: 0,
        msg: "missing required* fields",
        payload: {},
      });
    }
    if (!myUserId) {
      return res.status(400).json({
        status: 0,
        msg: "unauthorize request",
        payload: {},
      });
    }
    const isFollow = await Follow.findOne({
      followerId: myUserId,
      followeeId: id,
    });
    if (isFollow) {
      return res.status(200).json({
        status: 1,
        msg: "already followed",
        payload: {},
      });
    }
    res.status(200).json({
      status: 0,
      msg: "not followed yet!",
      payload: {},
    });
  } catch (error) {
    logger.error("Error in checkIsFollow:", error);
    return res.status(500).json({
      status: 0,
      msg: `Something went wrong: ${error.message}`,
      payload: {},
    });
  }
};

module.exports = {
  followUser,
  unFollowUser,
  getFollowers,
  getFollowings,
  isFollowing,
};
