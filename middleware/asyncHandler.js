// Передаёт ошибки из async/await в центральный обработчик Express.
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
