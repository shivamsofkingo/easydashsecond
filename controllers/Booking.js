const { default: mongoose } = require("mongoose");
const Booking = require("../models/Booking.js");
const Coupon = require("../models/coupons.js");
const { v4: uuidv4 } = require('uuid');
const Event = require("../models/event.js");
const User = require("../models/users.js");
const constants = require("../constants/constants.js");
const { stripe } = require("../utils/stripe/stripeConfigs.js");

const createBooking = async (req, res) => {
    let { eventId, ticketType, quantity, tickets } = req.body;
    const userId = req.user._id; 
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Normalize Input: Support both single ticket (old format) and multi-ticket (new format)
        if (!tickets && ticketType && quantity) {
            tickets = [{ type: ticketType, quantity: Number(quantity) }];
        }

        if (!userId || !eventId || !Array.isArray(tickets) || tickets.length === 0) {
            await session.abortTransaction();
            return res.status(constants.httpStatus.badRequest).json({
                status: 0,
                msg: "Invalid input. eventId and tickets are required.",
                payload: {},
            });
        }

        // 2. Fetch Event once to check existence and basic info
        const event = await Event.findById(eventId).session(session);
        if (!event) {
            await session.abortTransaction();
            return res.status(404).json({ status: 0, error: 'Event not found' });
        }

        let normalizedTicketsForBooking = [];
        let totalTicketAmountBeforeFee = 0;
        const ezydashFeePercent = 2; // 2% 

        // 3. Process each ticket type: Validate and Lock seats
        for (const item of tickets) {
            const { type, quantity: qty } = item;
            const requestedQty = Number(qty);

            if (!type || isNaN(requestedQty) || requestedQty <= 0) {
                throw new Error(`Invalid ticket data for type: ${type}`);
            }

            // Lock seats atomically for THIS specific ticket type in the structure
            const updatedEvent = await Event.findOneAndUpdate(
                {
                    _id: eventId,
                    ticketsStructure: {
                        $elemMatch: {
                            type: type,
                            availableSeats: { $gte: requestedQty }
                        }
                    }
                },
                {
                    $inc: {
                        "ticketsStructure.$[ticket].availableSeats": -requestedQty,
                    }
                },
                {
                    new: true,
                    session,
                    arrayFilters: [{ "ticket.type": type }]
                }
            );

            if (!updatedEvent) {
                throw new Error(`Insufficient seats or invalid ticket type: ${type}`);
            }

            // Find the ticket price from the updated event
            const ticketDetail = updatedEvent.ticketsStructure.find(t => t.type === type);
            const price = ticketDetail.price;
            totalTicketAmountBeforeFee += (price * requestedQty);

            normalizedTicketsForBooking.push({
                type,
                quantity: requestedQty,
                price
            });
        }

        // 4. Calculate Fees
        let totalConvenienceFee = 0;
        if (event.feeHandling === "PASS") {
            totalConvenienceFee = Math.ceil(totalTicketAmountBeforeFee * (ezydashFeePercent / 100));
        }
        const totalAmount = totalTicketAmountBeforeFee + totalConvenienceFee;

        // 5. Create Booking Record
        const bookingReference = `EZY-${uuidv4().split('-')[0].toUpperCase()}`;
        
        const [booking] = await Booking.create([{
            bookingReference,
            userId,
            eventId,
            tickets: normalizedTicketsForBooking,
            
            country: event.country,
            currency: event.currency,
            currencySymbol: event.currencySymbol,

            convenienceFee: totalConvenienceFee,
            totalAmount,
            final_amount: totalAmount,
            discount_amount: 0,
            coupon_code: null,

            eventTitle: event.title,
            eventDate: event.date,
            eventTime: event.time,
            eventVenue: event.name,

            bookingStatus: 'pending',
            paymentStatus: 'pending',
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) 
        }], { session });

        await session.commitTransaction();

        const formatPrice = (amount) => `${event.currencySymbol}${amount.toFixed(2)}`;

        return res.json({
            status: 1,
            msg: "Booking created - seats locked for 10 minutes",
            payload: {
                bookingId: booking._id,
                bookingReference,
                currency: event.currency,
                currencySymbol: event.currencySymbol,
                event: {
                    title: event.title,
                    venue: event.name,
                    date: event.date,
                },
                tickets: normalizedTicketsForBooking.map(t => ({
                    type: t.type,
                    quantity: t.quantity,
                    price: formatPrice(t.price)
                })),
                breakdown: {
                    discount: 0,
                    TicketPrice: formatPrice(totalTicketAmountBeforeFee),
                    ConvenienceFee: formatPrice(totalConvenienceFee),
                    Total: formatPrice(totalAmount),
                },
                expiresAt: booking.expiresAt,
            },
        });

    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        return res.status(error.message.includes("seats") ? 400 : 500).json({
            status: 0,
            msg: error.message,
            payload: {}
        });
    } finally {
        session.endSession();
    }
};

