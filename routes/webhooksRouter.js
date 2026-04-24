// api/webhooks
const express = require('express');
const { webHooks } = require('../controllers/webHooks');
const webhooksRouter = express.Router();

webhooksRouter.post('/stripe', express.raw({ type: 'application/json' }), webHooks)// Stripe requires the raw, unmodified request body as a Buffer to verify authenticity 
module.exports = webhooksRouter;