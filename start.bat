@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: FinTracker Launcher для Windows
:: Автоматический запуск приложения

title FinTracker - Запуск сервера

:: Баннер
echo.
echo ╔══════════════════════════════════════════════════════════╗
echo ║                                                          ║
echo ║              💰 FinTracker - Запуск сервера              ║
echo ║                                                          ║
echo ║            Современный учет личных финансов              ║
echo ║                                                          ║
echo ╚══════════════════════════════════════════════════════════╝
echo.

:: Проверка наличия index.html
echo Проверка файлов...
if not exist "index.html" (
    echo [✗] Ошибка: index.html не найден!
    echo     Убедитесь, что вы запускаете скрипт из корневой папки проекта
    echo.
    pause
    exit /b 1
)
echo [✓] Все файлы на месте
echo.

:: Поиск свободного порта
echo Поиск свободного порта...
set PORT=8000
set /a MAX_PORT=8010
set FOUND=0

:find_port_loop
if !PORT! geq !MAX_PORT! goto port_not_found

netstat -ano | findstr ":!PORT! " >nul 2>&1
if errorlevel 1 (
    set FOUND=1
    goto port_found
)

set /a PORT+=1
goto find_port_loop

:port_not_found
echo [✗] Не удалось найти свободный порт!
echo.
pause
exit /b 1

:port_found
echo [✓] Порт !PORT! доступен
echo.

:: Получение локального IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4"') do (
    set IP=%%a
    set IP=!IP:~1!
    goto ip_found
)
set IP=127.0.0.1

:ip_found

:: Информация о запуске
echo.
echo [✓] Сервер успешно запущен!
echo.
echo Локальный доступ:
echo   → http://localhost:!PORT!
echo   → http://127.0.0.1:!PORT!
echo.
echo Доступ из сети:
echo   → http://!IP!:!PORT!
echo.
echo Нажмите Ctrl+C для остановки сервера
echo.
echo ────────────────────────────────────────────────────────────
echo.

:: Открываем браузер
echo 🌐 Открываю браузер...
echo.
start http://localhost:!PORT!

:: Запуск сервера
echo Запуск HTTP сервера...
echo.

:: Проверяем наличие Python
python --version >nul 2>&1
if errorlevel 1 (
    py --version >nul 2>&1
    if errorlevel 1 (
        echo [✗] Python не найден!
        echo     Скачайте и установите Python с https://www.python.org/downloads/
        echo     Или используйте альтернативный метод запуска
        echo.
        pause
        exit /b 1
    ) else (
        py -m http.server !PORT!
    )
) else (
    python -m http.server !PORT!
)

:: Обработка выхода
echo.
echo.
echo [⚠] Получен сигнал остановки...
echo [✓] Сервер остановлен
echo.
echo Спасибо за использование FinTracker! 👋
echo.
pause
