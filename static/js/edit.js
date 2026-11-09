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

// Функция для получения номера страницы из URL
function getPageFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = urlParams.get('ref_page');

    // Если параметра нет, он пустой или не является числом — возвращаем 1
    if (!pageParam) return 1;

    const pageNumber = parseInt(pageParam);
    return isNaN(pageNumber) ? 1 : pageNumber;
}

// Универсальная функция возврата (явно возвращает false для HTML-атрибута)
function goBackToList() {
    const page = getPageFromUrl();

    // Защита: если по какой-то причине page все равно undefined, не делать переход
    if (!page) return;

    // Явно задаем протокол и хост, чтобы исключить любые относительные пути к API
    const targetUrl = `http://127.0.0.1:8000/list.html?page=${page}`;
    window.location.href = targetUrl;
}

// Обработчик формы сохранения
document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Гарантируем, что форма не отправится как обычный HTML-запрос

    // ... (ваш код сбора данных data) ...

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

        // Используем window.location.href напрямую внутри JS, это самый надежный способ
        setTimeout(() => {
            const page = getPageFromUrl();
            window.location.href = `/list.html?page=${page}`;
        }, 1500);

    } catch (error) {
        showMessage('Ошибка при сохранении: ' + error.message, true);
    }
});

async function loadToolForEdit(id) {
    try {
        const response = await fetch(`${API_URL}/tools/${id}`);
        if (!response.ok) throw new Error('Инструмент не найден');
        const tool = await response.json();

        // Показываем форму только после успешного получения данных
        document.getElementById('editForm').style.display = 'block';

        // Заполняем поля
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

// Обработчик отправки формы
document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Сбор данных из полей
    const data = {
        Name: document.getElementById('name').value.trim(),
        Type: document.getElementById('type').value.trim(),
        D: document.getElementById('d').value.trim(),
        Kol: parseInt(document.getElementById('kol').value) || 0,
        price_per_unit: parseFloat(document.getElementById('price_per_unit').value) || 0,
        manufacturer_url: document.getElementById('manufacturer_url').value.trim() || "https://www.example-manufacturer.com",
        L: document.getElementById('L').value.trim(),
        S: document.getElementById('S').value.trim(),
        I: document.getElementById('I').value.trim(),
        Z: document.getElementById('Z').value.trim()
    };

    try {
        const response = await fetch(`${API_URL}/tools/${toolId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Не удалось сохранить изменения');
        }

        showMessage('Изменения успешно сохранены!', false);

        // Исправлено: возврат на страницу списка, а не на главную
        // Внутри document.getElementById('editForm').addEventListener('submit', ...)

        setTimeout(() => {
            const safePage = getPageFromUrl(); // Получаем значение заново

            if (safePage) {
                // Используем window.location.replace, чтобы в истории не осталось страницы редактирования
                window.location.replace(`/list.html?page=${safePage}`);
            } else {
                // На крайний случай — просто на главную страницу списка
                window.location.href = '/list.html';
            }
        }, 1500);

    } catch (error) {
        showMessage('Ошибка при сохранении: ' + error.message, true);
    }
});