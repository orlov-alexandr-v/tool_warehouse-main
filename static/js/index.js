const API_URL = 'http://127.0.0.1:8000';

// Элементы DOM
const createForm = document.getElementById('createForm');
const messageBox = document.getElementById('message');
const openModalBtn = document.getElementById('openModalBtn');
const addModal = document.getElementById('addModal');
const closeModalBtn = document.querySelector('.close-modal-btn');

// Вспомогательная функция для отображения сообщений
function showMessage(text, isError = false) {
    messageBox.textContent = text;
    messageBox.className = 'status-message';
    messageBox.classList.toggle('error', isError);
    messageBox.classList.toggle('success', !isError);
    messageBox.style.display = 'block';
    setTimeout(() => messageBox.style.display = 'none', 3000);
}

// Функции управления модальным окном
function openModal() {
    addModal.style.display = 'flex';
    createForm.reset(); // Сброс формы при открытии
}

function closeModal() {
    addModal.style.display = 'none';
}

// Создание нового инструмента
createForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newTool = {
        Type: document.getElementById('type').value,
        Name: document.getElementById('name').value,
        D: document.getElementById('d').value,
        S: document.getElementById('s').value,
        L: document.getElementById('l').value,
        I: document.getElementById('i').value,
        Z: document.getElementById('z').value,
        Kol: parseInt(document.getElementById('kol').value),
        price_per_unit: parseFloat(document.getElementById('price_per_unit').value) || 0.0,
        manufacturer_url: document.getElementById('manufacturer_url').value || null
    };

    try {
        const response = await fetch(`${API_URL}/tools/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTool),
            credentials: 'include'
        });

        if (response.ok) {
            showMessage('Инструмент успешно добавлен');
            closeModal();
            createForm.reset(); // Очищаем форму для нового ввода
        } else {
            const error = await response.json();
            showMessage(error.detail || 'Ошибка добавления', true);
        }
    } catch (error) {
        showMessage('Ошибка сети', true);
    }
});

// Обработчики модального окна
openModalBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);

// Закрытие по клику на фон (но не на само окно)
addModal.addEventListener('click', (e) => {
    if (e.target === addModal) {
        closeModal();
    }
});