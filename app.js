// ===============================================
// State Management
// ===============================================

let transactions = [];
let currentFilter = 'all';
let currentPeriod = 'month';
let chart = null;

// ===============================================
// DOM Elements
// ===============================================

const elements = {
    form: document.getElementById('transactionForm'),
    amount: document.getElementById('amount'),
    description: document.getElementById('description'),
    category: document.getElementById('category'),
    date: document.getElementById('date'),
    totalBalance: document.getElementById('totalBalance'),
    totalIncome: document.getElementById('totalIncome'),
    totalExpense: document.getElementById('totalExpense'),
    transactionsList: document.getElementById('transactionsList'),
    themeToggle: document.getElementById('themeToggle'),
    filterButtons: document.querySelectorAll('.filter-btn'),
    periodButtons: document.querySelectorAll('.period-btn'),
    expenseChart: document.getElementById('expenseChart')
};

// ===============================================
// Initialization
// ===============================================

function init() {
    loadTransactions();
    loadTheme();
    setDefaultDate();
    setupEventListeners();
    updateUI();
}

// ===============================================
// Event Listeners
// ===============================================

function setupEventListeners() {
    // Form submission with type detection
    const expenseBtn = document.querySelector('.btn-expense');
    const incomeBtn = document.querySelector('.btn-income');

    expenseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (elements.form.checkValidity()) {
            addTransaction('expense');
        } else {
            elements.form.reportValidity();
        }
    });

    incomeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (elements.form.checkValidity()) {
            addTransaction('income');
        } else {
            elements.form.reportValidity();
        }
    });

    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);

    // Filter buttons
    elements.filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.filter;
            elements.filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTransactions();
        });
    });

    // Period buttons
    elements.periodButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            currentPeriod = btn.dataset.period;
            elements.periodButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateStats();
        });
    });
}

// ===============================================
// Transaction Management
// ===============================================

function addTransaction(type) {
    const transaction = {
        id: generateId(),
        type: type,
        amount: parseFloat(elements.amount.value),
        description: elements.description.value.trim(),
        category: elements.category.value,
        date: elements.date.value,
        timestamp: new Date().getTime()
    };

    transactions.unshift(transaction);
    saveTransactions();
    updateUI();
    elements.form.reset();
    setDefaultDate();

    // Animate the new transaction
    setTimeout(() => {
        const firstItem = elements.transactionsList.querySelector('.transaction-item');
        if (firstItem) {
            firstItem.style.animation = 'none';
            setTimeout(() => {
                firstItem.style.animation = '';
            }, 10);
        }
    }, 10);
}

function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    updateUI();
}

function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

// ===============================================
// UI Updates
// ===============================================

function updateUI() {
    updateStats();
    renderTransactions();
    updateChart();
}

function updateStats() {
    const filtered = filterByPeriod(transactions);

    const income = filtered
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const expense = filtered
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expense;

    elements.totalBalance.textContent = formatCurrency(balance);
    elements.totalIncome.textContent = formatCurrency(income);
    elements.totalExpense.textContent = formatCurrency(expense);
}

