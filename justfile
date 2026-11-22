set shell := ["bash", "-uc"]

default:
    @just --list

# Создать .env из безопасного примера (если файла ещё нет)
setup:
    @if [ ! -f .env ]; then cp .env.example .env; echo "Создан .env из .env.example — при необходимости измените значения"; fi

# Установить зависимости локально
install:
    npm install

# Запустить приложение локально (нужны PostgreSQL и .env)
dev:
    node app.js

# Собрать и поднять PostgreSQL + приложение в контейнерах
up: setup
    docker compose up --build -d

# Остановить контейнеры
down:
    docker compose down

# Полностью удалить контейнеры и данные БД
reset:
    docker compose down -v

# Логи приложения в реальном времени
logs:
    docker compose logs -f app

# Логи запросов (Morgan) из контейнера
access-log:
    docker compose exec app tail -f logs/access.log

# Заполнить БД тестовыми данными (локальный режим)
seed:
    node scripts/seed.js

# Заполнить БД тестовыми данными внутри контейнера
seed-docker:
    docker compose exec app node scripts/seed.js

# Проверить HTTP-маршруты, роли, валидацию и CRUD
test:
    docker compose exec app node scripts/smoke-test.js

# Проверить Socket.IO-уведомление в двух одновременных клиентах
test-socket:
    docker compose exec app node scripts/verify-socket.js

# Все проверки (приложение должно быть запущено)
check:
    just test
    just test-socket

# Подключиться к PostgreSQL в контейнере
psql:
    docker compose exec db psql -U "${DB_USER:-postgres}" -d "${DB_NAME:-travel_db}"
