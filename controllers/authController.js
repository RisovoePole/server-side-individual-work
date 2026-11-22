const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const asyncHandler = require('../middleware/asyncHandler');
const { User } = require('../models');

const SALT_ROUNDS = 12;

exports.showRegister = (req, res) => {
  res.render('auth/register', { values: {}, errors: [] });
};

exports.register = asyncHandler(async (req, res) => {
  const errors = validationResult(req).array();

  if (errors.length) {
    res.locals.errors = errors;
    return res.status(400).render('auth/register', {
      values: { name: req.body.name || '', email: req.body.email || '' },
      errors,
    });
  }

  const { name, email, password } = req.body;
  // Открытый пароль в БД не попадает — сохраняем только bcrypt-хэш.
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await User.create({ name, email, password: passwordHash, role: 'user' });

  req.session.flash = { type: 'success', message: 'Регистрация завершена. Теперь войдите в аккаунт.' };
  return res.redirect('/login');
});

exports.showLogin = (req, res) => {
  res.render('auth/login', { values: {}, errors: [] });
};

exports.login = asyncHandler(async (req, res) => {
  const errors = validationResult(req).array();

  if (errors.length) {
    res.locals.errors = errors;
    return res.status(400).render('auth/login', {
      values: { email: req.body.email || '' },
      errors,
    });
  }

  const user = await User.findOne({ where: { email: req.body.email } });
  const validPassword = user ? await bcrypt.compare(req.body.password, user.password) : false;

  if (!validPassword) {
    const loginErrors = [{ path: 'password', msg: 'Неверный email или пароль' }];
    res.locals.errors = loginErrors;
    return res.status(401).render('auth/login', {
      values: { email: req.body.email || '' },
      errors: loginErrors,
    });
  }

  // В сессии только идентификатор и неконфиденциальные данные.
  req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  user.lastLogin = new Date();
  await user.save();

  req.session.flash = { type: 'success', message: `С возвращением, ${user.name}!` };
  return res.redirect('/venues');
});

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('travel.sid');
    res.redirect('/?loggedOut=1');
  });
};

exports.profile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.session.user.id, {
    attributes: ['id', 'name', 'email', 'role', 'createdAt', 'lastLogin'],
  });

  if (!user) {
    req.session.destroy(() => res.redirect('/login'));
    return;
  }

  res.render('auth/profile', { user });
});
