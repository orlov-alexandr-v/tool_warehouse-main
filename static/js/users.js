const API_URL = 'http://127.0.0.1:8000';
const createUserForm = document.getElementById('createUserForm');
const messageBox = document.getElementById('message');
const usersContainer = document.getElementById('users-container');

function showMessage(text, isError = false) {
    messageBox.textContent = text;
    messageBox.className = 'status-message';
    messageBox.classList.toggle('error', isError);
    messageBox.classList.toggle('success', !isError);
    messageBox.style.display = 'block';
    setTimeout(() => messageBox.style.display = 'none', 3000);
}

// Функция отображения списка (обновлена: добавлена колонка ID и кнопка)
function renderUsers(users) {
    if (users.length === 0) {
        usersContainer.innerHTML = '<p>Список сотрудников пуст.</p>';
        return;
    }

    let tableHTML = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <thead>
                <tr style="background-color: #f8f9fa;">
                    <th style="border: 1px solid #dee2e6; padding: 10px; text-align: left;">ID</th>
                    <th style="border: 1px solid #dee2e6; padding: 10px; text-align: left;">Фамилия</th>
                    <th style="border: 1px solid #dee2e6; padding: 10px; text-align: left;">Имя</th>
                    <th style="border: 1px solid #dee2e6; padding: 10px; text-align: left;">Действие</th>
                </tr>
            </thead>
            <tbody>
    `;

    users.forEach(user => {
        tableHTML += `
            <tr>
                <td style="border: 1px solid #dee2e6; padding: 10px;">${user.id}</td>
                <td style="border: 1px solid #dee2e6; padding: 10px;">${user.surname}</td>
                <td style="border: 1px solid #dee2e6; padding: 10px;">${user.name}</td>
                <td style="border: 1px solid #dee2e6; padding: 10px;">
                    <button class="delete" data-id="${user.id}">Удалить</button>
                </td>
            </tr>
        `;
    });

    tableHTML += '</tbody></table>';
    usersContainer.innerHTML = tableHTML;

    // Назначаем обработчики кнопкам удаления после вставки HTML
    const deleteButtons = usersContainer.querySelectorAll('.delete');
    deleteButtons.forEach(button => {
        button.addEventListener('click', handleDelete);
    });
}

// Функция удаления
async function handleDelete(event) {
    // Ищем ближайший родительский элемент с классом .delete
    const button = event.target.closest('.delete');

    // Если такого элемента нет (кликнули мимо кнопок), выходим
    const userId = button.dataset.id;

    if (!button) return;

    // Защита от пустого ID
    if (!userId) {
        showMessage('Не удалось определить ID сотрудника', true);
        return;
    }

    if (!confirm('Вы уверены, что хотите удалить этого сотрудника?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showMessage('Сотрудник успешно удален');
            // Удаляем всю строку таблицы, в которой находилась кнопка
            button.closest('tr').remove();

            // Проверяем, остались ли еще строки
            const tbody = usersContainer.querySelector('tbody');
            if (tbody && tbody.children.length === 0) {
                usersContainer.innerHTML = '<p>Список сотрудников пуст.</p>';
            }
        } else if (response.status === 404) {
            showMessage('Сотрудник не найден', true);
        } else {
            const error = await response.json();
            showMessage(error.detail || 'Ошибка удаления', true);
        }
    } catch (error) {
        showMessage('Ошибка сети', true);
    }
}

// Функция загрузки пользователей
async function loadUsers() {
    try {
        const response = await fetch(`${API_URL}/users/`);
        if (response.ok) {
            const users = await response.json();
            renderUsers(users);
        } else {
            console.error('Не удалось загрузить пользователей', await response.text());
        }
    } catch (error) {
        console.error('Ошибка сети при загрузке пользователей:', error);
    }
}

// Обработчик создания
createUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const lastName = document.getElementById('surname').value.trim();
    const firstName = document.getElementById('name').value.trim();

    if (!lastName || !firstName) {
        showMessage('Пожалуйста, заполните все поля', true);
        return;
    }

    try {
        const response = await fetch(`${API_URL}/users/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ surname: lastName, name: firstName }),
        });

        if (response.ok) {
            showMessage('Пользователь успешно добавлен');
            createUserForm.reset();
            await loadUsers();
        } else {
            const error = await response.json();
            showMessage(error.detail || 'Ошибка добавления', true);
        }
    } catch (error) {
        showMessage('Ошибка сети', true);
    }
});

document.addEventListener('DOMContentLoaded', loadUsers);