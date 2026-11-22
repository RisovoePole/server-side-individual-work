module.exports = (sequelize, DataTypes) => sequelize.define('Venue', {
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { len: { args: [3, 100], msg: 'Название должно содержать от 3 до 100 символов' } },
  },
  sport: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: {
        args: [['football', 'tennis', 'basketball', 'volleyball', 'fitness', 'badminton']],
        msg: 'Недопустимый вид спорта',
      },
    },
  },
  address: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: { len: { args: [5, 150], msg: 'Адрес должен содержать от 5 до 150 символов' } },
  },
  city: {
    type: DataTypes.STRING(60),
    allowNull: false,
    validate: { len: { args: [2, 60], msg: 'Город должен содержать от 2 до 60 символов' } },
  },
  pricePerHour: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    validate: { min: { args: [0], msg: 'Цена не может быть отрицательной' } },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: { len: { args: [10, 1000], msg: 'Описание должно содержать от 10 до 1000 символов' } },
  },
  photoUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: { isUrl: { msg: 'Введите корректную ссылку на фото' } },
  },
}, {
  tableName: 'Venues',
});
