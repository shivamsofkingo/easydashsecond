// middleware/blockFilter.js
const BlockRelation = require('../models/BlockRelation.js');

module.exports = async function blockFilter(req, res, next) {
    try {
        req.blockedUserIds = [];

        if (!req.user)  return next();

        const userId = req.user._id;
        const blockedRelations = await BlockRelation.find({
            $or: [{ blocker: userId }, { blocked: userId }]
        });
        // Collect all users that should be hidden from or to this user
        const blockedUserIds = new Set();

        blockedRelations.forEach(relation => {
            if (relation.blocker.equals(userId)) {
                // You blocked them — hide their content from you
                blockedUserIds.add(String(relation.blocked));
            } else {
                // They blocked you — hide their content from you
                blockedUserIds.add(String(relation.blocker));
            }
        });

        req.blockedUserIds = Array.from(blockedUserIds);

        next();
    } catch (error) {
        console.error('Error in blockFilter:', error);
        next();
    }
};