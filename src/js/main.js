import { initDynamicContent } from './modules/urlParser.js';
import { initRsvpHandler } from './modules/rsvpHandler.js';
import { initWeddingTimer } from './modules/weddingTimer.js';

async function loadComponents() {
  const components = document.querySelectorAll('[data-component]');
  
  // Создаем массив промисов для одновременной загрузки всех блоков
  const promises = Array.from(components).map(async (el) => {
    const componentName = el.getAttribute('data-component');
    // Добавлен обработчик пути для корректной работы в подпапках GitHub Pages
    const basePath = window.location.pathname.includes('/название_репозитория') ? './src/components/' : 'src/components/';
    
    try {
      const response = await fetch(`${basePath}${componentName}.html`);
      if (!response.ok) throw new Error(`Не удалось загрузить компонент: ${componentName}`);
      el.innerHTML = await response.text();
    } catch (err) {
      console.error('Ошибка сборки UI:', err);
      el.innerHTML = `<div style="padding:20px; color:red;">Ошибка загрузки блока ${componentName}</div>`;
    }
  });

  // Строго ждем завершения загрузки ВСЕХ компонентов в DOM
  await Promise.all(promises);
  
  // Запускаем логику разбора URL (имена гостей)
  initDynamicContent();
  
  // Запускаем обработчик формы
  initRsvpHandler();

  // Инициализируем таймер
  initWeddingTimer();
  
  // Инициализируем анимацию скролла AOS
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      once: true,
      offset: 50
    });
  }
}

// Запуск при полной готовности документа
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadComponents);
} else {
  loadComponents();
}
