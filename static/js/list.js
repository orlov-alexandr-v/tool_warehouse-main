const API_URL = 'http://127.0.0.1:8000';

let currentPage = 1;
let currentSearch = null;
const LIMIT = 4; // Количество элементов на странице

// Элементы DOM
const toolsList = document.getElementById('toolsList');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const messageBox = document.getElementById('message');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');
const paginationBlock = document.getElementById('pagination'); // Контейнер пагинации

// Вспомогательная функция для отображения сообщений
function showMessage(text, isError = false) {
    messageBox.textContent = text;
    messageBox.className = 'status-message';
    messageBox.classList.toggle('error', isError);
    messageBox.classList.toggle('success', !isError);
    messageBox.style.display = 'block';
    setTimeout(() => messageBox.style.display = 'none', 3000);
}

// Функция управления видимостью пагинации
function togglePaginationVisibility(show) {
    if (show) {
        paginationBlock.style.display = 'flex';
    } else {
        paginationBlock.style.display = 'none';
    }
}

// Функция получения данных с сервера
async function fetchTools(page = 1, search = null) {
    currentPage = page;
    currentSearch = search;

    let url = `${API_URL}/tools/?skip=${(page - 1) * LIMIT}&limit=${LIMIT + 1}`;
    /*
       Запрашиваем LIMIT + 1 элемент.
       Это "хак": если пришло 11 элементов (при лимите 10), значит есть следующая страница.
       11-й элемент мы не рисуем, он нужен только для логики nextBtn.
    */

    if (search) {
        const params = new URLSearchParams();
        if (search.d) params.append('search_d', search.d);
        if (search.name) params.append('search_name', search.name);
        if (search.type) params.append('search_type', search.type);
        url += `&${params.toString()}`;
    }

    try {
        const response = await fetch(url);
        const rawTools = await response.json();

        // Определяем, есть ли следующая страница
        const hasNextPage = rawTools.length > LIMIT;

        // Обрезаем массив до нужного лимита для отрисовки
        const tools = hasNextPage ? rawTools.slice(0, LIMIT) : rawTools;

        renderTools(tools, hasNextPage);

        // Показываем пагинацию только если данных больше, чем на одну страницу
        togglePaginationVisibility(tools.length > 0 && (currentPage > 1 || hasNextPage));

    } catch (error) {
        showMessage('Ошибка при загрузке инструментов', true);
        console.error('Fetch error:', error);
        togglePaginationVisibility(false); // Скрываем пагинацию при ошибке
    }
}

// Функция отрисовки списка
function renderTools(tools, hasNextPage) {
    toolsList.innerHTML = '';
    if (tools.length === 0) {
        toolsList.innerHTML = '<li style="padding: 20px; text-align: center; color: #777;">Инструменты не найдены</li>';
        return;
    }

    tools.forEach(tool => {
        const li = document.createElement('li');
        li.className = 'tool-item';

        const specs = [];
        if (tool.L) specs.push(`L: ${tool.L}`);
        if (tool.S) specs.push(`S: ${tool.S}`);
        if (tool.I) specs.push(`I: ${tool.I}`);
        if (tool.Z) specs.push(`Z: ${tool.Z}`);

        li.innerHTML = `
            <div class="tool-info">
                <h4>${tool.Name} (${tool.Type})</h4>
                <p><strong>D:</strong> ${tool.D}</p>
                <p><strong>Количество:</strong> ${tool.Kol}</p>
                <div class="tool-specs">
                    ${specs.map(s => `<span class="spec-badge">${s}</span>`).join('')}
                </div>
            </div>
            <div class="actions">
               <button class="view" onclick="viewTool(${tool.id})">Просмотр</button>
               <button class="edit" onclick="editTool(${tool.id}, ${currentPage})">Редактировать</button>
               <button class="delete" onclick="deleteTool(${tool.id})">Удалить</button>
            </div>
        `;
        toolsList.appendChild(li);
    });

    // Обновляем состояние кнопок
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = !hasNextPage;
    pageInfo.textContent = `Страница ${currentPage}`;
}

// Навигация по карточкам
function viewTool(id) {
    window.location.href = `/view.html?id=${id}`;
}
function editTool(id, page) {
    const pageNumber = parseInt(page) || 1;
    window.location.href = `/edit.html?id=${id}&ref_page=${pageNumber}`;
}

// Удаление инструмента
async function deleteTool(id) {
    if (!confirm('Вы уверены, что хотите удалить этот инструмент?')) return;

    try {
        const response = await fetch(`${API_URL}/tools/${id}`, { method: 'DELETE' });
        if (response.ok) {
            showMessage('Инструмент удален');
            fetchTools(currentPage, currentSearch);
        } else {
            const errorText = await response.text();
            showMessage('Ошибка удаления: ' + errorText, true);
        }
    } catch (error) {
        showMessage('Ошибка сети', true);
    }
}

/* --- ОПТИМИЗИРОВАННЫЙ ДИНАМИЧЕСКИЙ ПОИСК --- */
let inputTimer = null;
const DEBOUNCE_DELAY = 300;

searchInput.addEventListener('input', (event) => {
    // 1. Нормализация: убираем лишние пробелы и приводим разделители к единому виду (точка)
    let query = event.target.value.trim().replace(/,/g, '.');
    // Если вы хотите, чтобы поиск по имени нечувствительно относился к регистру на уровне JS,
    // можно сделать query = query.toLowerCase(); (но лучше, чтобы это делал сервер)
    event.target.value = query;

    if (inputTimer) clearTimeout(inputTimer);

    // Если поле пустое — сбрасываем поиск
    if (!query) {
        inputTimer = setTimeout(() => {
            fetchTools(1, null);
        }, DEBOUNCE_DELAY);
        return;
    }

    inputTimer = setTimeout(() => {
        const searchPayload = {};

        // 2. Проверка для числового поля D:
         const isPureNumber = /^[\d.-]+$/.test(query);

        if (isPureNumber) {
            searchPayload.d = query;
        }

        // 3. Поиск по имени:
        if (!isPureNumber || /[a-zA-Z]/.test(query)) {
            searchPayload.name = query;
        }

        // 3. Поиск по типу:
        if (isPureNumber || /[а-яА-Я]/.test(query)) {
            searchPayload.type = query;
        }

        // Отправляем запрос. Если isPureNumber=true и букв нет, payload будет {d: "..."}.
        // Если есть буквы, payload будет {d: "...", name: "..."}.
        fetchTools(1, searchPayload);
    }, DEBOUNCE_DELAY);
});

// Кнопка сброса (оставьте как есть, она работает корректно)
clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    fetchTools(1, null);
});

// Пагинация
prevBtn.addEventListener('click', () => fetchTools(currentPage - 1, currentSearch));
nextBtn.addEventListener('click', () => fetchTools(currentPage + 1, currentSearch));

// Первоначальная загрузка
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const startPage = parseInt(urlParams.get('page')) || 1;
    fetchTools(startPage, null);
});
