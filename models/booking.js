module.exports = (sequelize, DataTypes) => sequelize.define('Booking', {
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  startTime: {
    type: DataTypes.STRING(5),
    allowNull: false,
  },
  endTime: {
    type: DataTypes.STRING(5),
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING(12),
    allowNull: false,
    defaultValue: 'confirmed',
    validate: {
      isIn: { args: [['confirmed', 'cancelled']], msg: 'Недопустимый статус брони' },
    },
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'Bookings',
  validate: {
    timeOrder() {
      if (this.startTime && this.endTime && this.endTime <= this.startTime) {
        throw new Error('Время окончания должно быть позже времени начала');
      }
    },
  },
});
