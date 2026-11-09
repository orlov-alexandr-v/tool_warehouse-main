const API_URL = 'http://127.0.0.1:8000'; // Замените на ваш URL бэкенда

let debounceTimer = null;
const DEBOUNCE_DELAY = 300;

// Элементы DOM
const userSelect = document.getElementById('userSelect');
const toolSearch = document.getElementById('toolSearch');
const selectedToolId = document.getElementById('selectedToolId');
const toolSearchResults = document.getElementById('toolSearchResults');
const quantityInput = document.getElementById('quantityInput');
const issueForm = document.getElementById('issueForm');
const messageBox = document.getElementById('message');
const resetFormBtn = document.getElementById('resetFormBtn');

// Вспомогательная функция для отображения сообщений
function showMessage(text, isError = false) {
    messageBox.textContent = text;
    messageBox.className = 'status-message';
    messageBox.classList.toggle('error', isError);
    messageBox.classList.toggle('success', !isError);
    messageBox.style.display = 'block';
    setTimeout(() => messageBox.style.display = 'none', 5000);
}

// 1. Загрузка списка сотрудников
async function fetchUsers() {
    try {
        const response = await fetch(`${API_URL}/users/`);
        const users = await response.json();
        userSelect.innerHTML = '<option value="" disabled selected>Выберите сотрудника</option>';
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.name} (${user.surname || '—'})`;
            userSelect.appendChild(option);
        });
    } catch (error) {
        showMessage('Ошибка загрузки списка сотрудников', true);
        console.error('Fetch users error:', error);
    }
}

// --- Демонический поиск инструмента ---
async function searchTools(query) {
    selectedToolId.value = ''; // Сбрасываем ID при каждом новом поиске

    if (!query.trim()) {
        toolSearchResults.style.display = 'none';
        toolSearchResults.innerHTML = '';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/tools/?search_name=${encodeURIComponent(query)}`);

        if (!response.ok) {
            toolSearchResults.style.display = 'none';
            return;
        }

        const tools = await response.json();

        if (tools.length === 0) {
            toolSearchResults.innerHTML = '<div class="search-results-item" style="pointer-events: none;">Ничего не найдено</div>';
        } else {
            toolSearchResults.innerHTML = tools.map(tool => `
                <div class="search-results-item" data-id="${tool.id}" data-name="${tool.Name}" data-d="${tool.D}" data-stock="${tool.Kol}">
                    <span>${tool.Name} (D: ${tool.D})</span>
                    <span class="tool-stock">На складе: ${tool.Kol}</span>
                </div>
            `).join('');
        }
        toolSearchResults.style.display = 'block';
    } catch (error) {
        console.error('Search tools error:', error);
        toolSearchResults.style.display = 'none';
    }
}

// 1. Обработчик ввода в поле поиска
toolSearch.addEventListener('input', (event) => {
    const query = event.target.value;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => searchTools(query), DEBOUNCE_DELAY);
});

// 2. Обработчик клика по результату (ВЫБИРАЕМ ИНСТРУМЕНТ)
toolSearchResults.addEventListener('click', (event) => {
    const item = event.target.closest('.search-results-item');

    if (!item || item.style.pointerEvents === 'none') return;

    const id = item.dataset.id;
    const name = item.dataset.name;
    const d = item.dataset.d;
    const stock = parseInt(item.dataset.stock);

    toolSearch.value = `${name} (D: ${d})`;
    selectedToolId.value = id;

    // Скрываем список программно после выбора
    toolSearchResults.style.display = 'none';

    // Ограничиваем количество
    quantityInput.max = stock;
    if (parseInt(quantityInput.value) > stock) {
        quantityInput.value = stock;
    }
});

// 3. ВАЖНО: Останавливаем всплытие события (propagation) внутри списка.
// Это предотвращает закрытие списка при клике по его элементам.
toolSearchResults.addEventListener('click', (event) => {
    event.stopPropagation();
});

// 4. Скрытие при клике мимо (КЛИКАЕМ ПО СТРАНИЦЕ)
// Этот обработчик должен идти ПОСЛЕ обработчика для toolSearchResults
document.addEventListener('click', (event) => {
    // Проверяем, что клик был НЕ в поле ввода и НЕ в результатах поиска
    if (!toolSearch.contains(event.target) && !toolSearchResults.contains(event.target)) {
        toolSearchResults.style.display = 'none';
    }
});

// 3. Отправка формы выдачи
issueForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = {
    user_id: Number(userSelect.value),
    tool_id: Number(selectedToolId.value),
    quantity: Number(quantityInput.value)
    };

    // Проверка на наличие выбранного инструмента
    if (!payload.tool_id) {
        showMessage('Выберите инструмент из списка поиска.', true);
        return;
    }

    try {
        const response = await fetch(`${API_URL}/issue/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            showMessage(`Инструмент успешно выдан сотруднику ${userSelect.options[userSelect.selectedIndex].textContent}`);
            issueForm.reset();
            selectedToolId.value = '';
            quantityInput.value = 1;
            quantityInput.removeAttribute('max');
            fetchUsers(); // Обновляем данные, если бэкенд меняет доступность
        } else {
            showMessage(result.detail || 'Ошибка при выдаче инструмента', true);
        }
    } catch (error) {
        showMessage('Ошибка сети при отправке данных', true);
        console.error('Issue error:', error);
    }
});

// Сброс формы
resetFormBtn.addEventListener('click', () => {
    issueForm.reset();
    selectedToolId.value = '';
    quantityInput.value = 1;
    quantityInput.removeAttribute('max');
    toolSearchResults.style.display = 'none';
});

// Первоначальная загрузка данных
document.addEventListener('DOMContentLoaded', () => {
    fetchUsers();
});