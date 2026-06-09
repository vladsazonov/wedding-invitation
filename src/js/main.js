import { initRsvpHandler } from './modules/rsvpHandler.js';
import { initWeddingTimer } from './modules/weddingTimer.js';
import { initMapHandler } from './modules/mapHandler.js';
import { initWeddingCalendar } from './modules/calendar.js';
import { initAudioPlayer } from './modules/audioPlayer.js';
import { initStartScreen } from './modules/startScreen.js';

let lastWidth = window.innerWidth;
const updateViewportHeight = () => {
  const currentWidth = window.innerWidth;
  if (currentWidth !== lastWidth) {
    document.documentElement.style.setProperty('--vh-height', `${window.innerHeight}px`);
    lastWidth = currentWidth;
  }
};

const initViewportHeight = () => {
  document.documentElement.style.setProperty('--vh-height', `${window.innerHeight}px`);
};

initViewportHeight();
window.addEventListener('resize', updateViewportHeight, { passive: true });

const initHeaderParallax = () => {
  const header = document.getElementById('header');
  const welcome = document.getElementById('welcome-block');
  const dimmer = header ? header.querySelector('.header__dimmer') : null;
  const photo = header ? header.querySelector('.header__photo') : null;

  if (!header || !welcome || !dimmer || !photo) {
    return;
  }

  const welcomeHandle = welcome.querySelector('.welcome__handle');
  const expandWelcomeBlock = () => {
    welcome.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (welcomeHandle) {
    welcomeHandle.addEventListener('click', expandWelcomeBlock);
  }

  // Кэшируем высоту скролла для предотвращения Layout Thrashing
  let maxScroll = welcome.offsetTop || window.innerHeight;
  let lastWidthForParallax = window.innerWidth;

  const updateDimensions = () => {
    const currentWidth = window.innerWidth;
    if (currentWidth !== lastWidthForParallax) {
      maxScroll = welcome.offsetTop || window.innerHeight;
      lastWidthForParallax = currentWidth;
    }
  };
  window.addEventListener('resize', updateDimensions, { passive: true });

  // Проверяем аппаратную поддержку Scroll-driven Animations
  const supportsScrollAnimations = window.CSS && CSS.supports('animation-timeline', 'scroll()');

  if (supportsScrollAnimations) {
    // В браузерах с поддержкой CSS scroll-timeline все эффекты скролла (масштабирование, 
    // затемнение, докинг карточки, скрытие ручки и самого хедера) выполняются аппаратно.
    // Нам не нужно регистрировать JS-слушатель скролла!
    return;
  }

  // Фоллбек для старых браузеров (без поддержки CSS scroll-driven animations)
  header.style.overflow = 'hidden';

  dimmer.style.position = 'absolute';
  dimmer.style.inset = '0';
  dimmer.style.backgroundColor = '#000';
  dimmer.style.pointerEvents = 'none';
  dimmer.style.zIndex = '2';
  dimmer.style.willChange = 'opacity';

  photo.style.willChange = 'transform';
  photo.style.transformOrigin = 'center';

  let ticking = false;

  const updateParallax = () => {
    const scrollY = window.scrollY;
    
    if (scrollY > 10) {
      welcome.classList.add('welcome--scrolled');
    } else {
      welcome.classList.remove('welcome--scrolled');
    }

    if (scrollY >= maxScroll - 10) {
      welcome.classList.add('welcome--docked');
    } else {
      welcome.classList.remove('welcome--docked');
    }

    // Скрываем хедер, чтобы при оверскролле в самом низу страницы под формой RSVP не проглядывало темное фото
    if (scrollY >= maxScroll) {
      header.style.visibility = 'hidden';
      header.style.transform = 'translateY(-100%)';
    } else {
      header.style.visibility = 'visible';
      header.style.transform = 'none';
    }

    if (scrollY < 0) {
      const scale = 1 + Math.abs(scrollY) / 500;
      photo.style.transform = `scale(${scale}) translateZ(0)`;
      dimmer.style.opacity = '0';
    } else {
      const progress = Math.min(scrollY / maxScroll, 1);
      dimmer.style.opacity = (progress * 0.7).toString();
      photo.style.transform = `scale(${1 + progress * 0.15}) translateZ(0)`;
    }
    
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });

  updateParallax();
};

// Фиксированный массив вынесен из функции для экономии памяти (создается единожды)
const COMPONENTS_CONFIG = [
  { id: 'start-screen-component', url: './src/components/start-screen.html' },
  { id: 'header-component', url: './src/components/header.html' },
  { id: 'welcome-component', url: './src/components/welcome.html' },
  { id: 'calendar-component', url: './src/components/calendar.html' },
  { id: 'countdown-component', url: './src/components/countdown.html' },
  { id: 'location-component', url: './src/components/location.html' }, 
  { id: 'map-modal-component', url: './src/components/map-modal.html' },
  { id: 'timing-component', url: './src/components/timing.html' },
  { id: 'info-component', url: './src/components/info.html' },
  { id: 'rsvp-component', url: './src/components/rsvp.html' },
  { id: 'audio-component', url: './src/components/audio.html' }
];

const loadComponents = async () => {
  // ЭТАП 1: Параллельная загрузка всех данных без изменения DOM (снижает Layout Thrashing)
  const fetchPromises = COMPONENTS_CONFIG.map(async (component) => {
    let el = document.getElementById(component.id);
    
    if (!el) {
      // Автоматически создаем контейнер стартового экрана, чтобы не менять index.html
      if (component.id === 'start-screen-component') {
        el = document.createElement('div');
        el.id = 'start-screen-component';
        document.body.prepend(el);
      } else {
        console.warn(`Предупреждение: Контейнер с id "${component.id}" не найден в index.html`);
        return null;
      }
    }
    
    try {
      const response = await fetch(component.url);
      if (!response.ok) {
        throw new Error(`Не удалось загрузить файл по пути: ${component.url}`);
      }
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
  loadedComponents.forEach((loadedComponent) => {
    if (loadedComponent) {
      loadedComponent.el.innerHTML = loadedComponent.html;
    }
  });
  
  // Инициализируем логику. Прямые ссылки на функции экономят память
  const initModules = [
    { name: 'StartScreen', fn: initStartScreen },
    { name: 'AudioPlayer', fn: initAudioPlayer },
    { name: 'RsvpHandler', fn: initRsvpHandler },
    { name: 'WeddingTimer', fn: initWeddingTimer },
    { name: 'MapHandler', fn: initMapHandler },
    { name: 'WeddingCalendar', fn: () => { initWeddingCalendar('2026-08-17'); } },
    { name: 'HeaderParallax', fn: initHeaderParallax }
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
      const startScreen = document.getElementById('start-screen-component');
      if (!startScreen) {
        AOS.init({
          duration: 800,
          once: false,
          mirror: true,
          offset: 50
        });
      }
    });
  }
};

// Безопасный запуск сборщика в зависимости от состояния готовности документа
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadComponents);
} else {
  loadComponents();
}
