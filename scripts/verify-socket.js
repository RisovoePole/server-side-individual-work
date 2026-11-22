// Проверка Socket.IO: два одновременных клиента должны получить уведомление об новой площадке.
require('dotenv').config();

const { io } = require('socket.io-client');

const BASE = process.env.APP_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@easysport.local';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Администратор';

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Таймаут: ${label}`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function login() {
  const response = await fetch(`${BASE}/login`, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  if (response.status !== 302) {
    throw new Error(`Не удалось войти администратором: status ${response.status}`);
  }

  const setCookie = response.headers.get('set-cookie') || '';
  const session = setCookie.split(',').map((item) => item.trim()).find((item) => item.startsWith('travel.sid='));
  if (!session) throw new Error('Сервер не вернул сессионную cookie');

  return session.split(';')[0];
}

async function createVenue(cookie, title) {
  const response = await fetch(`${BASE}/venues`, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: cookie,
    },
    body: new URLSearchParams({
      title,
      sport: 'football',
      address: 'ул. Тестовая Socket, 1',
      city: 'Киев',
      pricePerHour: '199',
      description: 'Площадка создана для проверки уведомлений в реальном времени.',
      photoUrl: '',
    }),
  });

  const location = response.headers.get('location') || '';
  const id = Number(location.split('/').pop());
  if (response.status !== 302 || !Number.isInteger(id)) {
    throw new Error(`Не удалось создать площадку: status ${response.status}, location ${location}`);
  }
  return id;
}

async function deleteVenue(cookie, id) {
  await fetch(`${BASE}/venues/${id}/delete`, {
    method: 'POST',
    redirect: 'manual',
    headers: { Cookie: cookie },
  });
}

function waitForNotification(socket, expectedTitle) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Уведомление не получено за 7 секунд')), 7000);

    function handler(data) {
      if (data.title !== expectedTitle) return;
      clearTimeout(timer);
      socket.off('venue:created', handler);
      resolve(data);
    }

    socket.on('venue:created', handler);
  });
}

async function main() {
  const title = `Socket Check ${Date.now()}`;
  const cookie = await login();
  const first = io(BASE, { transports: ['websocket'], forceNew: true });
  const second = io(BASE, { transports: ['websocket'], forceNew: true });
  let venueId;

  try {
    await withTimeout(Promise.all([
      new Promise((resolve) => first.once('connect', resolve)),
      new Promise((resolve) => second.once('connect', resolve)),
    ]), 7000, 'подключение двух клиентов');
    console.log('[PASS] Два клиента Socket.IO подключены одновременно');

    const expectedFirst = waitForNotification(first, title);
    const expectedSecond = waitForNotification(second, title);

    venueId = await createVenue(cookie, title);
    console.log('[PASS] Администратор создал новую площадку через HTTP');

    const [firstData, secondData] = await Promise.all([
      withTimeout(expectedFirst, 8000, 'уведомление первого клиента'),
      withTimeout(expectedSecond, 8000, 'уведомление второго клиента'),
    ]);

    for (const [index, data] of [firstData, secondData].entries()) {
      if (data.admin !== ADMIN_NAME || !data.createdAt || Number.isNaN(Date.parse(data.createdAt))) {
        throw new Error(`Некорректный состав уведомления у клиента ${index + 1}: ${JSON.stringify(data)}`);
      }
    }
    console.log('[PASS] Оба клиента получили уведомление с названием, именем администратора и датой');
    console.log(`       payload: ${JSON.stringify(firstData)}`);

    console.log('\nПроверка Socket.IO пройдена.');
  } finally {
    if (venueId) await deleteVenue(cookie, venueId);
    first.disconnect();
    second.disconnect();
  }
}

main().catch((error) => {
  console.error('[FAIL]', error.message);
  process.exit(1);
});
