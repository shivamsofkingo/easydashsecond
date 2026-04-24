const express = require('express');
const { Router } = require("express");
const { ensureAuth } = require("../middlewares/tokenIdentity.js");
const { createCheckoutSession, createBoostCheckoutSession, handleStripeWebhook, getAccomodationPlansForUser } = require("../controllers/subscriptionController.js");

const subscriptionRouter = Router();

subscriptionRouter.post("/checkout", ensureAuth, createCheckoutSession);
subscriptionRouter.post("/boost-checkout", ensureAuth, createBoostCheckoutSession);
subscriptionRouter.get("/accommodation-plans", getAccomodationPlansForUser);

module.exports = subscriptionRouter;