const createPaymentCheckout = async (req, res) => {
    const { bookingId } = req.params;
    const userId = req.user._id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Find and validate booking
        const booking = await Booking.findOne({ _id: bookingId }).populate('eventId').session();

        if (!booking) {
            await session.abortTransaction();
            return res.status(404).json({
                status: 0,
                msg: 'Booking not found or already paid'
            });
        }

        // 2. Check if booking expired
        /*   if (new Date() > booking.expiresAt) {
              return res.status(400).json({
                  status: 0,
                  msg: 'Booking expired. Please create a new booking.'
              });
          } */

        const newExpiryTime = Date.now() + (30 * 60 * 1000); //increase expiring time during payment to match stripe
        booking.expiresAt = new Date(newExpiryTime);
        booking.booking_stage = 'payment_initiated';
        await booking.save();
        // 3. Create line items for Stripe
        const lineItems = [];

        // Add each ticket type as a separate line item
        for (const ticket of booking.tickets) {
            lineItems.push({
                price_data: {
                    currency: booking.currency.toLowerCase(),
                    product_data: {
                        name: `${ticket.type} Ticket - ${booking.eventTitle}`,
                        description: `${ticket.quantity} x ${ticket.type} ticket(s)`,
                        images: booking.eventId.itemImages && booking.eventId.itemImages.length > 0
                            ? [booking.eventId.itemImages[0]]
                            : []
                    },
                    unit_amount: Math.round(ticket.price * 100),
                },
                quantity: ticket.quantity,
            });
        }

        // Convenience fee as separate line item
        if (booking.convenienceFee > 0) {
            lineItems.push({
                price_data: {
                    currency: booking.currency.toLowerCase(),
                    product_data: {
                        name: 'Convenience Fee',
                        description: 'Ezydash platform convenience fee'
                    },
                    unit_amount: Math.round(booking.convenienceFee * 100),
                },
                quantity: 1,
            });
        }

        let paymentMethodTypes = ['card'];
        const currency = booking.currency.toUpperCase();

        // STRIPE CONNECT: Calculate platform fee and prepare split payment
        const platformFeePercent = 2; // 2% platform fee
        const totalAmountInCents = Math.round(booking.final_amount * 100);
        const platformFeeAmount = Math.round(totalAmountInCents * (platformFeePercent / 100));
        const organizerAmount = totalAmountInCents - platformFeeAmount;

        // Get event organizer's Stripe account
        const eventOrganizer = await User.findById(booking.eventId.userId).session(session);
        if (!eventOrganizer) {
            await session.abortTransaction();
            return res.status(404).json({
                status: 0,
                msg: 'Event organizer not found'
            });
        }

        const organizerStripeAccount = eventOrganizer.stripeAccountId;
        if (!organizerStripeAccount) {
            await session.abortTransaction();
            return res.status(400).json({
                status: 0,
                msg: 'Event organizer has not connected their Stripe account. Please contact the organizer.'
            });
        }

        // Update booking with fee split information
        booking.platformFee = platformFeeAmount / 100; // Store in actual currency
        booking.organizerAmount = organizerAmount / 100; // Store in actual currency
        booking.stripeConnectedAccountId = organizerStripeAccount; // Snapshot organizer's account
        await booking.save({ session });

        // create session
        const sessionConfig = {
            payment_method_types: paymentMethodTypes,
            line_items: lineItems,
            mode: 'payment',
            success_url: `http://localhost:5173/booking/success`,
            cancel_url: `http://localhost:5173/booking/cancelled`,

            // STRIPE CONNECT: Split payment configuration
            payment_intent_data: {
                application_fee_amount: platformFeeAmount, // Platform's 2% in cents
                transfer_data: {
                    destination: organizerStripeAccount, // Organizer's Stripe account
                },
                metadata: {
                    bookingId: booking._id.toString(),
                    eventId: booking.eventId._id.toString(),
                    platformFee: (platformFeeAmount / 100).toFixed(2),
                    organizerAmount: (organizerAmount / 100).toFixed(2),
                    currency: booking.currency
                }
            },

            // Store booking info in metadata
            metadata: {
                bookingId: booking._id.toString(),
                bookingReference: booking.bookingReference,
                userId: userId.toString(),
                eventId: booking.eventId._id.toString(),
                // Store ticket breakdown as a JSON string since metadata is limited
                tickets: JSON.stringify(booking.tickets.map(t => ({ type: t.type, qty: t.quantity }))),
                coupon_code: booking.coupon_code || 'none',
                organizerStripeAccountId: organizerStripeAccount, // IMPORTANT: Snapshot for reconciliation
                platformFeeAmount: platformFeeAmount.toString(),
                organizerAmount: organizerAmount.toString()
            },

            customer_email: req.user.email,
            expires_at: Math.floor((Date.now() + 30 * 60 * 1000) / 1000),
        };

        /*   // Add discount if coupon applied
          if (booking.discount_amount > 0 && booking.coupon_code) {
              // Calculate discount in percentage or fixed
              const discountPercentage = Math.round((booking.discount_amount / booking.totalAmount) * 100);
  
              // Create a one-time coupon in Stripe
              const stripeCoupon = await stripe.coupons.create({
                  percent_off: discountPercentage,
                  duration: 'once',
                  name: booking.coupon_code,
                  metadata: {
                      bookingId: booking._id.toString()
                  }
              });
  
              sessionConfig.discounts = [{
                  coupon: stripeCoupon.id
              }];
          } */

        // 5. Create Checkout Session
        const session = await stripe.checkout.sessions.create(sessionConfig);

        // 6. Update booking with session ID
        booking.paymentId = session.id;
        booking.payment_gateway = 'stripe';
        await booking.save();

        console.log('Stripe Checkout Session created:', session);
        // 7. Return session URL
        // res.redirect(302, session.url)

        return res.json({
            status: 1,
            msg: 'Payment session created',
            payload: {
                sessionId: session.id,
                checkoutUrl: session.url, // Redirect user to this URL
                bookingReference: booking.bookingReference,
                expiresAt: booking.expiresAt
            }
        });

    } catch (error) {
        console.error('Stripe Checkout Session creation failed:', error);
        return res.status(500).json({
            status: 0,
            msg: 'Payment session creation failed',
            error: error.message
        });
    }
    finally {
        session.endSession();
    };
}

