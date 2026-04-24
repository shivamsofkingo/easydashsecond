const BlockRelation = require("../models/BlockRelation.js");
const users = require("../models/users.js");

const blockuser = async (req, res) => {
    try {
        const { userId } = req.params; // user to block
        const currentUser = req.user._id; // user who is blocking 

        if (currentUser.toString() === userId) {
            return res.status(400).json({ error: "You can't block yourself." });
        }

        const existingRelation = await BlockRelation.findOne({
            blocker: currentUser,
            blocked: userId,
        });

        if (existingRelation) {
            return res.status(400).json({ error: "User is already blocked." });
        }

        await BlockRelation.create({
            blocker: currentUser,
            blocked: userId,
        });

        await users.findByIdAndUpdate(currentUser, {
            $addToSet: { blockedUsers: userId },
        });

        return res.status(201).json({ message: "User blocked successfully." });
    } catch (error) {
        console.error("Error blocking user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getallBlockedUsers = async (req, res) => {
    try {
        const userId = req.user._id;

        const blockedRelations = await BlockRelation.find({ blocker: userId })
            .populate('blocked', 'name email profileImage');

        // If there are no relations at all
        if (!blockedRelations || blockedRelations.length === 0) {
            return res.status(404).json({
                status: 0,
                message: "No blocked users found",
                payload: []
            });
        }

        // Filter out null blocked users (e.g., deleted accounts)
        const blockedUsers = blockedRelations
            .map(relation => relation.blocked)
            .filter(user => user !== null);

        if (blockedUsers.length === 0) {
            return res.status(404).json({
                status: 0,
                message: "No blocked users found",
                payload: []
            });
        }

        return res.json({
            status: 1,
            message: "success",
            payload: {
                blocker: userId,
                blocked: blockedUsers
            }
        });
    } catch (error) {
        console.error("Error fetching blocked users:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

const unblockUser = async (req, res) => {
    try {
        const { userId } = req.params; // User to unblock
        const currentUser = req.user._id;

        const deletedRelation = await BlockRelation.findOneAndDelete({
            blocker: currentUser,
            blocked: userId,
        });

        if (!deletedRelation) {
            return res.status(404).json({ error: "No user found " });
        }

        await users.findByIdAndUpdate(currentUser, {
            $pull: { blockedUsers: userId },
        });

        // Fetch updated blocked list after unblocking
        const remainingBlockedRelations = await BlockRelation.find({ blocker: currentUser })
            .populate('blocked', 'name email profileImage');

        const remainingBlockedUsers = remainingBlockedRelations
            .map(rel => rel.blocked)
            .filter(user => user !== null);

        if (remainingBlockedUsers.length === 0) {
            return res.status(200).json({
                status: 1,
                message: "User unblocked successfully. No user found ",
                payload: []
            });
        }

        return res.status(200).json({
            status: 1,
            message: "User unblocked successfully.",
            payload: []
        });
    } catch (error) {
        console.error("Error unblocking user:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
};

module.exports = {
    blockuser,
    getallBlockedUsers,
    unblockUser
};
