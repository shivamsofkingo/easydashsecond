// cronJobs.js - Run this on server startup
const cron = require('node-cron');
const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const Event = require('./models/Event');

const releaseExpiredSeats = async () => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await Booking.updateMany(
      {
        bookingStatus: 'pending',
        expiresAt: { $lt: new Date() }
      },
      { $set: { bookingStatus: 'expired' } },
      { session }
    );

    // Release seats atomically
    const expiredBookings = await Booking.find({
      bookingStatus: 'expired'
    }).session(session);

    for (const booking of expiredBookings) {
      await Event.findOneAndUpdate(
        { _id: booking.eventId },
        {
          $inc: {
            [`ticketsStructure.$[ticket].availableSeats`]: booking.quantity
          }
        },
        {
          arrayFilters: [{ 'ticket.type': booking.ticketType }],
          session
        }
      );

      await Booking.deleteOne({ _id: booking._id }, { session });
    }

    await session.commitTransaction();
    console.log(`Released ${expiredBookings.length} expired bookings`);
  } catch (error) {
    await session.abortTransaction();
    console.error('Cron job error:', error);
  } finally {
    session.endSession();
  }
};

// Run every 1 minute (BookMyShow standard)
cron.schedule('*/1 * * * *', releaseExpiredSeats);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down cron jobs...');
  process.exit(0);
});

module.exports = { releaseExpiredSeats };
