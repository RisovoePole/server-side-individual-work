require('dotenv').config();
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { sequelize } = require('../models');

const secret = process.env.SESSION_SECRET;
if (!secret) {
  throw new Error('Не задан SESSION_SECRET. Скопируйте .env.example в .env и заполните значения.');
}

// Сессии хранятся в PostgreSQL: перезапуск контейнера не разлогинивает пользователей.
const sessionStore = new SequelizeStore({
  db: sequelize,
  tableName: 'Sessions',
  expiration: 24 * 60 * 60 * 1000,
  checkExpirationInterval: 15 * 60 * 1000,
});

const sessionMiddleware = session({
  name: 'travel.sid',
  secret,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
    maxAge: 24 * 60 * 60 * 1000,
  },
});

module.exports = { sessionMiddleware, sessionStore };
