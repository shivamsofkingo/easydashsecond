const AccomodationPlan = require("../../models/accomodationPlan.js");
const constants = require("../../constants/constants.js");
const { adminLogger } = require("../../config/loggerConfig.js");

/**
 * Initializes the three standard accommodation plans: Starter, Pro, and Elite.
 * If they already exist, they will be updated with the requested prices.
 */

const initializeAccomodationPlans = async (req, res) => {
    try {
        const plansToCreate = [
            { tier: "Starter", price: 2 },
            { tier: "Pro", price: 5 },
            { tier: "Elite", price: 10 }
        ];

        const results = [];
        for (const planData of plansToCreate) {
            let plan = await AccomodationPlan.findOne({ tier: planData.tier });
            if (plan) {
                plan.price = planData.price;
            } else {
                plan = new AccomodationPlan(planData);
            }
            // Using .save() triggers the pre("save") hook in the model
            await plan.save();
            results.push(plan);
        }

        res.status(constants.httpStatus.ok).json({
            status: 1,
            msg: "Accommodation plans initialized successfully",
            payload: { plans: results }
        });
    } catch (error) {
        adminLogger.error(`Error in initializeAccomodationPlans: ${error.message}`, { error });
        res.status(constants.httpStatus.serverError).json({
            status: 0,
            msg: "Something went wrong during plan initialization",
            payload: {}
        });
    }
};

/**
 * Retrieves all accommodation plans.
 */
const getAccomodationPlans = async (req, res) => {
    try {
        const plans = await AccomodationPlan.find({ isDeleted: false }).sort({ price: 1 });
        res.status(constants.httpStatus.ok).json({
            status: 1,
            msg: "Success",
            payload: { plans }
        });
    } catch (error) {
        adminLogger.error(`Error in getAccomodationPlans: ${error.message}`, { error });
        res.status(constants.httpStatus.serverError).json({
            status: 0,
            msg: "Something went wrong",
            payload: {}
        });
    }
};

/**
 * Updates an existing accommodation plan (e.g., price manipulation).
 */
const updateAccomodationPlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { price } = req.body;

        if (price === undefined) {
            return res.status(constants.httpStatus.badRequest).json({
                status: 0,
                msg: "Price is required for update",
                payload: {}
            });
        }

        const updatedPlan = await AccomodationPlan.findByIdAndUpdate(
            id,
            { price },
            { new: true, runValidators: true }
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
        adminLogger.error(`Error in updateAccomodationPlan: ${error.message}`, { error });
        res.status(constants.httpStatus.serverError).json({
            status: 0,
            msg: "Something went wrong during plan update",
            payload: {}
        });
    }
};

module.exports = {
    initializeAccomodationPlans,
    getAccomodationPlans,
    updateAccomodationPlan
};
