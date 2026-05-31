// Принудительный сброс сохранения позиции скролла браузером при перезагрузке
if (window.history && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

import { initRsvpHandler } from './modules/rsvpHandler.js';
import { initWeddingTimer } from './modules/weddingTimer.js';
import { initMapHandler } from './modules/mapHandler.js';
import { initLayerController } from './modules/layerController.js';
import { initWeddingCalendar } from './modules/calendar.js';

async function loadComponents() {
  // Фиксированный массив компонентов для явной сборки лендинга
  const components = [
    { id: 'header-component', url: './src/components/header.html' },
    { id: 'welcome-component', url: './src/components/welcome.html' },
    { id: 'calendar-component', url: './src/components/calendar.html' },
    { id: 'countdown-component', url: './src/components/countdown.html' },
    { id: 'location-component', url: './src/components/location.html' }, 
    { id: 'map-modal-component', url: './src/components/map-modal.html' },
    { id: 'timing-component', url: './src/components/timing.html' },
    { id: 'info-component', url: './src/components/info.html' },
    { id: 'rsvp-component', url: './src/components/rsvp.html' }
  ];
  
  // Создаем массив промисов для одновременной асинхронной загрузки всех блоков
  const promises = components.map(async (component) => {
    const el = document.getElementById(component.id);
    
    // Если на странице нет контейнера под этот компонент, просто пропускаем его
    if (!el) {
      console.warn(`Предупреждение: Контейнер с id "${component.id}" не найден в index.html`);
      return;
    }
    
    try {
      const response = await fetch(component.url);
      if (!response.ok) throw new Error(`Не удалось загрузить файл по пути: ${component.url}`);
      
      // Встраиваем полученный HTML-код внутрь контейнера
      el.innerHTML = await response.text();
    } catch (err) {
      console.error(`Ошибка сборки UI [${component.id}]:`, err);
      el.innerHTML = `<div style="padding:20px; color:red; text-align:center;">Ошибка загрузки блока ${component.id}</div>`;
    }
  });

  // Строго дожидаемся завершения загрузки ВСЕХ компонентов в DOM-дерево
  await Promise.all(promises);
  
  // Инициализируем всю динамическую логику только ПОСЛЕ того, как разметка полностью готова
  const initModules = [
    { name: 'LayerController', fn: () => initLayerController() },
    { name: 'RsvpHandler', fn: () => initRsvpHandler() },
    { name: 'WeddingTimer', fn: () => initWeddingTimer() },
    { name: 'MapHandler', fn: () => initMapHandler() },
    { name: 'WeddingCalendar', fn: () => initWeddingCalendar('2026-08-17') }
  ];
  
  // Изолируем вызовы модулей: ошибка в одном не сломает остальные
  initModules.forEach(({ name, fn }) => {
    try {
      fn();
    } catch (err) {
      console.error(`Ошибка инициализации модуля [${name}]:`, err);
    }
  });
  
  // Анимация скролла AOS (если библиотека успешно подключена через CDN)
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      once: true,
      offset: 50
    });
  }
}

// Безопасный запуск сборщика в зависимости от состояния готовности документа
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadComponents);
} else {
  loadComponents();
}
