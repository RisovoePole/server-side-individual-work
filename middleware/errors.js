exports.notFoundRecord = (message = 'Запись не найдена') => {
  const error = new Error(message);
  error.status = 404;
  return error;
};

exports.notFound = (req, res) => res.status(404).render('404');

exports.errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let status = err.status || err.statusCode || 500;
  let message = 'Внутренняя ошибка сервера. Попробуйте повторить действие позже.';
  let details = '';

  if (err.name === 'SequelizeUniqueConstraintError') {
    status = 409;
    message = 'Запись с такими уникальными данными уже существует.';
  } else if (err.name === 'SequelizeValidationError') {
    status = 400;
    message = 'Данные не прошли проверку.';
    details = err.errors.map((item) => item.message).join('; ');
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    status = 400;
    message = 'Связанная запись не найдена или не может быть удалена.';
  } else if (status >= 400 && status < 500 && err.message) {
    // Безопасные сообщения, созданные самим приложением (404 записи и т.п.).
    message = err.message;
  }

  // Технические подробности остаются только в логах сервера.
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${status}:`, err);

  return res.status(status).render('error', {
    statusCode: status,
    title: status === 500 ? 'Ошибка сервера' : 'Ошибка запроса',
    message,
    details,
  });
};
