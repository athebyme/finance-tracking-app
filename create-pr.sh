#!/bin/bash

# Скрипт для создания Pull Request

# Цвета
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}${BOLD}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║           💰 FinTracker - Создание Pull Request          ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Информация о PR
echo -e "${BOLD}Информация о Pull Request:${NC}\n"
echo -e "${YELLOW}From:${NC} claude/finance-tracker-website-X3IC4"
echo -e "${YELLOW}To:${NC}   main"
echo -e "${YELLOW}Repo:${NC} athebyme/finance-tracking-app\n"

# URL для создания PR
PR_URL="https://github.com/athebyme/finance-tracking-app/compare/main...claude/finance-tracker-website-X3IC4"

echo -e "${BOLD}Создать Pull Request:${NC}\n"
echo -e "${GREEN}1. Автоматически (откроется браузер):${NC}"
echo -e "   Нажмите Enter для открытия браузера...\n"

read -p ""

# Открываем браузер
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "$PR_URL"
    echo -e "${GREEN}✓ Браузер открыт!${NC}\n"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v xdg-open &> /dev/null; then
        xdg-open "$PR_URL"
        echo -e "${GREEN}✓ Браузер открыт!${NC}\n"
    elif command -v gnome-open &> /dev/null; then
        gnome-open "$PR_URL"
        echo -e "${GREEN}✓ Браузер открыт!${NC}\n"
    else
        echo -e "${YELLOW}⚠ Не удалось открыть браузер автоматически${NC}"
        echo -e "${GREEN}Скопируйте эту ссылку:${NC}"
        echo -e "${CYAN}$PR_URL${NC}\n"
    fi
else
    echo -e "${YELLOW}⚠ Не удалось открыть браузер автоматически${NC}"
    echo -e "${GREEN}Скопируйте эту ссылку:${NC}"
    echo -e "${CYAN}$PR_URL${NC}\n"
fi

echo -e "${BOLD}Или скопируйте вручную:${NC}"
echo -e "${CYAN}$PR_URL${NC}\n"

echo -e "${GREEN}${BOLD}📝 Информация для PR находится в файле:${NC}"
echo -e "${CYAN}PULL_REQUEST.md${NC}\n"

echo -e "${YELLOW}Совет:${NC} Используйте содержимое PULL_REQUEST.md для заполнения описания PR\n"
