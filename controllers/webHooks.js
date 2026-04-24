// controllers/webHooks.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { default: mongoose } = require('mongoose');
const Booking = require('../models/Booking');
const Event = require('../models/event');
const User = require('../models/users');

const webHooks = async (req, res) => {
    const sig = req.headers['stripe-signature'];//stripe send automatocally

    let event;
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('❌ Webhook signature failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        //  Handle successful payment
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;

            if (session.payment_status === 'paid') {
                const bookingId = session.metadata.bookingId;

                //  FIXED: Check if booking exists before update
                const booking = await Booking.findOne({
                    _id: bookingId,
                    bookingStatus: 'pending',
                    paymentStatus: 'pending'
                });

                if (booking) {
                    // Start MongoDB transaction for atomic updates
                    const mongoSession = await mongoose.startSession();
                    mongoSession.startTransaction();

                    try {
                        // 1. Update booking to confirmed
                        await Booking.findOneAndUpdate(
                            {
                                _id: bookingId,
                                bookingStatus: 'pending',
                                paymentStatus: 'pending'
                            },
                            {
                                bookingStatus: 'confirmed',
                                paymentStatus: 'completed',
                                stripePaymentIntent: session.payment_intent,
                                stripeSessionId: session.id,
                                paidAmount: session.amount_total / 100,
                                paidCurrency: session.currency,
                                updatedAt: new Date()
                            },
                            { session: mongoSession }
                        );

                        // 2. Update Event Revenue Tracking
                        const totalRevenue = booking.final_amount;
                        const platformFee = booking.platformFee;
                        const organizerRevenue = booking.organizerAmount;

                        await Event.findByIdAndUpdate(
                            booking.eventId,
                            {
                                $inc: {
                                    RevenueGenerated: totalRevenue,
                                    platformFeeAmount: platformFee,
                                    organizerRevenue: organizerRevenue
                                }
                            },
                            { session: mongoSession }
                        );

                        await mongoSession.commitTransaction();

                        console.log(`✅ BOOKING CONFIRMED: ${booking.bookingReference}`);
                        console.log(`💰 Revenue Split: Total=${totalRevenue} ${booking.currency}, Platform=${platformFee} ${booking.currency} (2%), Organizer=${organizerRevenue} ${booking.currency} (98%)`);
                        console.log(`📊 Connected Account: ${booking.stripeConnectedAccountId}`);

                        // TODO: Send confirmation email/notification
                    } catch (transactionError) {
                        await mongoSession.abortTransaction();
                        console.error('❌ Transaction failed:', transactionError);
                        throw transactionError;
                    } finally {
                        mongoSession.endSession();
                    }
                } else {
                    console.log(`⚠️ Booking ${bookingId} already processed or not found`);
                }
            }
        }

        // Handle expired sessions
        if (event.type === 'checkout.session.expired') {
            const session = event.data.object;
            const bookingId = session.metadata.bookingId;

            await Booking.findOneAndUpdate(
                { _id: bookingId, bookingStatus: 'pending' },
                { bookingStatus: 'expired', paymentStatus: 'failed' }
            );
            console.log(`❌ Booking expired: ${session.metadata.bookingReference || bookingId}`);
        }

        // Handle Stripe account status updates (NEW)
        if (event.type === 'account.updated') {
            const account = event.data.object;
            const userId = account.metadata?.userId;

            if (userId) {
                await User.findByIdAndUpdate(userId, {
                    stripeChargesEnabled: account.charges_enabled || false,
                    stripePayoutsEnabled: account.payouts_enabled || false,
                    stripeDetailsSubmitted: account.details_submitted || false,
                    stripeOnboardingComplete: (account.charges_enabled && account.payouts_enabled) || false,
                });
                console.log(`✅ Updated Stripe account status for user ${userId}`);
            }
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('❌ Webhook processing error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};

module.exports = { webHooks };
