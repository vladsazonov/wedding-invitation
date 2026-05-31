export function parseGuestParameters() {
  const params = new URLSearchParams(window.location.search);

  // Собираем всех гостей в плоский массив (flatMap) и очищаем от пробелов
  const guests = params.getAll('guests').flatMap(param =>
    param.split(',').map(name => name.trim()).filter(Boolean)
  );

  // Формируем строку: все кроме последнего через запятую, затем "и [последний]"
  const formattedNames = guests.length > 1
    ? `${guests.slice(0, -1).join(', ')} и ${guests[guests.length - 1]}`
    : guests[0] || '';

  return {
    guests,
    rawGuests: guests.join(', '),
    id: params.get('id') || '',
    formattedNames
  };
}
