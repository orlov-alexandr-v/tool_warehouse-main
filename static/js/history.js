const API_URL = 'http://127.0.0.1:8000';

let allHistoryData = [];
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

// Функция загрузки
async function fetchHistory() {
    const userQuery = searchUser.value.trim();
    const toolQuery = searchTool.value.trim();

    try {
        const url = new URL(`${API_URL}/history/`);
        if (userQuery) url.searchParams.append('search_user', userQuery);
        if (toolQuery) url.searchParams.append('search_tool', toolQuery);

        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status}. Body: ${errorText}`);
        }

        const rawData = await response.json();
        allHistoryData = rawData;
        allHistoryData = sortHistory(allHistoryData, 'issue_date', 'desc');
        renderTable();
    } catch (error) {
        console.error('Критическая ошибка fetch:', error);
        showMessage('Ошибка при загрузке истории', true);
    }
}

// Функция отрисовки
function renderTable() {
    const userQuery = searchUser.value.trim().toLowerCase();
    const toolQuery = searchTool.value.trim().toLowerCase();

    // 1. Фильтрация с защитой от null
    let filteredData = allHistoryData.filter(item => {
        const user_fio_for_search = item.user_fio ? item.user_fio.toLowerCase() : "";
        const userMatch = user_fio_for_search.includes(userQuery);

        const tool_name_for_search = item.tool_name ? item.tool_name.toLowerCase() : "";
        const toolMatch = tool_name_for_search.includes(toolQuery);

        return userMatch && toolMatch;
    });

    // 2. Пагинация
    const start = (currentPage - 1) * LIMIT;
    const end = start + LIMIT;
    const pageData = filteredData.slice(start, end);

    // 3. Отрисовка
    historyBody.innerHTML = '';

    if (pageData.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="5" style="text-align: center; color: #777; padding: 40px;">Записи не найдены</td>`;
        historyBody.appendChild(row);
    } else {
        pageData.forEach(item => {
            const row = document.createElement('tr');
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

// Сортировка по клику
tableHead.addEventListener('click', (event) => {
    const th = event.target.closest('th');
    if (!th || !th.dataset.key) return;

    const key = th.dataset.key;
    let direction = 'asc';
    if (th.classList.contains('sort-asc')) {
        direction = 'desc';
    }

    Array.from(tableHead.querySelectorAll('th')).forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
    });
    th.classList.add(direction === 'asc' ? 'sort-asc' : 'sort-desc');

    allHistoryData = sortHistory(allHistoryData, key, direction);
    currentPage = 1;
    renderTable();
});

// Поиск
function handleSearchInput() {
    currentPage = 1;
    renderTable();
}
searchUser.addEventListener('input', handleSearchInput);
searchTool.addEventListener('input', handleSearchInput);

clearSearchBtn.addEventListener('click', () => {
    searchUser.value = '';
    searchTool.value = '';
    fetchHistory();
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
            fetchHistory();
        } else {
            const errorData = await response.json();
            showMessage(`Ошибка: ${errorData.detail || response.statusText}`, true);
        }
    } catch (error) {
        showMessage('Сетевая ошибка при удалении', true);
    }
}

// Делегирование клика по кнопке удаления
historyBody.addEventListener('click', (event) => {
    if (event.target.classList.contains('btn-delete')) {
        const historyId = event.target.dataset.id;
        if (confirm('Вы уверены, что хотите удалить эту запись?')) {
            deleteHistoryItem(historyId);
        }
    }
});

// Первоначальная загрузка
document.addEventListener('DOMContentLoaded', () => {
    fetchHistory();
});