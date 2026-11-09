const API_URL = 'http://127.0.0.1:8000';

// Элементы DOM
const totalCostEl = document.getElementById('totalCost');
const orderListEl = document.getElementById('orderList');
const orderEmptyEl = document.getElementById('orderEmpty');
const messageBox = document.getElementById('message');

// Вспомогательная функция для отображения сообщений
function showMessage(text, isError = false) {
    messageBox.textContent = text;
    messageBox.className = 'status-message';
    messageBox.classList.toggle('error', isError);
    messageBox.classList.toggle('success', !isError);
    messageBox.style.display = 'block';
    setTimeout(() => messageBox.style.display = 'none', 3000);
}

// Функция генерации отчета
function generateReport(tools) {
    // 1. Общая стоимость
    let totalCost = 0;
    tools.forEach(tool => {
        const qty = tool.Kol || 0;
        const price = tool.price_per_unit || 0;
        totalCost += qty * price;
    });
    totalCostEl.textContent = totalCost.toLocaleString('ru-RU', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + ' ₽';

    // 2. Список для заказа (строго Kol < 1)
    // Фильтруем только те позиции, где количество 0 или меньше.
    // parseInt нужен на случай, если сервер пришлет число как строку "0".
    const toOrder = tools.filter(tool => parseInt(tool.Kol, 10) < 1);

    orderListEl.innerHTML = '';
    if (toOrder.length === 0) {
        orderEmptyEl.style.display = 'block';
    } else {
        orderEmptyEl.style.display = 'none';
        toOrder.forEach(tool => {
            const li = document.createElement('li');
            li.className = 'order-item';
            li.style.cursor = 'pointer';

            li.innerHTML = `
                <span class="name" style="display: flex; align-items: center; gap: 8px;">
                    ${tool.Name} (D: ${tool.D})
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0.6;">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                </span>
                <span class="qty">Ост: ${parseInt(tool.Kol, 10)}</span>
            `;

            li.onclick = function() {
                const toolId = tool.id || tool.ID;
                if (toolId) {
                    // Переход в текущей вкладке
                    window.location.href = `view.html?id=${toolId}`;
                }
            };

        orderListEl.appendChild(li);
        });
    }
}

// Загрузка данных с обработкой сетевых ошибок
async function loadReport() {
    try {
        showMessage('Загрузка данных отчета...');

        const response = await fetch(`${API_URL}/tools/`);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ошибка сервера (${response.status})`);
        }

        const tools = await response.json();
        generateReport(tools);
        showMessage('Отчет успешно сформирован');

    } catch (error) {
        // Если API недоступно, выводим заглушку
        showMessage('Ошибка при загрузке данных отчета', true);
        generateReport([]);
    }
}

document.addEventListener('DOMContentLoaded', loadReport);