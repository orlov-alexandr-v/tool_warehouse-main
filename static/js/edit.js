const API_URL = 'http://127.0.0.1:8000';
const urlParams = new URLSearchParams(window.location.search);
const toolId = urlParams.get('id');

// Если ID не передан в URL
if (!toolId) {
    document.getElementById('errorState').textContent = 'ID инструмента не указан. Откройте страницу редактирования из списка инструментов.';
    document.getElementById('errorState').style.display = 'block';
} else {
    loadToolForEdit(toolId);
}

// Функция для получения номера страницы из URL (всегда возвращает число)
function getPageFromUrl() {
    const pageParam = urlParams.get('ref_page');
    const pageNumber = parseInt(pageParam);
    return isNaN(pageNumber) ? 1 : pageNumber;
}

// Универсальная функция возврата
function goBackToList() {
    const page = getPageFromUrl();
    const targetUrl = `http://127.0.0.1:8000/list.html?page=${page}`;
    window.location.href = targetUrl;
}

// Обработчик формы сохранения
document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Блокируем кнопку, чтобы избежать двойного клика
    const submitBtn = e.submitter;
    if (submitBtn && submitBtn.classList.contains('save')) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Сохранение...';
    }

    // Сбор данных из полей
    const data = {
        Name: document.getElementById('name').value.trim(),
        Type: document.getElementById('type').value.trim(),
        D: document.getElementById('d').value.trim(),
        Kol: parseInt(document.getElementById('kol').value) || 0,
        price_per_unit: parseFloat(document.getElementById('price_per_unit').value) || 0,
        manufacturer_url: document.getElementById('manufacturer_url').value.trim() || "",
        L: document.getElementById('L').value.trim(),
        S: document.getElementById('S').value.trim(),
        I: document.getElementById('I').value.trim(),
        Z: document.getElementById('Z').value.trim()
    };

    try {
        const response = await fetch(`${API_URL}/tools/${toolId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Не удалось сохранить изменения');
        }

        showMessage('Изменения успешно сохранены!', false);

        // Используем replace, чтобы в истории не осталось страницы редактирования
        setTimeout(() => {
            const safePage = getPageFromUrl();
            window.location.replace(`/list.html?page=${safePage}`);
        }, 1500);

    } catch (error) {
        showMessage('Ошибка при сохранении: ' + error.message, true);
        // Разблокируем кнопку в случае ошибки
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Сохранить';
        }
    }
});

async function loadToolForEdit(id) {
    try {
        const response = await fetch(`${API_URL}/tools/${id}`);
        if (!response.ok) throw new Error('Инструмент не найден');
        const tool = await response.json();

        document.getElementById('editForm').style.display = 'block';

        document.getElementById('name').value = tool.Name ?? '';
        document.getElementById('type').value = tool.Type ?? '';
        document.getElementById('d').value = tool.D ?? '';
        document.getElementById('kol').value = tool.Kol ?? '';
        document.getElementById('price_per_unit').value = tool.price_per_unit ?? '';
        document.getElementById('manufacturer_url').value = tool.manufacturer_url ?? '';
        document.getElementById('L').value = tool.L ?? '';
        document.getElementById('S').value = tool.S ?? '';
        document.getElementById('I').value = tool.I ?? '';
        document.getElementById('Z').value = tool.Z ?? '';

    } catch (error) {
        document.getElementById('errorState').textContent = 'Ошибка загрузки данных: ' + error.message;
        document.getElementById('errorState').style.display = 'block';
    }
}

function showMessage(text, isError) {
    const msgBox = document.getElementById('message');
    msgBox.textContent = text;
    msgBox.className = 'status-message';
    msgBox.classList.toggle('error', isError);
    msgBox.classList.toggle('success', !isError);
    msgBox.style.display = 'block';

    setTimeout(() => {
        msgBox.style.display = 'none';
    }, 3000);
}