const { stripe } = require("../utils/stripe/stripeConfigs.js");
const User = require("../models/users.js");
const NonStudent = require("../models/nonStudent.js");
const Event = require("../models/event.js");
const constants = require("../constants/constants.js");
const { logger } = require("../config/loggerConfig.js");

// Environment variables
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/**
 * Create Stripe Connect Account
 * POST /api/stripe-connect/create-account
 */
const createConnectAccount = async (req, res) => {
  const session = await User.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;
    const { country } = req.body;

    // Validate required fields
    if (!country) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Country code is required (IN, US, or GH)",
        payload: {},
      });
    }

    // Validate country code
    const validCountries = ["IN", "US", "GH"];
    if (!validCountries.includes(country)) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Invalid country code. Must be IN (India), US (USA), or GH (Ghana)",
        payload: {},
      });
    }

    // Get user
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "User not found",
        payload: {},
      });
    }

    // Verify user is Event Manager
    const nonStudent = await NonStudent.findOne({ userId }).session(session);
    if (!nonStudent || nonStudent.nonStudentProfileType !== "Event Manager") {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Only Event Managers can connect Stripe accounts",
        payload: {},
      });
    }

    // Check if already has Stripe account
    if (user.stripeAccountId) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.conflict).json({
        status: 0,
        msg: "Stripe account already connected",
        payload: {
          stripeAccountId: user.stripeAccountId,
          accountExists: true,
        },
      });
    }

    // Create Stripe Express account
    const account = await stripe.accounts.create({
      type: "express",
      country: country,
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
      metadata: {
        userId: user._id.toString(),
        platform: "ezydash",
        email: user.email,
      },
    });

    // Update user with Stripe account details
    user.stripeAccountId = account.id;
    user.stripeAccountCountry = account.country;
    user.stripeOnboardingStartedAt = new Date();
    user.stripeChargesEnabled = account.charges_enabled || false;
    user.stripePayoutsEnabled = account.payouts_enabled || false;
    user.stripeDetailsSubmitted = account.details_submitted || false;
    user.stripeOnboardingComplete = false;

    await user.save({ session });
    await session.commitTransaction();

    logger.info("Stripe account created successfully", {
      userId: user._id.toString(),
      stripeAccountId: account.id,
      country: account.country,
    });

    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "Stripe account created successfully",
      payload: {
        stripeAccountId: account.id,
        onboardingRequired: true,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error in createConnectAccount: ${error.message}`, {
      error,
      stack: error.stack,
      stripeError: error.type || 'unknown'
    });

    // Return detailed error in development
    const isDevelopment = process.env.NODE_ENV !== 'production';
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Failed to create Stripe account",
      payload: {},
      ...(isDevelopment && {
        error: error.message,
        type: error.type,
        details: error.raw?.message
      })
    });
  } finally {
    session.endSession();
  }
};

/**
 * Generate Onboarding Link
 * POST /api/stripe-connect/onboarding-link
 */
const generateOnboardingLink = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "User not found",
        payload: {},
      });
    }

    // Check if user has Stripe account
    if (!user.stripeAccountId) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "No Stripe account found. Please create an account first.",
        payload: {
          requiresAccountCreation: true,
        },
      });
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: user.stripeAccountId,
      refresh_url: `${FRONTEND_URL}/settings/stripe/refresh`,
      return_url: `${FRONTEND_URL}/settings/stripe/success`,
      type: "account_onboarding",
    });

    // Update onboarding started timestamp if not already set
    if (!user.stripeOnboardingStartedAt) {
      user.stripeOnboardingStartedAt = new Date();
      await user.save();
    }

    logger.info("Onboarding link generated", {
      userId: user._id.toString(),
      stripeAccountId: user.stripeAccountId,
    });

    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "Onboarding link generated successfully",
      payload: {
        url: accountLink.url,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
      },
    });
  } catch (error) {
    logger.error(`Error in generateOnboardingLink: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Failed to generate onboarding link",
      payload: {},
    });
  }
};

/**
 * Get Account Status
 * GET /api/stripe-connect/status
 */
const getAccountStatus = async (req, res) => {
  const session = await User.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;

    // Get user
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "User not found",
        payload: {},
      });
    }

    // Check if user has Stripe account
    if (!user.stripeAccountId) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.ok).json({
        status: 1,
        msg: "No Stripe account connected",
        payload: {
          connected: false,
          onboardingStatus: "not_started",
        },
      });
    }

    // Retrieve account from Stripe
    const account = await stripe.accounts.retrieve(user.stripeAccountId);

    // Update user with latest status
    const wasIncomplete = !user.stripeOnboardingComplete;
    user.stripeChargesEnabled = account.charges_enabled || false;
    user.stripePayoutsEnabled = account.payouts_enabled || false;
    user.stripeDetailsSubmitted = account.details_submitted || false;
    user.stripeOnboardingComplete =
      (account.charges_enabled && account.payouts_enabled) || false;

    // Set completion timestamp if just completed
    if (wasIncomplete && user.stripeOnboardingComplete && !user.stripeOnboardingCompletedAt) {
      user.stripeOnboardingCompletedAt = new Date();
    }

    await user.save({ session });
    await session.commitTransaction();

    // Check for restrictions or action required
    const needsAction = account.requirements?.disabled_reason ||
      account.requirements?.currently_due?.length > 0 ||
      account.requirements?.past_due?.length > 0;

    const actionRequired = account.requirements?.disabled_reason ||
      (account.requirements?.currently_due?.length > 0
        ? "Additional verification required"
        : null);

    logger.info("Account status retrieved", {
      userId: user._id.toString(),
      stripeAccountId: user.stripeAccountId,
      onboardingComplete: user.stripeOnboardingComplete,
    });

    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "Stripe account status retrieved successfully",
      payload: {
        connected: true,
        accountId: user.stripeAccountId,
        onboardingComplete: user.stripeOnboardingComplete,
        chargesEnabled: user.stripeChargesEnabled,
        payoutsEnabled: user.stripePayoutsEnabled,
        detailsSubmitted: user.stripeDetailsSubmitted,
        country: user.stripeAccountCountry || account.country,
        needsAction: !!needsAction,
        actionRequired: actionRequired,
        onboardingStatus: user.stripeOnboardingComplete
          ? "complete"
          : user.stripeDetailsSubmitted
          ? "pending_verification"
          : "incomplete",
      },
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error in getAccountStatus: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Failed to retrieve account status",
      payload: {},
    });
  } finally {
    session.endSession();
  }
};

