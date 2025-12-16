#!/bin/bash

# FinTracker Launcher для Linux/macOS
# Автоматический запуск приложения

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Функция печати баннера
print_banner() {
    echo -e "${CYAN}${BOLD}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                                                          ║"
    echo "║              💰 FinTracker - Запуск сервера              ║"
    echo "║                                                          ║"
    echo "║            Современный учет личных финансов              ║"
    echo "║                                                          ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}\n"
}

# Функция поиска свободного порта
find_free_port() {
    local port=8000
    local max_port=8010

    while [ $port -le $max_port ]; do
        if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo $port
            return 0
        fi
        port=$((port + 1))
    done

    echo ""
    return 1
}

# Функция получения локального IP
get_local_ip() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1"
    else
        # Linux
        hostname -I | awk '{print $1}' 2>/dev/null || echo "127.0.0.1"
    fi
}

# Функция открытия браузера
open_browser() {
    local url=$1
    sleep 1

    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open "$url"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v xdg-open &> /dev/null; then
            xdg-open "$url"
        elif command -v gnome-open &> /dev/null; then
            gnome-open "$url"
        fi
    fi
}

# Главная функция
main() {
    # Печатаем баннер
    print_banner

    # Проверяем наличие index.html
    echo -e "${BOLD}Проверка файлов...${NC}"
    if [ ! -f "index.html" ]; then
        echo -e "${RED}✗ Ошибка: index.html не найден!${NC}"
        echo -e "${YELLOW}  Убедитесь, что вы запускаете скрипт из корневой папки проекта${NC}\n"
        exit 1
    fi
    echo -e "${GREEN}✓ Все файлы на месте${NC}\n"

    # Находим свободный порт
    echo -e "${BOLD}Поиск свободного порта...${NC}"
    PORT=$(find_free_port)

    if [ -z "$PORT" ]; then
        echo -e "${RED}✗ Не удалось найти свободный порт!${NC}\n"
        exit 1
    fi
    echo -e "${GREEN}✓ Порт $PORT доступен${NC}\n"

    # Получаем локальный IP
    LOCAL_IP=$(get_local_ip)

    # Выводим информацию
    echo -e "${GREEN}${BOLD}✓ Сервер успешно запущен!${NC}\n"
    echo -e "${BOLD}Локальный доступ:${NC}"
    echo -e "  ${CYAN}→ http://localhost:$PORT${NC}"
    echo -e "  ${CYAN}→ http://127.0.0.1:$PORT${NC}"
    echo -e "\n${BOLD}Доступ из сети:${NC}"
    echo -e "  ${CYAN}→ http://$LOCAL_IP:$PORT${NC}"
    echo -e "\n${YELLOW}Нажмите Ctrl+C для остановки сервера${NC}\n"
    echo -e "${BOLD}────────────────────────────────────────────────────────────${NC}\n"

    # Открываем браузер
    echo -e "${BLUE}🌐 Открываю браузер...${NC}\n"
    open_browser "http://localhost:$PORT" &

    # Запускаем сервер
    # Пробуем разные варианты
    if command -v python3 &> /dev/null; then
        python3 -m http.server $PORT
    elif command -v python &> /dev/null; then
        python -m http.server $PORT
    else
        echo -e "${RED}✗ Python не найден!${NC}"
        echo -e "${YELLOW}  Установите Python 3 или используйте start.py${NC}\n"
        exit 1
    fi
}

# Обработка Ctrl+C
trap ctrl_c INT

ctrl_c() {
    echo -e "\n\n${YELLOW}⚠ Получен сигнал остановки...${NC}"
    echo -e "${GREEN}✓ Сервер остановлен${NC}"
    echo -e "\n${CYAN}Спасибо за использование FinTracker! 👋${NC}\n"
    exit 0
}

# Запуск
main
