const { Router } = require("express");
const { ensureAuth } = require("../middlewares/tokenIdentity.js");
const {
  createConnectAccount,
  generateOnboardingLink,
  getAccountStatus,
  getDashboardLink,
  refreshOnboardingLink,
  disconnectAccount,
} = require("../controllers/stripeConnect.js");

const stripeConnectRouter = Router();

// All routes require authentication (ensureAuth middleware)

/**
 * Create Stripe Connect Account
 * @route POST /api/stripe-connect/create-account
 * @access Protected (Event Managers only)
 */
stripeConnectRouter.post("/create-account", ensureAuth, createConnectAccount);

/**
 * Generate Onboarding Link
 * @route POST /api/stripe-connect/onboarding-link
 * @access Protected
 */

stripeConnectRouter.post("/onboarding-link", ensureAuth, generateOnboardingLink);

/**
 * Get Account Status
 * @route GET /api/stripe-connect/status
 * @access Protected
 */
stripeConnectRouter.get("/status", ensureAuth, getAccountStatus);

/**
 * Get Dashboard Link
 * @route POST /api/stripe-connect/dashboard-link
 * @access Protected
 */
stripeConnectRouter.post("/dashboard-link", ensureAuth, getDashboardLink);

/**
 * Refresh Onboarding Link
 * @route POST /api/stripe-connect/refresh-onboarding
 * @access Protected
 */
stripeConnectRouter.post("/refresh-onboarding", ensureAuth, refreshOnboardingLink);

/**
 * Disconnect Stripe Account
 * @route DELETE /api/stripe-connect/disconnect
 * @access Protected
 */
stripeConnectRouter.delete("/disconnect", ensureAuth, disconnectAccount);

module.exports = stripeConnectRouter;
