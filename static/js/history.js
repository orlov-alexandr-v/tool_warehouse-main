const API_URL = 'http://127.0.0.1:8000';

let allHistoryData = []; // Сюда сохранится ВЕСЬ массив с бэкенда
let currentPage = 1;
const LIMIT = 10;

// Элементы DOM
const historyBody = document.getElementById('historyBody');
const searchUser = document.getElementById('searchUser');
const searchTool = document.getElementById('searchTool');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const messageBox = document.getElementById('message');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');
const paginationBlock = document.getElementById('pagination');
const tableHead = document.querySelector('#historyTable thead');

function showMessage(text, isError = false) {
    messageBox.textContent = text;
    messageBox.className = 'status-message';
    messageBox.classList.toggle('error', isError);
    messageBox.classList.toggle('success', !isError);
    messageBox.style.display = 'block';
    setTimeout(() => messageBox.style.display = 'none', 3000);
}

function togglePaginationVisibility(show) {
    paginationBlock.style.display = show ? 'flex' : 'none';
}

function formatDate(isoString) {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

// Сортировка массива в памяти (JS)
function sortHistory(data, key, direction) {
    const sorted = [...data];
    sorted.sort((a, b) => {
        let valA = a[key];
        let valB = b[key];
        if (key === 'issue_date') {
            valA = new Date(valA).getTime();
            valB = new Date(valB).getTime();
        }
        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });
    return sorted;
}

//функция загрузки
async function fetchHistory() {
    const userQuery = searchUser.value.trim();
    const toolQuery = searchTool.value.trim();

    try {
        // 1. Проверка базового URL
        console.log('Базовый API_URL из константы:', API_URL);

        const url = new URL(`${API_URL}/history/`);

        // Раскомментируйте эти строки, если хотите проверить передачу фильтров
        if (userQuery) url.searchParams.append('search_user', userQuery);
        if (toolQuery) url.searchParams.append('search_tool', toolQuery);

        // 2. Проверка итогового URL, который уходит в сеть
        console.log('Итоговый URL запроса:', url.toString());

        const response = await fetch(url);

        // 3. Проверка статуса и заголовков ответа
        console.log('Статус ответа (response.status):', response.status);
        console.log('OK (response.ok):', response.ok);
        console.log('Заголовки ответа (response.headers):', Object.fromEntries(response.headers.entries()));

        // Если бэкенд вернул 404 или 500, response.ok будет false
        if (!response.ok) {
            // 4. Получение текста ошибки от сервера (FastAPI часто присылает JSON с деталями)
            const errorText = await response.text();
            console.error('Текст тела ошибки от сервера:', errorText);

            // Выкидываем ошибку, чтобы попасть в catch
            throw new Error(`Server error: ${response.status}. Body: ${errorText}`);
        }

        // 5. Проверка полученных данных до сортировки
        const rawData = await response.json();
        console.log('Сырой JSON с бэкенда:', rawData);

        // Сохраняем ВСЕ данные
        allHistoryData = rawData;

        // Сразу сортируем по дате (новые сверху) после получения
        allHistoryData = sortHistory(allHistoryData, 'issue_date', 'desc');

        renderTable();
    } catch (error) {
        // 6. Ловим сетевые ошибки (CORS, DNS, обрыв соединения)
        console.error('Критическая ошибка fetch (сетевая или синтаксис JSON):', error);
        showMessage('Ошибка при загрузке истории', true);
    }
}

// Функция отрисовки (теперь берет срез из allHistoryData)
function renderTable() {
    const userQuery = searchUser.value.trim().toLowerCase();
    const toolQuery = searchTool.value.trim().toLowerCase();

    // 1. Фильтрация
    let filteredData = allHistoryData.filter(item => {

        // Защита от null/undefined в user_fio
        const user_fio_for_search = item.user_fio ? item.user_fio.toLowerCase() : "";
        const userMatch = user_fio_for_search.includes(userQuery);

        // Защита от null/undefined в tool_name
        const tool_name_for_search = item.tool_name ? item.tool_name.toLowerCase() : "";
        const toolMatch = tool_name_for_search.includes(toolQuery);

        return userMatch && toolMatch;
    });

    // 2. Пагинация (срез массива)
    const start = (currentPage - 1) * LIMIT;
    const end = start + LIMIT;
    const pageData = filteredData.slice(start, end);

    // 3. Отрисовка
    historyBody.innerHTML = '';

    if (pageData.length === 0) {
        const row = document.createElement('tr');
        // Выводим заглушку на все 5 колонок (span нужен для корректного colspan)
        row.innerHTML = `<td colspan="5" style="text-align: center; color: #777; padding: 40px;">Записи не найдены</td>`;
        historyBody.appendChild(row);
    } else {
        pageData.forEach(item => {
            const row = document.createElement('tr');
            // Кнопка добавлена здесь, в каждой строке с данными
            row.innerHTML = `
                <td>${formatDate(item.issue_date)}</td>
                <td>${item.user_fio}</td>
                <td>${item.tool_name}</td>
                <td>${item.quantity}</td>
                <td style="text-align: center; width: 50px;">
                    <button class="btn-delete" data-id="${item.id}">✕</button>
                </td>
            `;
            historyBody.appendChild(row);
        });
    }

    // 4. Обновление пагинации
    const totalPages = Math.ceil(filteredData.length / LIMIT) || 1;
    pageInfo.textContent = `Страница ${currentPage} из ${totalPages}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
    togglePaginationVisibility(filteredData.length > 0);
}

/* --- ОБРАБОТЧИКИ --- */

// Сортировка по клику (теперь работает мгновенно)
tableHead.addEventListener('click', (event) => {
    const th = event.target.closest('th');
    if (!th || !th.dataset.key) return;

    const key = th.dataset.key;
    let direction = 'asc';
    if (th.classList.contains('sort-asc')) {
        direction = 'desc';
    }

    // Обновляем классы в заголовках
    Array.from(tableHead.querySelectorAll('th')).forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
    });
    th.classList.add(direction === 'asc' ? 'sort-asc' : 'sort-desc');

    // Сортируем данные в памяти
    allHistoryData = sortHistory(allHistoryData, key, direction);
    currentPage = 1;
    renderTable();
});

// Поиск (фильтрует уже загруженный массив)
function handleSearchInput() {
    currentPage = 1;
    renderTable();
}
searchUser.addEventListener('input', handleSearchInput);
searchTool.addEventListener('input', handleSearchInput);

clearSearchBtn.addEventListener('click', () => {
    searchUser.value = '';
    searchTool.value = '';
    fetchHistory(); // Перезагружаем полный список с бэкенда
});

// Пагинация
prevBtn.addEventListener('click', () => {
    currentPage--;
    renderTable();
});
nextBtn.addEventListener('click', () => {
    currentPage++;
    renderTable();
});

// Функция удаления записи
async function deleteHistoryItem(historyId) {
    try {
        const response = await fetch(`${API_URL}/history/${historyId}/`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showMessage('Запись успешно удалена');
            // После успешного удаления перезагружаем данные с сервера,
            // чтобы обновить пагинацию и фильтры
            fetchHistory();
        } else {
            const errorData = await response.json();
            showMessage(`Ошибка: ${errorData.detail || response.statusText}`, true);
        }
    } catch (error) {
        showMessage('Сетевая ошибка при удалении', true);
    }
}

// Делегирование клика по кнопке удаления (работает быстрее, чем добавлять listener в цикле)
historyBody.addEventListener('click', (event) => {
    if (event.target.classList.contains('btn-delete')) {
        const historyId = event.target.dataset.id;

        // Подтверждение удаления
        if (confirm('Вы уверены, что хотите удалить эту запись?')) {
            deleteHistoryItem(historyId);
        }
    }
});

// Первоначальная загрузка
document.addEventListener('DOMContentLoaded', () => {
    fetchHistory();
});