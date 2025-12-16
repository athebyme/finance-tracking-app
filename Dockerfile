# FinTracker Docker Image
# Легковесный контейнер на базе nginx для статических файлов

# Используем официальный nginx alpine образ (минимальный размер)
FROM nginx:alpine

# Метаданные
LABEL maintainer="FinTracker Team"
LABEL description="Modern finance tracking web application"
LABEL version="1.0.0"

# Устанавливаем рабочую директорию
WORKDIR /usr/share/nginx/html

# Удаляем дефолтные файлы nginx
RUN rm -rf /usr/share/nginx/html/*

# Копируем файлы приложения
COPY index.html .
COPY styles.css .
COPY app.js .
COPY README.md .

# Создаем кастомную конфигурацию nginx
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Включаем gzip сжатие \
    gzip on; \
    gzip_vary on; \
    gzip_min_length 1024; \
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json; \
    \
    # Кэширование статических файлов \
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    \
    # Основная локация \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # Отключаем логирование для healthcheck \
    location /health { \
        access_log off; \
        return 200 "OK"; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Открываем порт 80
EXPOSE 80

# Добавляем healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]
