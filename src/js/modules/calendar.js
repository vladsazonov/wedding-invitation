/**
 * Инициализирует сетку интерактивного свадебного календаря
 * @param {string} targetDateString - Дата в формате ISO (например, '2026-08-17')
 */
export function initWeddingCalendar(targetDateString) {
  const targetDate = new Date(targetDateString);
  const gridContainer = document.getElementById('calendar-days-grid');
  const titleContainer = document.getElementById('calendar-month-title');

  if (!gridContainer || !titleContainer || isNaN(targetDate.getTime())) {
    return;
  }

  // Внутренние функции рендеринга
  const renderHeader = () => {
    const formatter = new Intl.DateTimeFormat('ru-RU', { month: 'long'});
    const rawDate = formatter.format(targetDate);
    
    // Очищаем от " г." на конце строки
    titleContainer.textContent = rawDate.replace(/\s*г\.?$/, '');
  };

  const renderGrid = () => {
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const targetDay = targetDate.getDate();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const totalDays = new Date(year, month + 1, 0).getDate();

    const fragment = document.createDocumentFragment();

    // Генерация пустых ячеек для выравнивания дней недели
    for (let i = 0; i < startOffset; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.classList.add('calendar__day', 'calendar__day--empty');
      fragment.appendChild(emptyCell);
    }

    // Генерация дней месяца
    for (let day = 1; day <= totalDays; day++) {
      const dayCell = document.createElement('div');
      dayCell.classList.add('calendar__day');
      dayCell.textContent = day.toString();

      const currentDayOfWeek = new Date(year, month, day).getDay();
      if (currentDayOfWeek === 0 || currentDayOfWeek === 6) {
        dayCell.classList.add('calendar__day--weekend');
      }

      if (day === targetDay) {
        dayCell.classList.add('calendar__day--highlighted');
      }

      fragment.appendChild(dayCell);
    }

    gridContainer.innerHTML = '';
    gridContainer.appendChild(fragment);
  };

  // Вызов рендеринга при инициализации функции
  renderHeader();
  renderGrid();
}
