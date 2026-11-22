const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { Venue, Booking } = require('../models');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const [venueCount, bookingCount] = await Promise.all([
    Venue.count(),
    Booking.count({ where: { status: 'confirmed' } }),
  ]);

  res.render('index', {
    loggedOut: Boolean(req.query.loggedOut),
    venueCount,
    bookingCount,
  });
}));

module.exports = router;
