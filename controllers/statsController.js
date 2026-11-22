const { fn, col } = require('sequelize');
const asyncHandler = require('../middleware/asyncHandler');
const { Venue, Booking } = require('../models');
const { SPORTS, BOOKING_STATUSES } = require('../config/constants');

exports.index = asyncHandler(async (req, res) => {
  // Все показатели считаются SQL-запросами PostgreSQL, а не в браузере.
  const [totalVenues, totalBookings, confirmedBookings, cancelledBookings, sportRows, statusRows, avgRow, maxVenue] =
    await Promise.all([
      Venue.count(),
      Booking.count(),
      Booking.count({ where: { status: 'confirmed' } }),
      Booking.count({ where: { status: 'cancelled' } }),
      Venue.findAll({
        attributes: ['sport', [fn('COUNT', col('id')), 'cnt']],
        group: 'sport',
        raw: true,
      }),
      Booking.findAll({
        attributes: ['status', [fn('COUNT', col('id')), 'cnt']],
        group: 'status',
        raw: true,
      }),
      Venue.findOne({ attributes: [[fn('AVG', col('pricePerHour')), 'avgPrice']], raw: true }),
      Venue.findOne({ order: [['pricePerHour', 'DESC']] }),
    ]);

  const sportStats = SPORTS.map((sport) => ({
    label: sport.label,
    count: Number(sportRows.find((row) => row.sport === sport.value)?.cnt || 0),
  }));

  const statusStats = BOOKING_STATUSES.map((status) => ({
    label: status.label,
    count: Number(statusRows.find((row) => row.status === status.value)?.cnt || 0),
  }));

  res.render('statistics/index', {
    totalVenues,
    totalBookings,
    confirmedBookings,
    cancelledBookings,
    sportStats,
    statusStats,
    avgPrice: Number(avgRow?.avgPrice || 0),
    maxVenue,
  });
});