function renderTransactions() {
    const filtered = transactions.filter(t => {
        if (currentFilter === 'all') return true;
        return t.type === currentFilter;
    });

    if (filtered.length === 0) {
        elements.transactionsList.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <circle cx="32" cy="32" r="32" fill="var(--bg-secondary)"/>
                    <path d="M32 20v24M20 32h24" stroke="var(--text-tertiary)" stroke-width="3" stroke-linecap="round"/>
                </svg>
                <p>Нет транзакций</p>
                <span>Добавьте первую транзакцию выше</span>
            </div>
        `;
        return;
    }

    const html = filtered.map(t => `
        <div class="transaction-item ${t.type}">
            <div class="transaction-info">
                <div class="transaction-icon">
                    ${getCategoryIcon(t.category)}
                </div>
                <div class="transaction-details">
                    <div class="transaction-description">${t.description}</div>
                    <div class="transaction-category">${getCategoryName(t.category)}</div>
                </div>
            </div>
            <div class="transaction-right">
                <div class="transaction-amount">
                    ${t.type === 'income' ? '+' : '−'}${formatCurrency(t.amount)}
                </div>
                <div class="transaction-date">${formatDate(t.date)}</div>
                <button class="transaction-delete" onclick="deleteTransaction('${t.id}')" title="Удалить">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');

    elements.transactionsList.innerHTML = html;
}

// ===============================================
// Chart Management
// ===============================================

function updateChart() {
    const ctx = elements.expenseChart.getContext('2d');

    // Get expense data by category
    const expensesByCategory = {};
    const filtered = filterByPeriod(transactions.filter(t => t.type === 'expense'));

    filtered.forEach(t => {
        if (!expensesByCategory[t.category]) {
            expensesByCategory[t.category] = 0;
        }
        expensesByCategory[t.category] += t.amount;
    });

    const categories = Object.keys(expensesByCategory);
    const amounts = Object.values(expensesByCategory);

    // Destroy previous chart
    if (chart) {
        chart.destroy();
    }

    // Create new chart
    if (categories.length === 0) {
        elements.expenseChart.parentElement.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; color: var(--text-secondary);">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style="margin-bottom: 1rem;">
                    <circle cx="32" cy="32" r="30" stroke="var(--text-tertiary)" stroke-width="2"/>
                    <path d="M32 16v16l11 11" stroke="var(--text-tertiary)" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <p>Нет данных для отображения</p>
            </div>
        `;
        return;
    }

    // Restore canvas if it was replaced
    if (!elements.expenseChart.getContext) {
        elements.expenseChart.parentElement.innerHTML = '<canvas id="expenseChart"></canvas>';
        elements.expenseChart = document.getElementById('expenseChart');
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories.map(c => getCategoryName(c)),
            datasets: [{
                data: amounts,
                backgroundColor: [
                    '#667eea',
                    '#764ba2',
                    '#f093fb',
                    '#4facfe',
                    '#43e97b',
                    '#fa709a',
                    '#fee140',
                    '#30cfd0',
                    '#a8edea',
                    '#ff9a9e'
                ],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            family: "'Inter', sans-serif",
                            size: 12
                        },
                        color: isDark ? '#a0a0a0' : '#6c757d',
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
                    titleColor: isDark ? '#ffffff' : '#1a1a1a',
                    bodyColor: isDark ? '#a0a0a0' : '#6c757d',
                    borderColor: isDark ? '#2a2a2a' : '#e0e0e0',
                    borderWidth: 1,
                    padding: 12,
                    boxPadding: 6,
                    usePointStyle: true,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatCurrency(context.parsed);
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });
}

// ===============================================
// Helper Functions
// ===============================================

function filterByPeriod(transactions) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions.filter(t => {
        const transactionDate = new Date(t.date);

        if (currentPeriod === 'month') {
            return transactionDate.getMonth() === currentMonth &&
                   transactionDate.getFullYear() === currentYear;
        } else if (currentPeriod === 'year') {
            return transactionDate.getFullYear() === currentYear;
        }

        return true; // 'all'
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(Math.abs(amount));
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Вчера';
    }

    return new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }).format(date);
}

function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    elements.date.value = today;
}

function getCategoryIcon(category) {
    const icons = {
        food: '🍔',
        transport: '🚗',
        shopping: '🛍️',
        entertainment: '🎮',
        bills: '📱',
        health: '💊',
        salary: '💰',
        freelance: '💻',
        investment: '📈',
        other: '📦'
    };
    return icons[category] || '📦';
}

function getCategoryName(category) {
    const names = {
        food: 'Еда',
        transport: 'Транспорт',
        shopping: 'Покупки',
        entertainment: 'Развлечения',
        bills: 'Счета',
        health: 'Здоровье',
        salary: 'Зарплата',
        freelance: 'Фриланс',
        investment: 'Инвестиции',
        other: 'Другое'
    };
    return names[category] || 'Другое';
}

// ===============================================
// Theme Management
// ===============================================

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Update chart colors
    setTimeout(() => updateChart(), 300);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// ===============================================
// Local Storage
// ===============================================

function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function loadTransactions() {
    const saved = localStorage.getItem('transactions');
    if (saved) {
        transactions = JSON.parse(saved);
    }
}

// ===============================================
// PWA - Service Worker Registration
// ===============================================

async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js', {
                scope: '/'
            });

            console.log('[PWA] Service Worker registered successfully:', registration);

            // Обработка обновления Service Worker
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('[PWA] New Service Worker found, installing...');

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('[PWA] New Service Worker installed, update available');
                        showUpdateNotification();
                    }
                });
            });

            // Проверка обновлений каждые 60 секунд
            setInterval(() => {
                registration.update();
            }, 60000);

        } catch (error) {
            console.error('[PWA] Service Worker registration failed:', error);
        }
    } else {
        console.log('[PWA] Service Workers are not supported');
    }
}

// Показать уведомление об обновлении
function showUpdateNotification() {
    const updateBanner = document.createElement('div');
    updateBanner.className = 'update-banner';
    updateBanner.innerHTML = `
        <div class="update-banner-content">
            <span>🎉 Доступна новая версия приложения!</span>
            <button onclick="updateApp()" class="update-btn">Обновить</button>
            <button onclick="dismissUpdate()" class="dismiss-btn">Позже</button>
        </div>
    `;
    document.body.appendChild(updateBanner);

    // Добавить стили для баннера
    if (!document.getElementById('pwa-styles')) {
        const style = document.createElement('style');
        style.id = 'pwa-styles';
        style.textContent = `
            .update-banner {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 16px 24px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                z-index: 10000;
                animation: slideUp 0.3s ease-out;
                max-width: 90%;
            }

            .update-banner-content {
                display: flex;
                align-items: center;
                gap: 12px;
                flex-wrap: wrap;
            }

            .update-banner button {
                padding: 8px 16px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 500;
                font-size: 14px;
                transition: all 0.2s;
            }

            .update-btn {
                background: white;
                color: #667eea;
            }

            .update-btn:hover {
                transform: scale(1.05);
            }

            .dismiss-btn {
                background: rgba(255, 255, 255, 0.2);
                color: white;
            }

            .dismiss-btn:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            .install-banner {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: white;
                color: #1a1a1a;
                padding: 16px 24px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
                z-index: 10000;
                animation: slideDown 0.3s ease-out;
                max-width: 90%;
            }

            [data-theme="dark"] .install-banner {
                background: #1a1a1a;
                color: white;
            }

            @keyframes slideUp {
                from {
                    transform: translateX(-50%) translateY(100px);
                    opacity: 0;
                }
                to {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
            }

            @keyframes slideDown {
                from {
                    transform: translateX(-50%) translateY(-100px);
                    opacity: 0;
                }
                to {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
            }

            @media (max-width: 768px) {
                .update-banner-content {
                    flex-direction: column;
                    align-items: stretch;
                }

                .update-banner button {
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Обновить приложение
window.updateApp = function() {
    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
};

// Отклонить обновление
window.dismissUpdate = function() {
    const banner = document.querySelector('.update-banner');
    if (banner) {
        banner.remove();
    }
};

// ===============================================
// PWA - Install Prompt
// ===============================================

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Предотвратить автоматический показ промпта
    e.preventDefault();
    deferredPrompt = e;

    console.log('[PWA] Install prompt available');

    // Показать баннер установки
    showInstallBanner();
});

function showInstallBanner() {
    // Проверить, не отклонял ли пользователь установку ранее
    if (localStorage.getItem('pwa-install-dismissed')) {
        return;
    }

    const installBanner = document.createElement('div');
    installBanner.className = 'install-banner';
    installBanner.innerHTML = `
        <div class="update-banner-content">
            <span>📱 Установите FinTracker на устройство для быстрого доступа!</span>
            <button onclick="installPWA()" class="update-btn">Установить</button>
            <button onclick="dismissInstall()" class="dismiss-btn">Нет, спасибо</button>
        </div>
    `;
    document.body.appendChild(installBanner);
}

// Установить PWA
window.installPWA = async function() {
    if (!deferredPrompt) {
        return;
    }

    // Показать промпт установки
    deferredPrompt.prompt();

    // Ждем выбора пользователя
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] User choice:', outcome);

    if (outcome === 'accepted') {
        console.log('[PWA] App installed');
    } else {
        console.log('[PWA] App installation declined');
    }

    // Очистить промпт
    deferredPrompt = null;

    // Удалить баннер
    const banner = document.querySelector('.install-banner');
    if (banner) {
        banner.remove();
    }
};

// Отклонить установку
window.dismissInstall = function() {
    localStorage.setItem('pwa-install-dismissed', 'true');
    const banner = document.querySelector('.install-banner');
    if (banner) {
        banner.remove();
    }
};

// Обработка успешной установки
window.addEventListener('appinstalled', () => {
    console.log('[PWA] App successfully installed');
    deferredPrompt = null;

    // Показать уведомление об успешной установке
    const notification = document.createElement('div');
    notification.className = 'update-banner';
    notification.innerHTML = `
        <div class="update-banner-content">
            <span>✅ FinTracker успешно установлен!</span>
        </div>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
});

// ===============================================
// Initialize App
// ===============================================

document.addEventListener('DOMContentLoaded', () => {
    init();
    registerServiceWorker();
});
