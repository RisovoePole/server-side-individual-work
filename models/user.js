module.exports = (sequelize, DataTypes) => sequelize.define('User', {
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Имя обязательно' },
      len: { args: [2, 50], msg: 'Имя должно содержать от 2 до 50 символов' },
    },
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: { msg: 'Введите корректный email' },
    },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Только bcrypt-хэш, открытый пароль никогда не сохраняется',
  },
  role: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'user',
    validate: {
      isIn: { args: [['user', 'admin']], msg: 'Недопустимая роль' },
    },
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'Users',
});
