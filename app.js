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
// Initialize App
// ===============================================

document.addEventListener('DOMContentLoaded', init);