const getOrderDetails = async (req, res) => {
    const { eventId } = req.params;
    const myUserId = req.user._id;
    console.log(myUserId, eventId);
    try {
        if (!myUserId || !eventId) {
            return res.status(constants.httpStatus.badRequest).json({
                status: 0,
                msg: " missing required myUserId & postId fields",
                payload: {},
            });
        }

        const post = await Event.findOne({ _id: eventId, userId: myUserId, entryType: "Paid" });
        if (!post) {
            return res.status(constants.httpStatus.notFound).json({
                status: 0,
                msg: "Post not found",
                payload: {},
            });
        }

        let transformData = {
            eventId: post._id,
            adsId: post.adsId,
            userId: post.userId,
            title: post.title,
            description: post.description,
            totalSeats: post.totalSeats,
            date: post.date,
            time: post.time,
            itemImages: post.itemImages || [],
            region: post.region,
            country: post.country,
            currency: post.currency,
            currencySymbol: post.currencySymbol,
            attendees: post.totalSeats - post.availableSeats,
            availableSeats: post.availableSeats,
            ticketsStructure: post.ticketsStructure,
            RevenueGenerated: post.RevenueGenerated,
        };
        return res.status(constants.httpStatus.ok).json({
            status: 1,
            msg: "success",
            payload: transformData,
        });
    }
    catch (error) {
        console.log("error in getorderdetails", error);
        res.status(constants.httpStatus.serverError).json({
            status: 0,
            msg: "something went wrong",
            payload: {},
        });
    }

}

