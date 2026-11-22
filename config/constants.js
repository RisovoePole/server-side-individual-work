const SPORTS = [
  { value: 'football', label: 'Футбол' },
  { value: 'tennis', label: 'Теннис' },
  { value: 'basketball', label: 'Баскетбол' },
  { value: 'volleyball', label: 'Волейбол' },
  { value: 'fitness', label: 'Фитнес' },
  { value: 'badminton', label: 'Бадминтон' },
];

const BOOKING_STATUSES = [
  { value: 'confirmed', label: 'Подтверждена' },
  { value: 'cancelled', label: 'Отменена' },
];

const SORT_FIELDS = [
  { value: 'title', label: 'Название' },
  { value: 'pricePerHour', label: 'Цена за час' },
  { value: 'city', label: 'Город' },
];

const labelFor = (list, value) => list.find((item) => item.value === value)?.label || value || '—';

module.exports = { SPORTS, BOOKING_STATUSES, SORT_FIELDS, labelFor };
