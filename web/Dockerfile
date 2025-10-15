# Этап 1: Сборка React-приложения
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем файлы package.json и устанавливаем зависимости
COPY package.json package-lock.json ./
RUN npm install

# Копируем остальной код приложения
COPY . .

# Собираем приложение для продакшена
RUN npm run build

# Этап 2: Сервировка статичных файлов с помощью Nginx
FROM nginx:stable-alpine

# Копируем собранные файлы из этапа сборки в папку Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем нашу кастомную конфигурацию Nginx
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

# Открываем порт 80, который Nginx слушает по умолчанию
EXPOSE 80

# Nginx запустится автоматически при старте контейнера
