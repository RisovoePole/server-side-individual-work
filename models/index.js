require('dotenv').config();
const { sequelize, Sequelize } = require('../config/database');

const db = {};

db.User = require('./user')(sequelize, Sequelize);
db.Venue = require('./venue')(sequelize, Sequelize);
db.Booking = require('./booking')(sequelize, Sequelize);

// Одна площадка -> много броней (основная связь One-to-Many предметной области).
db.Venue.hasMany(db.Booking, {
  foreignKey: { name: 'venueId', allowNull: false },
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE',
});
db.Booking.belongsTo(db.Venue, { foreignKey: { name: 'venueId', allowNull: false } });

// Дополнительно помним, кто забронировал площадку.
db.User.hasMany(db.Booking, {
  foreignKey: { name: 'userId', allowNull: false },
  onUpdate: 'CASCADE',
  onDelete: 'CASCADE',
});
db.Booking.belongsTo(db.User, {
  as: 'client',
  foreignKey: { name: 'userId', allowNull: false },
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