const applyCoupon = async (req, res) => {
    const { coupon_code } = req.body;
    const userId = req.user.id;

    // 1. Get booking
    const booking = await Booking.findOne({
        _id: req.params.bookingId,
        userId,
        status: 'pending',
        paymentStatus: 'pending'
    });

    if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
    }

    // 2. Validate coupon
    const coupon = await Coupon.findOne({
        code: coupon_code.toUpperCase(),
        is_active: true,
        valid_from: { $lte: new Date() },
        valid_until: { $gte: new Date() },
        $expr: { $lt: ["$used_count", "$usage_limit"] }
    });

    if (!coupon) {
        return res.status(400).json({
            error: 'Invalid or expired coupon'
        });
    }

    // 3. Check minimum order value
    if (booking.totalAmount < coupon.min_order_value) {
        return res.status(400).json({
            error: `Minimum order value ₹${coupon.min_order_value} required`
        });
    }

    // 4. Check event/ticket type restrictions
    if (coupon.applicable_events.length > 0 &&
        !coupon.applicable_events.includes(booking.eventId.toString())) {
        return res.status(400).json({
            error: 'Coupon not applicable for this event'
        });
    }

    if (coupon.applicable_ticket_types.length > 0) {
        const hasApplicableTicket = booking.tickets.some(t => coupon.applicable_ticket_types.includes(t.type));
        if (!hasApplicableTicket) {
            return res.status(400).json({
                error: 'Coupon not applicable for any of the ticket types in this booking'
            });
        }
    }

    // 5. Check per-user limit
    const userUsageCount = await Booking.countDocuments({
        userId,
        coupon_code: coupon.code,
        paymentStatus: 'completed'
    });

    if (userUsageCount >= coupon.per_user_limit) {
        return res.status(400).json({
            error: 'Coupon usage limit reached'
        });
    }

    // 6. Calculate discount
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
        discountAmount = (booking.totalAmount * coupon.value) / 100;
        if (coupon.max_discount && discountAmount > coupon.max_discount) {
            discountAmount = coupon.max_discount;
        }
    } else {
        discountAmount = coupon.value;
    }

    const finalAmount = booking.totalAmount - discountAmount;

    // 7. Update booking
    booking.coupon_code = coupon.code;
    booking.discount_amount = discountAmount;
    booking.final_amount = finalAmount;
    await booking.save();

    const ticketTotal = booking.tickets.reduce((acc, t) => acc + (t.price * t.quantity), 0);

    // 8. Return updated breakdown
    res.json({
        success: true,
        coupon_applied: coupon.code,
        breakdown: {
            ticketPrice: ticketTotal,
            convenienceFee: booking.convenienceFee,
            totalAmount: booking.totalAmount,
            discount: discountAmount,
            finalAmount
        }
    });
};

const getCoupons = async (req, res) => {
    // POST /api/payments/create
    const createPaymentIntent = async (req, res) => {
        const { bookingId } = req.body;

        const booking = await Booking.findById(bookingId);
        if (!booking || booking.paymentStatus !== 'pending') {
            return res.status(400).json({ error: 'Invalid booking' });
        }

        // Use final_amount (after discount)
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(booking.final_amount * 100),  // Use discounted amount
            currency: 'inr',
            metadata: {
                bookingId: booking._id.toString(),
                bookingReference: booking.bookingReference,
                coupon_code: booking.coupon_code || 'none'
            }
        });

        booking.stripePaymentIntentId = paymentIntent.id;
        await booking.save();

        res.json({
            clientSecret: paymentIntent.client_secret,
            amount: booking.final_amount
        });
    }


}

module.exports = {
    getOrderDetails,
    createBooking,
    createPaymentCheckout,
    getCoupons,
    applyCoupon,
};