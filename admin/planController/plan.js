const SubscriptionPlan = require("../../models/subscriptionPlan.js");
const constants = require("../../constants/constants.js");
const { adminLogger } = require("../../config/loggerConfig.js");

const createPlan = async (req, res) => {
    try {
        const { planName, price, discountText, features } = req.body;
        const adminId = req.user && req.user._id ? req.user._id : null;
        
        if (!adminId) {
            return res.status(constants.httpStatus.unauthorize).json({
                status: 0,
                msg: "unauthorize request",
                payload: {}
            });
        }

        if (!planName || price === undefined || !features) {
            return res.status(constants.httpStatus.badRequest).json({
                status: 0,
                msg: "missing required fields (planName, price, features)",
                payload: {}
            });
        }

        const newPlan = await SubscriptionPlan.create({
            adminId,
            planName,
            price,
            discountText: discountText || null,
            features
        });

        await newPlan.populate("adminId", "name email profileImage role");

        res.status(constants.httpStatus.ok).json({
            status: 1,
            msg: "Plan created successfully",
            payload: { plan: newPlan }
        });
    } catch (error) {
        adminLogger.error(`error in createPlan: ${error.message}`, { error });
        res.status(constants.httpStatus.serverError).json({
            status: 0,
            msg: "something went wrong",
            payload: {}
        });
    }
};

const getAllPlans = async (req, res) => {
    try {
        const plans = await SubscriptionPlan.find({ isDeleted: false })
            .sort({ price: 1 })
            .populate("adminId", "name email profileImage role");
        
        res.status(constants.httpStatus.ok).json({
            status: 1,
            msg: "success",
            payload: { plans }
        });
    } catch (error) {
        adminLogger.error(`error in getAllPlans: ${error.message}`, { error });
        res.status(constants.httpStatus.serverError).json({
            status: 0,
            msg: "something went wrong",
            payload: {}
        });
    }
};

const updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const updatedPlan = await SubscriptionPlan.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { $set: updates },
            { new: true }
        );

        if (!updatedPlan) {
            return res.status(constants.httpStatus.notFound).json({
                status: 0,
                msg: "Plan not found",
                payload: {}
            });
        }

        res.status(constants.httpStatus.ok).json({
            status: 1,
            msg: "Plan updated successfully",
            payload: { plan: updatedPlan }
        });
    } catch (error) {
        adminLogger.error(`error in updatePlan: ${error.message}`, { error });
        res.status(constants.httpStatus.serverError).json({
            status: 0,
            msg: "something went wrong",
            payload: {}
        });
    }
};

const deletePlan = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedPlan = await SubscriptionPlan.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { $set: { isDeleted: true, isActive: false } },
            { new: true }
        );

        if (!deletedPlan) {
            return res.status(constants.httpStatus.notFound).json({
                status: 0,
                msg: "Plan not found",
                payload: {}
            });
        }

        res.status(constants.httpStatus.ok).json({
            status: 1,
            msg: "Plan deleted successfully",
            payload: {}
        });
    } catch (error) {
        adminLogger.error(`error in deletePlan: ${error.message}`, { error });
        res.status(constants.httpStatus.serverError).json({
            status: 0,
            msg: "something went wrong",
            payload: {}
        });
    }
};

module.exports = {
    createPlan,
    getAllPlans,
    updatePlan,
    deletePlan
};
