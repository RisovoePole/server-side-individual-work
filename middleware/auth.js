// Защита на сервере: скрытие кнопок в EJS — только дополнение, а не защита.
exports.isAuthenticated = (req, res, next) => {
  if (req.session.user) return next();

  return res.status(401).render('error', {
    statusCode: 401,
    title: 'Требуется вход',
    message: 'Для просмотра этой страницы войдите в аккаунт.',
    details: '',
  });
};

exports.isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') return next();

  return res.status(403).render('403');
};

// Пользователь может менять только свою бронь; администратор — любую.
exports.canManageBooking = (req, res, next) => {
  const user = req.session.user;
  if (user && (user.role === 'admin' || user.id === res.locals.bookingOwnerId)) return next();

  return res.status(403).render('403');
};
