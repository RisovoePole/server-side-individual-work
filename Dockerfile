FROM node:22-bookworm-slim

WORKDIR /app

# Инструменты сборки нужны на случай, если для bcrypt нет готового бинарника.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

RUN mkdir -p logs && chown -R node:node /app/logs
USER node

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "app.js"]
