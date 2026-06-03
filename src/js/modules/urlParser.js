/**
 * Парсит параметры URL, автоматически нормализуя и декодируя Base64-строку гостей.
 * Устраняет баг нативного API URLSearchParams, преобразующего символ '+' в пробел.
 * @returns {Object} Контракт данных: массив гостей, сырая строка, ID и отформатированные имена
 */
export function parseGuestParameters() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || '';
  
  // Поддерживаем оба ключа для гибкости ('g' от скрипта таблицы или 'guests' от ручного ввода)
  const targetParam = params.get('g') || params.get('guests') || '';
  let cleanPayload = targetParam.trim();

  if (cleanPayload) {
    try {
      // АРХИТЕКТУРНЫЙ ФИКС: Восстанавливаем оригинальные плюсы, уничтоженные URLSearchParams.
      // Также добавляем поддержку Web-Safe Base64 (заменяем латинские дефисы и подчеркивания).
      const normalizedBase64 = cleanPayload
        .replace(/ /g, '+')
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      // Декодируем очищенную от искажений URL-строку Base64 в бинарный поток
      const binaryString = atob(normalizedBase64);
      const bytes = Uint8Array.from(binaryString, char => char.charCodeAt(0));
      
      // Читаем поток как чистый UTF-8 (восстанавливает кириллицу)
      cleanPayload = new TextDecoder('utf-8').decode(bytes);
    } catch (error) {
      // Fallback-заглушка: если в URL передана обычная кириллица без Base64, 
      // оставляем текст как есть для локальной отладки (?guests=Иван,Елена)
    }
  }

  // Расщепляем декодированную строку по запятой на массив по вашему стандарту
  const guests = cleanPayload
    ? cleanPayload.split(',').map(name => name.trim()).filter(Boolean)
    : [];

  // Полное сохранение вашего алгоритма форматирования финальной строки
  const formattedNames = guests.length > 1
    ? `${guests.slice(0, -1).join(', ')} и ${guests[guests.length - 1]}`
    : guests[0] || '';

  return {
    guests,
    rawGuests: guests.join(', '),
    id,
    formattedNames
  };
}
