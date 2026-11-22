require('dotenv').config();

const path = require('path');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');

const requestLogger = require('./config/logger');
const { sessionMiddleware, sessionStore } = require('./config/session');
const { sequelize } = require('./models');
const dictionaries = require('./config/constants');
const { notFound, errorHandler } = require('./middleware/errors');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Хелперы доступны во всех EJS-шаблонах.
app.locals.formatDate = (value) => {
  if (!value) return '—';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? new Date(`${value}T00:00:00`) : new Date(value);
  return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
};
app.locals.formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('ru-RU', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};
app.locals.formatMoney = (value) => `${Number(value || 0).toLocaleString('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})} €`;

app.use(requestLogger);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(sessionMiddleware);

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  res.locals.errors = [];
  res.locals.fieldError = (field) => (res.locals.errors || []).find((error) => error.path === field)?.msg || '';
  Object.assign(res.locals, dictionaries);
  next();
});

app.use('/', require('./routes/index'));
app.use('/', require('./routes/auth'));
app.use('/venues', require('./routes/venues'));
app.use('/bookings', require('./routes/bookings'));
app.use('/statistics', require('./routes/statistics'));

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);
const io = new Server(server);
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`[socket.io] клиент подключён: ${socket.id}`);
  socket.on('disconnect', () => console.log(`[socket.io] клиент отключён: ${socket.id}`));
});

async function connectWithRetry(attempts = 10, delayMs = 2000) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await sequelize.authenticate();
      console.log('PostgreSQL: подключение установлено.');
      return;
    } catch (error) {
      console.warn(`PostgreSQL недоступен (попытка ${attempt}/${attempts}), ждём...`);
      if (attempt === attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function syncWithRetry(attempts = 5, delayMs = 1000) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await sequelize.sync();
      return;
    } catch (error) {
      // Возможна гонка: seed-скрипт тоже синхронизирует схему при первом запуске.
      if (attempt === attempts) throw error;
      console.warn(`Не удалось синхронизировать схему (попытка ${attempt}/${attempts}), повторяем...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function start() {
  await connectWithRetry();
  await syncWithRetry();
  await sessionStore.sync();

  const port = Number(process.env.PORT || 3000);
  server.listen(port, () => {
    console.log(`EasySportMD запущен: http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error('Не удалось запустить приложение:', error);
  process.exit(1);
});
