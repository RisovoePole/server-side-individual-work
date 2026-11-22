const { Op } = require('sequelize');
const { matchedData, validationResult } = require('express-validator');
const asyncHandler = require('../middleware/asyncHandler');
const { notFoundRecord } = require('../middleware/errors');
const { Venue, Booking, User } = require('../models');

const escapeLike = (value) => value.replace(/[\\%_]/g, '\\$&');

exports.index = asyncHandler(async (req, res) => {
  const filters = matchedData(req, { locations: ['query'] });
  const where = {};

  // Поиск (без учёта регистра), фильтры и сортировка выполняются в Sequelize.
  if (filters.q) {
    const pattern = `%${escapeLike(filters.q)}%`;
    where[Op.or] = [{ title: { [Op.iLike]: pattern } }, { address: { [Op.iLike]: pattern } }];
  }
  if (filters.sport) where.sport = filters.sport;
  if (filters.city) where.city = { [Op.iLike]: `%${escapeLike(filters.city)}%` };

  const sort = filters.sort || 'pricePerHour';
  const direction = (filters.dir || 'asc').toUpperCase();

  const venues = await Venue.findAll({ where, order: [[sort, direction]] });

  res.render('venues/index', { venues, filters });
});

exports.show = asyncHandler(async (req, res, next) => {
  const venue = await Venue.findByPk(req.params.id);
  if (!venue) return next(notFoundRecord('Площадка не найдена'));

  const bookings = await Booking.findAll({
    where: { venueId: venue.id },
    include: [{ model: User, as: 'client', attributes: ['id', 'name'] }],
    order: [['date', 'ASC'], ['startTime', 'ASC']],
  });

  return res.render('venues/show', { venue, bookings });
});

exports.new = (req, res) => {
  res.render('venues/form', { mode: 'create', values: {}, errors: [] });
};

exports.create = asyncHandler(async (req, res) => {
  const errors = validationResult(req).array();
  if (errors.length) {
    res.locals.errors = errors;
    return res.status(400).render('venues/form', { mode: 'create', values: req.body, errors });
  }

  const venue = await Venue.create({
    title: req.body.title,
    sport: req.body.sport,
    address: req.body.address,
    city: req.body.city,
    pricePerHour: req.body.pricePerHour,
    description: req.body.description,
    photoUrl: req.body.photoUrl || null,
  });

  // Socket.IO: уведомляем всех подключённых пользователей о новой площадке.
  req.app.get('io').emit('venue:created', {
    venueId: venue.id,
    title: venue.title,
    admin: req.session.user.name,
    createdAt: new Date().toISOString(),
  });

  req.session.flash = { type: 'success', message: 'Площадка добавлена.' };
  return res.redirect(`/venues/${venue.id}`);
});

exports.edit = asyncHandler(async (req, res, next) => {
  const venue = await Venue.findByPk(req.params.id);
  if (!venue) return next(notFoundRecord('Площадка не найдена'));

  return res.render('venues/form', { mode: 'edit', values: venue.get({ plain: true }), errors: [] });
});

exports.update = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req).array();
  if (errors.length) {
    res.locals.errors = errors;
    return res.status(400).render('venues/form', {
      mode: 'edit',
      values: { ...req.body, id: req.params.id },
      errors,
    });
  }

  const venue = await Venue.findByPk(req.params.id);
  if (!venue) return next(notFoundRecord('Площадка не найдена'));

  await venue.update({
    title: req.body.title,
    sport: req.body.sport,
    address: req.body.address,
    city: req.body.city,
    pricePerHour: req.body.pricePerHour,
    description: req.body.description,
    photoUrl: req.body.photoUrl || null,
  });

  req.session.flash = { type: 'success', message: 'Изменения сохранены.' };
  return res.redirect(`/venues/${venue.id}`);
});

exports.remove = asyncHandler(async (req, res, next) => {
  const venue = await Venue.findByPk(req.params.id);
  if (!venue) return next(notFoundRecord('Площадка не найдена'));

  await venue.destroy(); // каскадно удаляются связанные брони
  req.session.flash = { type: 'success', message: 'Площадка и её брони удалены.' };
  return res.redirect('/venues');
});
