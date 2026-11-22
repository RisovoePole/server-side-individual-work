require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize, User, Venue, Booking } = require('../models');

function dateInDays(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function syncWithRetry(attempts = 5, delayMs = 1000) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await sequelize.sync();
      return;
    } catch (error) {
      if (attempt === attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function main() {
  await syncWithRetry();

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@easysport.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123';

  const [admin] = await User.findOrCreate({
    where: { email: adminEmail },
    defaults: {
      name: 'Администратор',
      password: await bcrypt.hash(adminPassword, 12),
      role: 'admin',
    },
  });

  const [client] = await User.findOrCreate({
    where: { email: 'user@easysport.local' },
    defaults: {
      name: 'Иван Участник',
      password: await bcrypt.hash('User1234', 12),
      role: 'user',
    },
  });

  if (await Venue.count() === 0) {
    const venues = await Venue.bulkCreate([
      {
        title: 'Футбольное поле «Олимпиец»',
        sport: 'football', address: 'ул. Спортивная, 12', city: 'Киев',
        pricePerHour: 450, description: 'Открытое поле с искусственным покрытием и раздевалками.',
        photoUrl: 'https://placehold.co/800x400?text=Football',
      },
      {
        title: 'Теннисный корт №3',
        sport: 'tennis', address: 'пр-т Мира, 45', city: 'Киев',
        pricePerHour: 320, description: 'Хардовый корт под открытым небом, освещение до 23:00.',
        photoUrl: 'https://placehold.co/800x400?text=Tennis',
      },
      {
        title: 'Баскетбольная площадка «Динамо»',
        sport: 'basketball', address: 'ул. Гагарина, 8', city: 'Львов',
        pricePerHour: 280, description: 'Крытая площадка с профессиональным паркетом и трибунами.',
        photoUrl: 'https://placehold.co/800x400?text=Basketball',
      },
      {
        title: 'Волейбольная площадка «Парк»',
        sport: 'volleyball', address: 'ул. Парковая, 3', city: 'Харьков',
        pricePerHour: 220, description: 'Песчаная площадка в парке, рядом раздевалка и душ.',
        photoUrl: 'https://placehold.co/800x400?text=Volleyball',
      },
      {
        title: 'Зал фитнеса «Пульс»',
        sport: 'fitness', address: 'ул. Центральная, 21', city: 'Одесса',
        pricePerHour: 500, description: 'Современный зал с тренажёрами, ковриками и тренером.',
        photoUrl: 'https://placehold.co/800x400?text=Fitness',
      },
      {
        title: 'Бадминтон-корт «Спартак»',
        sport: 'badminton', address: 'ул. Молодёжная, 7', city: 'Киев',
        pricePerHour: 180, description: 'Два корта в спортивном зале, инвентарь выдаётся на стойке.',
        photoUrl: 'https://placehold.co/800x400?text=Badminton',
      },
    ]);

    await Booking.bulkCreate([
      {
        venueId: venues[1].id, userId: client.id, date: dateInDays(1),
        startTime: '18:00', endTime: '19:30', status: 'confirmed',
        comment: 'Тренировка с тренером',
      },
      {
        venueId: venues[0].id, userId: admin.id, date: dateInDays(2),
        startTime: '10:00', endTime: '12:00', status: 'confirmed',
        comment: 'Матч команды',
      },
      {
        venueId: venues[2].id, userId: client.id, date: dateInDays(3),
        startTime: '09:00', endTime: '10:00', status: 'cancelled',
        comment: 'Перенос по просьбе клиента',
      },
    ]);

    console.log('Тестовые площадки и брони созданы.');
  } else {
    console.log('Площадки уже есть — демонстрационные данные не дублируются.');
  }

  console.log(`Администратор: ${adminEmail} / ${adminPassword}`);
  console.log('Пользователь: user@easysport.local / User1234');

  await sequelize.close();
}

main().catch(async (error) => {
  console.error('Ошибка заполнения БД:', error);
  await sequelize.close().catch(() => {});
  process.exit(1);
});
