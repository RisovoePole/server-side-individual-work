// Простая интеграционная проверка без внешних тестовых фреймворков.
require('dotenv').config();

const BASE = process.env.APP_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@easysport.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123';

const form = (values) => new URLSearchParams(values).toString();
const dateInDays = (days) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

function createClient() {
  let cookie = '';

  return {
    async request(path, options = {}) {
      const headers = { ...(options.headers || {}) };
      if (options.body && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }
      if (cookie) headers.Cookie = cookie;

      const response = await fetch(BASE + path, { ...options, headers, redirect: 'manual' });
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        const session = setCookie.split(',')
          .map((part) => part.trim())
          .find((part) => part.startsWith('travel.sid='));
        if (session) cookie = session.split(';')[0];
      }
      return response;
    },
  };
}

const passed = [];
function check(name, condition, extra = '') {
  if (!condition) throw new Error(`${name}${extra ? ` (${extra})` : ''}`);
  passed.push(name);
  console.log(`[PASS] ${name}`);
}

async function main() {
  const guest = createClient();
  const user = createClient();
  const admin = createClient();

  let response = await guest.request('/');
  check('GET / — главная страница', response.status === 200 && (await response.text()).includes('EasySportMD'));

  response = await guest.request('/venues');
  check('GET /venues — публичный список', response.status === 200 && (await response.text()).includes('Спортивные площадки'));

  response = await guest.request('/venues?q=Теннис&sport=tennis&city=Киев&sort=pricePerHour&dir=desc');
  check('GET /venues — поиск + 2 фильтра + сортировка одновременно', response.status === 200);

  response = await guest.request('/profile');
  check('GET /profile для гостя — 401', response.status === 401);

  response = await guest.request('/statistics');
  check('GET /statistics для гостя — 401', response.status === 401);

  response = await guest.request('/venues/new');
  check('GET /venues/new для гостя — 401', response.status === 401);

  response = await guest.request('/no-such-page');
  check('Неизвестный маршрут — 404', response.status === 404);

  response = await guest.request('/venues/abc');
  check('Некорректный ID — 400', response.status === 400);

  response = await guest.request('/register', {
    method: 'POST',
    body: form({ name: 'А', email: 'not-email', password: '123', confirmPassword: '456' }),
  });
  check('POST /register с некорректными данными — 400', response.status === 400);

  const email = `student${Date.now()}@example.com`;
  response = await guest.request('/register', {
    method: 'POST',
    body: form({ name: 'Студент', email, password: 'Student123', confirmPassword: 'Student123' }),
  });
  check('POST /register — успешная регистрация', response.status === 302 && response.headers.get('location') === '/login');

  response = await user.request('/login', {
    method: 'POST',
    body: form({ email, password: 'WrongPassword' }),
  });
  check('POST /login с неверным паролем — 401', response.status === 401);

  response = await user.request('/login', {
    method: 'POST',
    body: form({ email, password: 'Student123' }),
  });
  check('POST /login — успешный вход', response.status === 302);

  response = await user.request('/profile');
  const profileHtml = await response.text();
  check('Профиль отображает email и роль user', response.status === 200 && profileHtml.includes(email) && profileHtml.includes('>user<'));
  check('Профиль не показывает хэш пароля', !profileHtml.includes('$2b$'));

  response = await user.request('/statistics');
  check('GET /statistics для пользователя — 200', response.status === 200 && (await response.text()).includes('Статистика'));

  response = await user.request('/venues/new');
  check('GET /venues/new для пользователя — 403', response.status === 403);

  response = await user.request('/venues', {
    method: 'POST',
    body: form({ title: 'Вторжение', sport: 'football', address: 'ул. Тестовая, 1', city: 'Киев', pricePerHour: 10, description: 'Попытка создать площадку без прав администратора' }),
  });
  check('POST /venues для пользователя — 403', response.status === 403);

  response = await admin.request('/login', {
    method: 'POST',
    body: form({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  check('Вход администратора', response.status === 302);

  response = await admin.request('/venues/new');
  check('GET /venues/new для администратора — 200', response.status === 200);

  response = await admin.request('/venues', {
    method: 'POST',
    body: form({
      title: 'Тестовая площадка Smoke', sport: 'tennis', address: 'ул. Проверочная, 99',
      city: 'Киев', pricePerHour: 123.45,
      description: 'Площадка, созданная автоматической проверкой приложения.',
      photoUrl: 'https://example.com/photo.jpg',
    }),
  });
  const venueLocation = response.headers.get('location') || '';
  const venueId = Number(venueLocation.split('/').pop());
  check('POST /venues — создание площадки администратором', response.status === 302 && Number.isInteger(venueId), venueLocation);

  response = await admin.request(`/venues/${venueId}`);
  check('GET /venues/:id — страница созданной площадки', response.status === 200 && (await response.text()).includes('Тестовая площадка Smoke'));

  response = await admin.request(`/venues/${venueId}`, {
    method: 'POST',
    body: form({
      title: 'Тестовая площадка Smoke (обновлена)', sport: 'tennis', address: 'ул. Проверочная, 99',
      city: 'Киев', pricePerHour: 150,
      description: 'Площадка обновлена автоматической проверкой приложения.', photoUrl: '',
    }),
  });
  check('POST /venues/:id — обновление площадки', response.status === 302);

  response = await user.request('/bookings', {
    method: 'POST',
    body: form({
      venueId: String(venueId), date: dateInDays(4),
      startTime: '14:00', endTime: '15:00', comment: 'Бронь из smoke-теста',
    }),
  });
  const bookingLocation = response.headers.get('location') || '';
  const bookingId = Number(bookingLocation.split('/').pop());
  check('POST /bookings — пользователь забронировал площадку', response.status === 302 && Number.isInteger(bookingId), bookingLocation);

  response = await user.request(`/bookings/${bookingId}`);
  check('GET /bookings/:id — дочерняя страница показывает родителя', response.status === 200 && (await response.text()).includes('Тестовая площадка Smoke'));

  response = await guest.request('/bookings', { method: 'POST', body: form({ venueId: String(venueId) }) });
  check('POST /bookings для гостя — 401', response.status === 401);

  response = await admin.request('/bookings', {
    method: 'POST',
    body: form({
      venueId: String(venueId), date: dateInDays(5),
      startTime: '16:00', endTime: '17:00', status: 'confirmed', comment: 'Бронь администратора',
    }),
  });
  const adminBookingId = Number((response.headers.get('location') || '').split('/').pop());
  check('POST /bookings администратором', response.status === 302 && Number.isInteger(adminBookingId));

  response = await user.request(`/bookings/${adminBookingId}/cancel`, { method: 'POST' });
  check('Пользователь не может отменить чужую бронь — 403', response.status === 403);

  response = await admin.request(`/bookings/${adminBookingId}/cancel`, { method: 'POST' });
  check('Администратор может отменить бронь — 302', response.status === 302);

  response = await admin.request('/bookings', {
    method: 'POST',
    body: form({ venueId: '999999', date: dateInDays(6), startTime: '10:00', endTime: '11:00' }),
  });
  check('POST /bookings с несуществующим venueId — 400', response.status === 400);

  response = await admin.request(`/bookings/${bookingId}/delete`, { method: 'POST' });
  check('POST /bookings/:id/delete — удаление брони', response.status === 302);

  response = await admin.request(`/venues/${venueId}/delete`, { method: 'POST' });
  check('POST /venues/:id/delete — удаление площадки', response.status === 302);

  response = await guest.request(`/venues/${venueId}`);
  check('Удалённая площадка — 404', response.status === 404);

  console.log(`\nВсе проверки пройдены: ${passed.length}.`);
}

main().catch((error) => {
  console.error('[FAIL]', error.message);
  process.exit(1);
});
