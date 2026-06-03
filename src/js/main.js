import { initRsvpHandler } from './modules/rsvpHandler.js';
import { initWeddingTimer } from './modules/weddingTimer.js';
import { initMapHandler } from './modules/mapHandler.js';
import { initWeddingCalendar } from './modules/calendar.js';

// Фиксированный массив вынесен из функции для экономии памяти (создается единожды)
const COMPONENTS_CONFIG = [
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

async function loadComponents() {
  // ЭТАП 1: Параллельная загрузка всех данных без изменения DOM (снижает Layout Thrashing)
  const fetchPromises = COMPONENTS_CONFIG.map(async (component) => {
    const el = document.getElementById(component.id);
    
    if (!el) {
      console.warn(`Предупреждение: Контейнер с id "${component.id}" не найден в index.html`);
      return null;
    }
    
    try {
      const response = await fetch(component.url);
      if (!response.ok) throw new Error(`Не удалось загрузить файл по пути: ${component.url}`);
      const html = await response.text();
      return { el, html };
    } catch (err) {
      console.error(`Ошибка сборки UI [${component.id}]:`, err);
      return { 
        el, 
        html: `<div style="padding:20px; color:red; text-align:center;">Ошибка загрузки блока ${component.id}</div>` 
      };
    }
  });

  const loadedComponents = await Promise.all(fetchPromises);
  
  // ЭТАП 2: Синхронная пакетная вставка всех блоков разом
  loadedComponents.forEach(item => {
    if (item) item.el.innerHTML = item.html;
  });
  
  // Инициализируем логику. Прямые ссылки на функции экономят память
  const initModules = [
    { name: 'RsvpHandler', fn: initRsvpHandler },
    { name: 'WeddingTimer', fn: initWeddingTimer },
    { name: 'MapHandler', fn: initMapHandler },
    { name: 'WeddingCalendar', fn: () => initWeddingCalendar('2026-08-17') }
  ];
  
  initModules.forEach(({ name, fn }) => {
    try {
      fn();
    } catch (err) {
      console.error(`Ошибка инициализации модуля [${name}]:`, err);
    }
  });
  
  // ЭТАП 3: Гарантируем, что браузер рассчитал размеры макета перед запуском AOS
  if (typeof AOS !== 'undefined') {
    requestAnimationFrame(() => {
      AOS.init({
        duration: 800,
        once: false,
        mirror: true,
        offset: 50
      });
    });
  }
}

// Безопасный запуск сборщика в зависимости от состояния готовности документа
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadComponents);
} else {
  loadComponents();
}
