# Этап 1: Сборка приложения
FROM golang:1.24-alpine AS builder

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Копируем файлы зависимостей и загружаем их
# Это кэширует зависимости, ускоряя последующие сборки
COPY go.mod go.sum ./
RUN go mod download

# Копируем остальной исходный код
COPY . .

# Собираем приложение в статичный бинарный файл
# CGO_ENABLED=0 делает сборку независимой от системных библиотек
# -o /app/main указывает, куда положить собранный файл
RUN CGO_ENABLED=0 go build -o /app/main .

# Этап 2: Создание минимального образа для запуска
FROM alpine:latest

WORKDIR /app

# Установка зависимостей для migrate
RUN apk add --no-cache curl

# Загрузка и установка migrate
RUN curl -L https://github.com/golang-migrate/migrate/releases/download/v4.17.1/migrate.linux-amd64.tar.gz | tar xvz
RUN mv migrate /app/migrate
RUN chmod +x /app/migrate

# Копируем собранный бинарный файл из этапа сборки
COPY --from=builder /app/main .

# Копируем файлы миграций
COPY ./db/migration ./migration

# Копируем и делаем исполняемым entrypoint скрипт
COPY ./entrypoint.sh .
RUN chmod +x ./entrypoint.sh

EXPOSE 8080

# Устанавливаем entrypoint
ENTRYPOINT ["./entrypoint.sh"]

# Команда по умолчанию для entrypoint
CMD ["./main"]