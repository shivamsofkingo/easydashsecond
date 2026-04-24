const { Schema, model } = require('mongoose');


const eventAttendeeSchmema = new Schema({
    eventId: { type: Schema.Types.ObjectId, required: true, ref: 'Event' },
    bookingId: { type: Schema.Types.ObjectId, required: true, ref: 'Booking' },

})
