const fs = require('fs');
const path = require('path');
const morgan = require('morgan');

const logsDir = path.join(__dirname, '..', 'logs');
fs.mkdirSync(logsDir, { recursive: true });

const fileStream = fs.createWriteStream(path.join(logsDir, 'access.log'), { flags: 'a' });

// Формат: GET /trips | 200 | 12 ms
const format = ':method :url | :status | :response-time ms';

module.exports = morgan(format, {
  stream: {
    write(message) {
      process.stdout.write(message);
      fileStream.write(message);
    },
  },
});