/**
 * Get Dashboard Link
 * POST /api/stripe-connect/dashboard-link
 */
const getDashboardLink = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "User not found",
        payload: {},
      });
    }

    // Check if user has Stripe account
    if (!user.stripeAccountId) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "No Stripe account found",
        payload: {},
      });
    }

    // Check if onboarding is complete
    if (!user.stripeOnboardingComplete) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "Complete Stripe onboarding before accessing dashboard",
        payload: {
          requiresOnboarding: true,
        },
      });
    }

    // Create login link to Stripe Express dashboard
    const loginLink = await stripe.accounts.createLoginLink(user.stripeAccountId);

    logger.info("Dashboard link generated", {
      userId: user._id.toString(),
      stripeAccountId: user.stripeAccountId,
    });

    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "Dashboard link generated successfully",
      payload: {
        url: loginLink.url,
      },
    });
  } catch (error) {
    logger.error(`Error in getDashboardLink: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Failed to generate dashboard link",
      payload: {},
    });
  }
};

/**
 * Refresh Onboarding Link
 * POST /api/stripe-connect/refresh-onboarding
 */
const refreshOnboardingLink = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "User not found",
        payload: {},
      });
    }

    // Check if user has Stripe account
    if (!user.stripeAccountId) {
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "No Stripe account found",
        payload: {},
      });
    }

    // Create new account link
    const accountLink = await stripe.accountLinks.create({
      account: user.stripeAccountId,
      refresh_url: `${FRONTEND_URL}/settings/stripe/refresh`,
      return_url: `${FRONTEND_URL}/settings/stripe/success`,
      type: "account_onboarding",
    });

    logger.info("Onboarding link refreshed", {
      userId: user._id.toString(),
      stripeAccountId: user.stripeAccountId,
    });

    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "Onboarding link refreshed successfully",
      payload: {
        url: accountLink.url,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      },
    });
  } catch (error) {
    logger.error(`Error in refreshOnboardingLink: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Failed to refresh onboarding link",
      payload: {},
    });
  }
};

/**
 * Disconnect Stripe Account
 * DELETE /api/stripe-connect/disconnect
 */

const disconnectAccount = async (req, res) => {
  const session = await User.startSession();
  session.startTransaction();

  try {
    const userId = req.user._id;

    // Get user
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.notFound).json({
        status: 0,
        msg: "User not found",
        payload: {},
      });
    }

    // Check if user has Stripe account
    if (!user.stripeAccountId) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: "No Stripe account connected",
        payload: {},
      });
    }

    // Check for active paid events
    const activeEvents = await Event.countDocuments({
      userId: user._id,
      entryType: "Paid",
      isEventCompleted: false,
      isDeleted: false,
      date: { $gte: new Date() }, // Future events only
    }).session(session);

    if (activeEvents > 0) {
      await session.abortTransaction();
      return res.status(constants.httpStatus.badRequest).json({
        status: 0,
        msg: `Cannot disconnect Stripe account. You have ${activeEvents} active paid events.`,
        payload: {
          activeEventsCount: activeEvents,
        },
      });
    }

    const stripeAccountId = user.stripeAccountId;

    // Delete Stripe account
    try {
      await stripe.accounts.del(stripeAccountId);
    } catch (stripeError) {
      logger.warn(`Failed to delete Stripe account ${stripeAccountId}: ${stripeError.message}`);
      // Continue anyway to clean up local data
    }

    // Clear Stripe fields from user
    user.stripeAccountId = null;
    user.stripeOnboardingComplete = false;
    user.stripeChargesEnabled = false;
    user.stripePayoutsEnabled = false;
    user.stripeDetailsSubmitted = false;
    user.stripeAccountCountry = null;
    user.stripeOnboardingStartedAt = null;
    user.stripeOnboardingCompletedAt = null;

    await user.save({ session });
    await session.commitTransaction();

    logger.info("Stripe account disconnected", {
      userId: user._id.toString(),
      stripeAccountId: stripeAccountId,
    });

    res.status(constants.httpStatus.ok).json({
      status: 1,
      msg: "Stripe account disconnected successfully",
      payload: {},
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error in disconnectAccount: ${error.message}`, { error });
    res.status(constants.httpStatus.serverError).json({
      status: 0,
      msg: "Failed to disconnect Stripe account",
      payload: {},
    });
  } finally {
    session.endSession();
  }
};

module.exports = {
  createConnectAccount,
  generateOnboardingLink,
  getAccountStatus,
  getDashboardLink,
  refreshOnboardingLink,
  disconnectAccount,
};
