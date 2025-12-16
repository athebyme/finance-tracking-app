#!/bin/bash

# FinTracker Docker Launcher
# Автоматический запуск через Docker

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

print_banner() {
    echo -e "${CYAN}${BOLD}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                                                          ║"
    echo "║           💰 FinTracker - Docker Launcher                ║"
    echo "║                                                          ║"
    echo "║            Запуск через Docker Compose                   ║"
    echo "║                                                          ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}\n"
}

check_docker() {
    echo -e "${BOLD}Проверка Docker...${NC}"

    if ! command -v docker &> /dev/null; then
        echo -e "${RED}✗ Docker не установлен!${NC}"
        echo -e "${YELLOW}  Установите Docker: https://docs.docker.com/get-docker/${NC}\n"
        exit 1
    fi

    if ! docker info &> /dev/null; then
        echo -e "${RED}✗ Docker daemon не запущен!${NC}"
        echo -e "${YELLOW}  Запустите Docker Desktop или Docker service${NC}\n"
        exit 1
    fi

    echo -e "${GREEN}✓ Docker готов к работе${NC}"

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${YELLOW}⚠ Docker Compose не найден, используем встроенный${NC}"
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi

    echo -e "${GREEN}✓ Docker Compose доступен${NC}\n"
}

open_browser() {
    local url=$1
    sleep 2

    if [[ "$OSTYPE" == "darwin"* ]]; then
        open "$url"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v xdg-open &> /dev/null; then
            xdg-open "$url"
        fi
    fi
}

start_container() {
    echo -e "${BOLD}Сборка и запуск контейнера...${NC}"
    echo -e "${BLUE}→ Это может занять несколько секунд при первом запуске${NC}\n"

    # Останавливаем старые контейнеры
    $COMPOSE_CMD down 2>/dev/null

    # Собираем и запускаем
    if $COMPOSE_CMD up -d --build; then
        echo -e "\n${GREEN}${BOLD}✓ Контейнер успешно запущен!${NC}\n"

        # Ждем пока контейнер станет healthy
        echo -e "${BOLD}Ожидание готовности...${NC}"
        sleep 3

        # Информация о запуске
        echo -e "\n${GREEN}${BOLD}✓ Приложение готово к работе!${NC}\n"
        echo -e "${BOLD}Доступ к приложению:${NC}"
        echo -e "  ${CYAN}→ http://localhost:8080${NC}"
        echo -e "  ${CYAN}→ http://127.0.0.1:8080${NC}\n"

        echo -e "${BOLD}Управление:${NC}"
        echo -e "  ${YELLOW}→ docker-compose logs -f${NC}     # Просмотр логов"
        echo -e "  ${YELLOW}→ docker-compose down${NC}        # Остановить"
        echo -e "  ${YELLOW}→ docker-compose restart${NC}     # Перезапустить\n"

        echo -e "${BOLD}────────────────────────────────────────────────────────────${NC}\n"

        # Открываем браузер
        echo -e "${BLUE}🌐 Открываю браузер...${NC}\n"
        open_browser "http://localhost:8080" &

        # Показываем логи
        echo -e "${BOLD}Логи контейнера (Ctrl+C для выхода):${NC}\n"
        $COMPOSE_CMD logs -f

    else
        echo -e "\n${RED}✗ Ошибка при запуске контейнера${NC}\n"
        exit 1
    fi
}

stop_container() {
    echo -e "\n\n${YELLOW}⚠ Остановка контейнера...${NC}"
    $COMPOSE_CMD down
    echo -e "${GREEN}✓ Контейнер остановлен${NC}"
    echo -e "\n${CYAN}Спасибо за использование FinTracker! 👋${NC}\n"
    exit 0
}

main() {
    print_banner
    check_docker
    start_container
}

# Обработка Ctrl+C
trap stop_container INT

# Запуск
main
