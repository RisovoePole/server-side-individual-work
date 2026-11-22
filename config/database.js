require('dotenv').config();
const { Sequelize } = require('sequelize');

// Пароль БД и секрет сессии не хранятся в коде — только в окружении/.env.
const password = process.env.DB_PASSWORD;
if (!password) {
  throw new Error('Не задан DB_PASSWORD. Скопируйте .env.example в .env и заполните значения.');
}

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'travel_db',
  username: process.env.DB_USER || 'postgres',
  password,
  logging: process.env.DB_SQL_LOG === 'true' ? console.log : false,
  pool: { max: 5, min: 0, idle: 10000 },
  define: { timestamps: true },
});

module.exports = { sequelize, Sequelize };
