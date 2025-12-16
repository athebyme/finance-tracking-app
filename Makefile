.PHONY: help start stop clean docker-build docker-up docker-down docker-logs docker-restart install

# Цвета для вывода
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m

# По умолчанию показываем help
.DEFAULT_GOAL := help

help: ## Показать это сообщение помощи
	@echo "$(BLUE)╔══════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║                                                          ║$(NC)"
	@echo "$(BLUE)║              💰 FinTracker - Команды Make                ║$(NC)"
	@echo "$(BLUE)║                                                          ║$(NC)"
	@echo "$(BLUE)╚══════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(GREEN)Доступные команды:$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

start: ## Запустить приложение локально (Python)
	@echo "$(GREEN)🚀 Запуск FinTracker...$(NC)"
	@python3 start.py || python start.py

serve: ## Запустить с помощью npx serve
	@echo "$(GREEN)🚀 Запуск через npx serve...$(NC)"
	@npx serve -l 8000 -s .

install: ## Установить npm зависимости
	@echo "$(GREEN)📦 Установка зависимостей...$(NC)"
	@npm install

# Docker команды
docker-build: ## Собрать Docker образ
	@echo "$(GREEN)🐳 Сборка Docker образа...$(NC)"
	@docker-compose build

docker-up: ## Запустить Docker контейнер
	@echo "$(GREEN)🐳 Запуск Docker контейнера...$(NC)"
	@docker-compose up -d
	@echo "$(GREEN)✓ Контейнер запущен на http://localhost:8080$(NC)"

docker-down: ## Остановить Docker контейнер
	@echo "$(YELLOW)⏹️  Остановка Docker контейнера...$(NC)"
	@docker-compose down
	@echo "$(GREEN)✓ Контейнер остановлен$(NC)"

docker-logs: ## Показать логи Docker контейнера
	@docker-compose logs -f

docker-restart: ## Перезапустить Docker контейнер
	@echo "$(YELLOW)🔄 Перезапуск Docker контейнера...$(NC)"
	@docker-compose restart
	@echo "$(GREEN)✓ Контейнер перезапущен$(NC)"

docker-start: ## Запустить через docker-run.sh скрипт
	@bash docker-run.sh

docker-clean: ## Удалить Docker образы и контейнеры
	@echo "$(YELLOW)🧹 Очистка Docker...$(NC)"
	@docker-compose down -v --rmi all
	@echo "$(GREEN)✓ Очистка завершена$(NC)"

clean: ## Очистить временные файлы
	@echo "$(YELLOW)🧹 Очистка временных файлов...$(NC)"
	@find . -type f -name "*.pyc" -delete
	@find . -type d -name "__pycache__" -delete
	@find . -type f -name ".DS_Store" -delete
	@rm -rf node_modules package-lock.json
	@echo "$(GREEN)✓ Очистка завершена$(NC)"

status: ## Проверить статус Docker контейнера
	@echo "$(BLUE)📊 Статус контейнера:$(NC)"
	@docker-compose ps

# Быстрые команды
up: docker-up ## Alias для docker-up
down: docker-down ## Alias для docker-down
logs: docker-logs ## Alias для docker-logs
restart: docker-restart ## Alias для docker-restart
