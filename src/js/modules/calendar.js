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
    titleContainer.textContent = formatter.format(targetDate);
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
      emptyCell.className = 'calendar__day calendar__day--empty';
      fragment.appendChild(emptyCell);
    }

    // Генерация дней месяца
    for (let day = 1; day <= totalDays; day++) {
      const dayCell = document.createElement('div');
      dayCell.className = 'calendar__day';
      dayCell.textContent = day;

      // Вычисляем день недели математически: (сдвиг + день - 1) % 7
      // Где 5 - Суббота, 6 - Воскресенье (т.к. мы сдвинули начало недели на Пн)
      const currentDayOfWeek = (startOffset + day - 1) % 7;
      if (currentDayOfWeek === 5 || currentDayOfWeek === 6) {
        dayCell.classList.add('calendar__day--weekend');
      }

      if (day === targetDay) {
        dayCell.classList.add('calendar__day--highlighted');
      }

      fragment.appendChild(dayCell);
    }

    gridContainer.replaceChildren(fragment);
  };

  // Вызов рендеринга при инициализации функции
  renderHeader();
  renderGrid();
}
