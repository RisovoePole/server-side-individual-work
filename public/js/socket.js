// Клиент уведомлений Socket.IO: новое уведомление появляется без перезагрузки страницы.
(function () {
  if (typeof io === 'undefined') return;

  const socket = io();
  const container = document.getElementById('toast-container');
  if (!container) return;

  socket.on('venue:created', function (data) {
    const toast = document.createElement('div');
    toast.className = 'toast';

    const title = document.createElement('div');
    title.className = 'toast-title';
    title.textContent = 'Новая площадка: ' + data.title;

    const meta = document.createElement('div');
    meta.className = 'toast-meta';
    meta.textContent = 'Добавил: ' + data.admin + ' · ' + new Date(data.createdAt).toLocaleString('ru-RU');

    const close = document.createElement('button');
    close.className = 'toast-close';
    close.type = 'button';
    close.setAttribute('aria-label', 'Закрыть уведомление');
    close.textContent = '×';

    const timer = window.setTimeout(function () { toast.remove(); }, 9000);
    close.addEventListener('click', function () {
      window.clearTimeout(timer);
      toast.remove();
    });

    toast.appendChild(title);
    toast.appendChild(meta);
    toast.appendChild(close);
    container.appendChild(toast);
  });
})();
