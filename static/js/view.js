const API_URL = 'http://127.0.0.1:8000';

// Получение ID из параметров URL
const urlParams = new URLSearchParams(window.location.search);
const toolId = urlParams.get('id');

if (!toolId) {
    document.getElementById('toolDetails').innerHTML = '<p style="color: #e74c3c;">ID инструмента не указан.</p>';
} else {
    loadToolDetails(toolId);
}

async function loadToolDetails(id) {
    try {
        const response = await fetch(`${API_URL}/tools/${id}`);
        if (!response.ok) throw new Error('Инструмент не найден');
        const tool = await response.json();

        // Форматируем цены
        const priceFormatted = new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 2
        }).format(tool.price_per_unit || 0);

        const totalCost = (tool.Kol || 0) * (tool.price_per_unit || 0);
        const totalCostFormatted = new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 2
        }).format(totalCost);

        const manufacturerLink = tool.manufacturer_url
            ? `<a href="${tool.manufacturer_url}" target="_blank" rel="noopener noreferrer">${tool.manufacturer_url}</a>`
            : '<span style="color: #777;">—</span>';

        // Формируем HTML с разделением на две колонки
        const html = `
            <div class="view-grid">
                <!-- ЛЕВАЯ КОЛОНКА: Характеристики -->
                <div id="left-column">
                    <div class="field-group">
                        <label>Наименование:</label>
                        <div class="field-value">${tool.Name}</div>
                    </div>
                    <div class="field-group">
                        <label>Тип:</label>
                        <div class="field-value">${tool.Type}</div>
                    </div>
                    <div class="field-group">
                        <label>Диаметр (D):</label>
                        <div class="field-value">${tool.D}</div>
                    </div>
                    ${tool.S ? `
                        <div class="field-group">
                            <label>Диаметр хвостовика (S):</label>
                            <div class="field-value">${tool.S}</div>
                        </div>
                    ` : ''}
                    ${tool.L ? `
                        <div class="field-group">
                            <label>Общая длина (L):</label>
                            <div class="field-value">${tool.L}</div>
                        </div>
                    ` : ''}
                    ${tool.I ? `
                        <div class="field-group">
                            <label>Длина рабочей части (I):</label>
                            <div class="field-value">${tool.I}</div>
                        </div>
                    ` : ''}
                    ${tool.Z ? `
                        <div class="field-group">
                            <label>Количество зубьев (Z):</label>
                            <div class="field-value">${tool.Z}</div>
                        </div>
                    ` : ''}
                </div>

                <!-- ПРАВАЯ КОЛОНКА: Финансы и производитель -->
                <div id="right-column">
                    <div class="field-group">
                        <label>Количество:</label>
                        <div class="field-value">${tool.Kol}</div>
                    </div>
                    <div class="field-group">
                        <label>Цена за 1 шт.:</label>
                        <div class="field-value">${priceFormatted}</div>
                    </div>
                    <div class="field-group">
                        <label>Общая стоимость:</label>
                        <div class="field-value" style="font-weight: 600;">${totalCostFormatted}</div>
                    </div>
                    <div class="field-group">
                        <label>Ссылка на магазин:</label>
                        <div class="field-value">${manufacturerLink}</div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('toolDetails').innerHTML = html;
    } catch (error) {
        document.getElementById('toolDetails').innerHTML = '<p style="color: #e74c3c;">Ошибка загрузки данных.</p>';
    }
}

function editTool() {
    window.location.href = `/edit.html?id=${toolId}`;
}