const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const User = require("../models/users.js");
const SubscriptionPlan = require("../models/subscriptionPlan.js");
const AccomodationPlan = require("../models/accomodationPlan.js");
const Accomodation = require("../models/accomodation.js");
const UserSubscription = require("../models/userSubscription.js");
const Kyc = require("../models/kyc.js");
const BoostPlan = require("../models/boostPlan.js");
const constants = require("../constants/constants.js");
const { logger } = require("../config/loggerConfig.js");

const createCheckoutSession = async (req, res) => {
    const userId = req.user._id;
    const { planId, planType } = req.body;

    try {
        if (!planId) {
            return res.status(constants.httpStatus.badRequest).json({
                status: 0,
                msg: "Plan ID is required",
                payload: {}
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(constants.httpStatus.notFound).json({ status: 0, msg: "User not found" });
        }

        let plan;
        if (planType === 'accommodation') {
            plan = await AccomodationPlan.findById(planId);
            if (!plan || !plan.isActive || plan.isDeleted) {
                return res.status(constants.httpStatus.notFound).json({ status: 0, msg: "Accommodation Plan not found or inactive" });
            }
        } else {
            plan = await SubscriptionPlan.findById(planId);
            if (!plan || !plan.isActive || plan.isDeleted) {
                return res.status(constants.httpStatus.notFound).json({ status: 0, msg: "Plan not found or inactive" });
            }
        }

        // Calculate recurring interval
        let recurring = { interval: 'month' };
        if (plan.planName && (plan.planName === 'Yearly' || plan.planName === 'Annually')) recurring.interval = 'year';
        else if (plan.planName && plan.planName === 'Weekly') recurring.interval = 'week';

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const displayProductName = planType === 'accommodation' ? `${plan.tier} Accommodation Plan` : `${plan.planName} Premium Plan`;
        const displayDescription = planType === 'accommodation' ? `Premium capabilities for your accommodation listings.` : "Unlocks premium features like Enhanced Support and Upgraded Profile Links.";


        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: user.email,
            client_reference_id: userId.toString(),
            metadata: {
                planId: planId.toString(),
                userId: userId.toString(),
                planType: planType || 'standard'
            },
            line_items: [
                {
                    price_data: {
                        currency: 'usd', // Assuming USD or user's preference
                        product_data: {
                            name: displayProductName,
                            description: displayDescription
                        },
                        unit_amount: Math.round(plan.price * 100), // Stripe expects cents
                        recurring
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${frontendUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${frontendUrl}/subscription/cancel`,
        });

        res.status(constants.httpStatus.ok).json({
            status: 1,
            msg: "Checkout session created",
            payload: {
                sessionId: session.id,
                url: session.url
            }
        });
    } catch (error) {
        logger.error(`Error in createCheckoutSession: ${error.message}`, { error });
        res.status(constants.httpStatus.serverError).json({ status: 0, msg: "Something went wrong" });
    }
};

const createBoostCheckoutSession = async (req, res) => {
    const userId = req.user._id;
    const { postId, duration } = req.body; // duration: 3 or 7 (days)

    try {
        if (!postId || !duration) {
            return res.status(constants.httpStatus.badRequest).json({
                status: 0,
                msg: "Post ID and duration are required",
                payload: {}
            });
        }

        if (![3, 7].includes(parseInt(duration))) {
            return res.status(constants.httpStatus.badRequest).json({
                status: 0,
                msg: "Invalid duration. Only 3 or 7 days boosts are available.",
                payload: {}
            });
        }

        const ad = await Accomodation.findOne({ _id: postId, userId });
        if (!ad) {
            return res.status(constants.httpStatus.notFound).json({ status: 0, msg: "Accommodation ad not found or unauthorized" });
        }

        const user = await User.findById(userId);
        
        // Fetch pricing from database
        const boostPlan = await BoostPlan.findOne({ duration: parseInt(duration), isActive: true, isDeleted: false });
        if (!boostPlan) {
            return res.status(constants.httpStatus.notFound).json({ status: 0, msg: "Boost plan not found for this duration" });
        }

        const price = boostPlan.price;
        const displayProductName = `Accommodation Boost - ${duration} Days`;
        const displayDescription = `Featured visibility and higher reach for your ad: "${ad.title}" for ${duration} days.`;

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: user.email,
            client_reference_id: userId.toString(),
            metadata: {
                userId: userId.toString(),
                postId: postId.toString(),
                duration: duration.toString(),
                planType: 'on-demand-boost'
            },
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: displayProductName,
                            description: displayDescription
                        },
                        unit_amount: Math.round(price * 100), // Stripe expects cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${frontendUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${frontendUrl}/subscription/cancel`,
        });

        res.status(constants.httpStatus.ok).json({
            status: 1,
            msg: "Boost checkout session created",
            payload: {
                sessionId: session.id,
                url: session.url
            }
        });
    } catch (error) {
        logger.error(`Error in createBoostCheckoutSession: ${error.message}`, { error });
        res.status(constants.httpStatus.serverError).json({ status: 0, msg: "Something went wrong" });
    }
};

const handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body, // Make sure body parsing doesn't consume this as JSON for webhooks
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        logger.error(`Stripe Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        if (session.mode === 'subscription') {
            const userId = session.metadata.userId;
            const planId = session.metadata.planId;
            const planType = session.metadata.planType;
            const subscriptionId = session.subscription;
            const customerId = session.customer;

            try {
                // Get Subscription Details from Stripe to find end date
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);
                const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
                const currentPeriodStart = new Date(subscription.current_period_start * 1000);

                logger.info(`Processing subscription for User: ${userId}, Plan: ${planId}, Type: ${planType}`);

                // Save or update user subscription record
                await UserSubscription.findOneAndUpdate(
                    { stripeSubscriptionId: subscriptionId },
                    {
                        userId,
                        planId,
                        stripeSubscriptionId: subscriptionId,
                        stripeCustomerId: customerId,
                        status: subscription.status.toUpperCase(),
                        currentPeriodStart,
                        currentPeriodEnd
                    },
                    { upsert: true, new: true }
                );

                if (planType === 'accommodation') {
                    const accPlan = await AccomodationPlan.findById(planId);
                    let isVerifiedPM = false;
                    if (accPlan && accPlan.tier === 'Pro') {
                       isVerifiedPM = true;
                    }
                    await User.findByIdAndUpdate(userId, {
                       accommodationPlan: planId,
                       accommodationPlanExpiresAt: currentPeriodEnd,
                       accommodationAdsPostedThisPeriod: 0,
                       accommodationBoostsUsed: 0,
                       isVerifiedPM: isVerifiedPM
                    });
                    logger.info(`Updated Accommodation Plan for user ${userId}`);
                } else {
                    // Standard platform subscription - DELAY ACTIVATION until KYC Approval
                    logger.info(`Standard subscription paid for user ${userId}. Storing pending plan info.`);

                    // Update or create KYC record with pending plan info
                    const kycUpdate = await Kyc.findOneAndUpdate(
                        { userId },
                        { 
                            status: "PENDING",
                            pendingPlanId: planId,
                            planExpiryDate: currentPeriodEnd
                        },
                        { new: true, upsert: true } // Upsert in case they paid before submitting docs
                    );

                    if (kycUpdate) {
                        logger.info(`KYC status moved to PENDING with plan ${planId} for user ${userId}. Admin review required for activation.`);
                    }
                }

            } catch (error) {
                logger.error(`Error saving subscription data for User ${userId}: ${error.message}`);
            }
        } else if (session.mode === 'payment') {
            const userId = session.metadata.userId;
            const postId = session.metadata.postId;
            const duration = parseInt(session.metadata.duration);
            const planType = session.metadata.planType;

            if (planType === 'on-demand-boost') {
                try {
                    const boostExpiresAt = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
                    await Accomodation.findByIdAndUpdate(postId, {
                        isBoosted: true,
                        boostExpiresAt: boostExpiresAt,
                        priorityScore: 3 // High priority for on-demand boosts
                    });
                    logger.info(`On-demand boost activated for post ${postId} (duration: ${duration} days)`);
                } catch (error) {
                    logger.error(`Error activating on-demand boost: ${error.message}`);
                }
            }
        }
    } else if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
        // Handle cancellations or renewals
        const subscription = event.data.object;
        try {
             const userSub = await UserSubscription.findOneAndUpdate(
                 { stripeSubscriptionId: subscription.id },
                 {
                     status: subscription.status.toUpperCase(),
                     currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                     cancelAtPeriodEnd: subscription.cancel_at_period_end
                 }
             );

             if (event.type === 'customer.subscription.deleted' && userSub) {
                 const isAccPlan = await AccomodationPlan.findById(userSub.planId);
                 if (isAccPlan) {
                     // Revoke priority and boost flags
                     await Accomodation.updateMany(
                         { userId: userSub.userId },
                         { $set: { isBoosted: false, isFeaturedBanner: false, priorityScore: 0 } }
                     );
                     // Mark the plan expired and revoke badges
                     await User.findByIdAndUpdate(userSub.userId, {
                        accommodationPlan: null,
                        accommodationPlanExpiresAt: null,
                        isVerifiedPM: false
                     });
                 } else {
                     // Unhook standard subscription
                     await User.findByIdAndUpdate(userSub.userId, {
                        subscriptionExpiresAt: new Date(0) 
                     });
                 }
             }

        } catch(error) {
             logger.error(`Error updating subscription data: ${error.message}`);
        }
    }

    res.json({received: true});
};

const getAccomodationPlansForUser = async (req, res) => {
    try {
        const plans = await AccomodationPlan.find({ isActive: true, isDeleted: false }).sort({ price: 1 });
        res.status(constants.httpStatus.ok).json({
            status: 1,
            msg: "Accommodation plans fetched successfully",
            payload: { plans }
        });
    } catch (error) {
        logger.error(`Error in getAccomodationPlansForUser: ${error.message}`);
        res.status(constants.httpStatus.serverError).json({ status: 0, msg: "Something went wrong" });
    }
};

module.exports = { createCheckoutSession, createBoostCheckoutSession, handleStripeWebhook, getAccomodationPlansForUser };
