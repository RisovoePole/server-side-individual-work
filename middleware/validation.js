const { body, query, param, validationResult } = require('express-validator');
const { User, Venue } = require('../models');
const { SPORTS, BOOKING_STATUSES, SORT_FIELDS } = require('../config/constants');

const sportValues = SPORTS.map((item) => item.value);
const statusValues = BOOKING_STATUSES.map((item) => item.value);
const sortValues = SORT_FIELDS.map((item) => item.value);

const registerRules = [
  body('name').trim().notEmpty().withMessage('Укажите имя')
    .isLength({ min: 2, max: 50 }).withMessage('Имя должно содержать от 2 до 50 символов'),
  body('email').trim().normalizeEmail().isEmail().withMessage('Введите корректный email')
    .custom(async (value) => {
      const exists = await User.findOne({ where: { email: value } });
      if (exists) throw new Error('Пользователь с таким email уже зарегистрирован');
      return true;
    }),
  body('password').isLength({ min: 6 }).withMessage('Пароль должен содержать минимум 6 символов'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) throw new Error('Пароли не совпадают');
    return true;
  }),
];

const loginRules = [
  body('email').trim().normalizeEmail().isEmail().withMessage('Введите корректный email'),
  body('password').notEmpty().withMessage('Введите пароль'),
];

const venueRules = [
  body('title').trim().notEmpty().withMessage('Укажите название площадки')
    .isLength({ min: 3, max: 100 }).withMessage('Название должно содержать от 3 до 100 символов'),
  body('sport').isIn(sportValues).withMessage('Выберите корректный вид спорта'),
  body('address').trim().notEmpty().withMessage('Укажите адрес')
    .isLength({ min: 5, max: 150 }).withMessage('Адрес должен содержать от 5 до 150 символов'),
  body('city').trim().notEmpty().withMessage('Укажите город')
    .isLength({ min: 2, max: 60 }).withMessage('Город должен содержать от 2 до 60 символов'),
  body('pricePerHour').isFloat({ min: 0 }).withMessage('Цена за час должна быть числом не меньше 0')
    .toFloat(),
  body('description').trim().notEmpty().withMessage('Добавьте описание площадки')
    .isLength({ min: 10, max: 1000 }).withMessage('Описание должно содержать от 10 до 1000 символов'),
  body('photoUrl').optional({ checkFalsy: true }).trim()
    .isURL({ require_tld: false }).withMessage('Введите корректную ссылку на фото'),
];

const bookingRules = [
  body('venueId').notEmpty().withMessage('Выберите площадку из списка')
    .isInt({ min: 1 }).withMessage('Некорректный идентификатор площадки')
    .toInt()
    .custom(async (value) => {
      const venue = await Venue.findByPk(value);
      if (!venue) throw new Error('Выбранная площадка не существует');
      return true;
    }),
  body('date').isISO8601({ strict: true }).withMessage('Укажите корректную дату (ГГГГ-ММ-ДД)')
    .custom((value) => {
      const today = new Date().toISOString().slice(0, 10);
      if (value < today) throw new Error('Нельзя забронировать прошедшую дату');
      return true;
    }),
  body('startTime').matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage('Время начала должно быть в формате ЧЧ:ММ'),
  body('endTime').matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage('Время окончания должно быть в формате ЧЧ:ММ')
    .custom((value, { req }) => {
      if (req.body.startTime && value <= req.body.startTime) {
        throw new Error('Время окончания должно быть позже времени начала');
      }
      return true;
    }),
  body('status').optional({ checkFalsy: true }).isIn(statusValues)
    .withMessage('Недопустимый статус брони'),
  body('comment').optional({ checkFalsy: true }).trim()
    .isLength({ max: 500 }).withMessage('Комментарий не длиннее 500 символов'),
];

const venueQueryRules = [
  query('q').optional({ checkFalsy: true }).trim()
    .isLength({ max: 100 }).withMessage('Поисковый запрос слишком длинный'),
  query('sport').optional({ checkFalsy: true }).isIn(sportValues)
    .withMessage('Недопустимый вид спорта'),
  query('city').optional({ checkFalsy: true }).trim()
    .isLength({ max: 60 }).withMessage('Название города слишком длинное'),
  query('sort').optional({ checkFalsy: true }).isIn(sortValues)
    .withMessage('Недопустимое поле сортировки'),
  query('dir').optional({ checkFalsy: true }).isIn(['asc', 'desc'])
    .withMessage('Недопустимое направление сортировки'),
];

const idParamRule = [
  param('id').isInt({ min: 1 }).withMessage('Некорректный идентификатор').toInt(),
];

// Для GET-запросов: ShowErrors на странице ошибки, а не повторный рендер формы.
const handleValidation = (req, res, next) => {
  const errors = validationResult(req).array();
  if (!errors.length) {
    res.locals.errors = [];
    return next();
  }

  res.locals.errors = errors;
  return res.status(400).render('error', {
    statusCode: 400,
    title: 'Некорректный запрос',
    message: 'Проверьте параметры запроса.',
    details: errors.map((item) => item.msg).join('; '),
  });
};

module.exports = {
  registerRules,
  loginRules,
  venueRules,
  bookingRules,
  venueQueryRules,
  idParamRule,
  handleValidation,
};
