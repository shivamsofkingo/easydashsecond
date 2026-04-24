const BoostPlan = require("../../models/boostPlan.js");
const constants = require("../../constants/constants.js");
const { adminLogger } = require("../../config/loggerConfig.js");

const initializeBoostPlans = async (req, res) => {
    try {
        const adminId = req.user._id;
        const defaultPlans = [
            { duration: 3, price: 5 },
            { duration: 7, price: 10 },
            { duration: 14, price: 20 }
        ];

        for (const plan of defaultPlans) {
            await BoostPlan.findOneAndUpdate(
                { duration: plan.duration },
                { $setOnInsert: { ...plan, adminId } },
                { upsert: true }
            );
        }

        res.status(constants.httpStatus.ok).json({
            status: 1,
            msg: "Boost plans initialized successfully",
            payload: {}
        });
    } catch (error) {
        adminLogger.error(`error in initializeBoostPlans: ${error.message}`, { error });
        res.status(constants.httpStatus.serverError).json({
            status: 0,
            msg: "something went wrong",
            payload: {}
        });
    }
};

const getAllBoostPlans = async (req, res) => {
    try {
        const plans = await BoostPlan.find({ isDeleted: false }).sort({ duration: 1 });
        res.status(constants.httpStatus.ok).json({
            status: 1,
            msg: "success",
            payload: { plans }
        });
    } catch (error) {
        adminLogger.error(`error in getAllBoostPlans: ${error.message}`, { error });
        res.status(constants.httpStatus.serverError).json({
            status: 0,
            msg: "something went wrong",
            payload: {}
        });
    }
};

const updateBoostPlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { price } = req.body;
        console.log(`Updating Boost Plan ${id} with price ${price}`);

        if (price === undefined) {
            return res.status(constants.httpStatus.badRequest).json({
                status: 0,
                msg: "price is required",
                payload: {}
            });
        }

        const updatedPlan = await BoostPlan.findByIdAndUpdate(
            id,
            { $set: { price } },
            { new: true }
        );

        if (!updatedPlan) {
            return res.status(constants.httpStatus.notFound).json({
                status: 0,
                msg: "Boost plan not found",
                payload: {}
            });
        }

        res.status(constants.httpStatus.ok).json({
            status: 1,
            msg: "Boost plan updated successfully",
            payload: { plan: updatedPlan }
        });
    } catch (error) {
        adminLogger.error(`error in updateBoostPlan: ${error.message}`, { error });
        res.status(constants.httpStatus.serverError).json({
            status: 0,
            msg: "something went wrong",
            payload: {}
        });
    }
};

module.exports = {
    initializeBoostPlans,
    getAllBoostPlans,
    updateBoostPlan
};
