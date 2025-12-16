#!/usr/bin/env python3
"""
FinTracker Launcher
Универсальный скрипт запуска для всех платформ
"""

import http.server
import socketserver
import webbrowser
import socket
import os
import sys
import time
from pathlib import Path

# ANSI цвета для красивого вывода
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_banner():
    """Печать красивого баннера"""
    banner = f"""
{Colors.CYAN}{Colors.BOLD}
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║              💰 FinTracker - Запуск сервера              ║
║                                                          ║
║            Современный учет личных финансов              ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
{Colors.END}
    """
    print(banner)

def find_free_port(start_port=8000, max_tries=10):
    """Находит свободный порт начиная с start_port"""
    for port in range(start_port, start_port + max_tries):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('', port))
                return port
        except OSError:
            continue
    return None

def check_index_exists():
    """Проверяет наличие index.html"""
    return Path('index.html').exists()

def get_local_ip():
    """Получает локальный IP адрес"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Кастомный обработчик с улучшенным логированием"""

    def log_message(self, format, *args):
        """Переопределяем логирование для красивого вывода"""
        msg = format % args
        if "GET" in msg or "POST" in msg:
            if "200" in msg:
                print(f"{Colors.GREEN}✓{Colors.END} {msg}")
            elif "404" in msg:
                print(f"{Colors.RED}✗{Colors.END} {msg}")
            else:
                print(f"{Colors.YELLOW}→{Colors.END} {msg}")

def start_server(port):
    """Запускает HTTP сервер"""
    try:
        handler = CustomHTTPRequestHandler

        # Отключаем буферизацию для мгновенного вывода
        handler.protocol_version = "HTTP/1.0"

        with socketserver.TCPServer(("", port), handler) as httpd:
            local_ip = get_local_ip()

            print(f"\n{Colors.GREEN}{Colors.BOLD}✓ Сервер успешно запущен!{Colors.END}\n")
            print(f"{Colors.BOLD}Локальный доступ:{Colors.END}")
            print(f"  {Colors.CYAN}→ http://localhost:{port}{Colors.END}")
            print(f"  {Colors.CYAN}→ http://127.0.0.1:{port}{Colors.END}")
            print(f"\n{Colors.BOLD}Доступ из сети:{Colors.END}")
            print(f"  {Colors.CYAN}→ http://{local_ip}:{port}{Colors.END}")
            print(f"\n{Colors.YELLOW}Нажмите Ctrl+C для остановки сервера{Colors.END}\n")
            print(f"{Colors.BOLD}{'─' * 60}{Colors.END}\n")

            # Открываем браузер
            time.sleep(0.5)
            url = f"http://localhost:{port}"
            print(f"{Colors.BLUE}🌐 Открываю браузер...{Colors.END}\n")
            webbrowser.open(url)

            # Запускаем сервер
            httpd.serve_forever()

    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}⚠ Получен сигнал остановки...{Colors.END}")
        print(f"{Colors.GREEN}✓ Сервер остановлен{Colors.END}")
        print(f"\n{Colors.CYAN}Спасибо за использование FinTracker! 👋{Colors.END}\n")
        sys.exit(0)
    except Exception as e:
        print(f"\n{Colors.RED}✗ Ошибка: {e}{Colors.END}\n")
        sys.exit(1)

def main():
    """Главная функция"""
    # Печатаем баннер
    print_banner()

    # Проверяем наличие файлов
    print(f"{Colors.BOLD}Проверка файлов...{Colors.END}")
    if not check_index_exists():
        print(f"{Colors.RED}✗ Ошибка: index.html не найден!{Colors.END}")
        print(f"{Colors.YELLOW}  Убедитесь, что вы запускаете скрипт из корневой папки проекта{Colors.END}\n")
        sys.exit(1)
    print(f"{Colors.GREEN}✓ Все файлы на месте{Colors.END}\n")

    # Находим свободный порт
    print(f"{Colors.BOLD}Поиск свободного порта...{Colors.END}")
    port = find_free_port()
    if not port:
        print(f"{Colors.RED}✗ Не удалось найти свободный порт!{Colors.END}\n")
        sys.exit(1)
    print(f"{Colors.GREEN}✓ Порт {port} доступен{Colors.END}")

    # Запускаем сервер
    start_server(port)

if __name__ == "__main__":
    # Проверяем версию Python
    if sys.version_info < (3, 6):
        print(f"{Colors.RED}✗ Требуется Python 3.6 или выше!{Colors.END}")
        print(f"{Colors.YELLOW}  Текущая версия: {sys.version}{Colors.END}\n")
        sys.exit(1)

    main()
