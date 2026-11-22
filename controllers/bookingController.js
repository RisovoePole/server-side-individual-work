const { validationResult } = require('express-validator');
const asyncHandler = require('../middleware/asyncHandler');
const { notFoundRecord } = require('../middleware/errors');
const { Booking, Venue, User } = require('../models');

const includes = [
  { model: Venue, attributes: ['id', 'title', 'city'] },
  { model: User, as: 'client', attributes: ['id', 'name'] },
];

async function renderForm(req, res, mode, values, errors) {
  const venues = await Venue.findAll({ order: [['title', 'ASC']] });
  if (errors.length) res.status(400);
  return res.render('bookings/form', {
    mode,
    values,
    errors,
    venues,
    isAdmin: req.session.user.role === 'admin',
  });
}

exports.loadBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findByPk(req.params.id);
  if (!booking) return next(notFoundRecord('Бронь не найдена'));

  res.locals.booking = booking;
  res.locals.bookingOwnerId = booking.userId;
  return next();
});

exports.index = asyncHandler(async (req, res) => {
  const bookings = await Booking.findAll({ include: includes, order: [['date', 'ASC'], ['startTime', 'ASC']] });
  res.render('bookings/index', { bookings });
});

exports.show = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findByPk(req.params.id, { include: includes });
  if (!booking) return next(notFoundRecord('Бронь не найдена'));

  res.render('bookings/show', { booking });
});

exports.new = asyncHandler(async (req, res) => {
  return renderForm(req, res, 'create', {
    venueId: req.query.venueId || '',
    date: '',
    startTime: '',
    endTime: '',
    comment: '',
    status: 'confirmed',
  }, []);
});

exports.create = asyncHandler(async (req, res) => {
  const errors = validationResult(req).array();
  if (errors.length) {
    res.locals.errors = errors;
    return renderForm(req, res, 'create', req.body, errors);
  }

  const status = req.session.user.role === 'admin' && req.body.status
    ? req.body.status
    : 'confirmed';

  const booking = await Booking.create({
    venueId: req.body.venueId,
    userId: req.session.user.id, // foreign key не вводится пользователем вручную
    date: req.body.date,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    status,
    comment: req.body.comment || null,
  });

  req.session.flash = { type: 'success', message: 'Бронь создана.' };
  return res.redirect(`/bookings/${booking.id}`);
});

exports.edit = asyncHandler(async (req, res) => {
  const booking = res.locals.booking;
  return renderForm(req, res, 'edit', booking.get({ plain: true }), []);
});

exports.update = asyncHandler(async (req, res) => {
  const errors = validationResult(req).array();
  if (errors.length) {
    res.locals.errors = errors;
    return renderForm(req, res, 'edit', { ...req.body, id: req.params.id }, errors);
  }

  const booking = res.locals.booking;
  await booking.update({
    venueId: req.body.venueId,
    date: req.body.date,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    status: req.body.status,
    comment: req.body.comment || null,
  });

  req.session.flash = { type: 'success', message: 'Бронь обновлена.' };
  return res.redirect(`/bookings/${booking.id}`);
});

exports.remove = asyncHandler(async (req, res) => {
  await res.locals.booking.destroy();
  req.session.flash = { type: 'success', message: 'Бронь удалена.' };
  return res.redirect('/bookings');
});

exports.cancel = asyncHandler(async (req, res) => {
  const booking = res.locals.booking;
  await booking.update({ status: 'cancelled' });
  req.session.flash = { type: 'success', message: 'Бронь отменена. Время площадки снова свободно.' };
  return res.redirect(`/venues/${booking.venueId}`);
});
