export function initLayerController() {
  const welcomeLayer = document.querySelector('.welcome');
  const headerDimmer = document.querySelector('.header__dimmer');
  
  if (!welcomeLayer) return;

  let ticking = false;
  let isSnapping = false;
  let isPointerDown = false; // Единый флаг физического удержания экрана/мыши
  let scrollTimeout = null;

  // 1. Оптимизированный расчет визуала и плавного затемнения хедера (60 FPS)
  function updateVisuals() {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    const triggerPoint = vh - 35;

    // Управление классами шторки
    if (scrollY >= triggerPoint) {
      welcomeLayer.classList.add('welcome--expanded');
    } else {
      welcomeLayer.classList.remove('welcome--expanded');
    }

    // Динамическое управление затемнением фона хедера
    if (headerDimmer) {
      // Прогресс от 0 до 1 в пределах первого экрана
      const progress = Math.min(scrollY / vh, 1);
      headerDimmer.style.opacity = progress.toFixed(3);
    }

    ticking = false;
  }

  // 2. Сверхбыстрая кастомная анимация примагничивания
  function fastSnapScroll(targetY, duration = 220) {
    window.scrollTo(0, window.scrollY); // Сброс нативной инерции браузера

    const startY = window.scrollY;
    const diff = targetY - startY;
    let start = null;

    window.requestAnimationFrame(function step(timestamp) {
      if (!start) start = timestamp;
      const time = timestamp - start;
      const percent = Math.min(time / duration, 1);
      
      // Изящная кубическая кривая Ease-Out
      const easeProgress = 1 - Math.pow(1 - percent, 3);

      window.scrollTo(0, startY + diff * easeProgress);

      if (time < duration) {
        window.requestAnimationFrame(step);
      } else {
        isSnapping = false;
      }
    });
  }

  // 3. Валидация координат и запуск магнита
  function evaluateSnapTrigger() {
    // Критически важно: если пользователь всё еще удерживает экран — прерываем автодоводку
    if (isSnapping || isPointerDown) return;

    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    const targetTop = vh - 32;

    // Проверяем, застряла ли шторка в промежуточном состоянии
    if (scrollY > 40 && scrollY < targetTop - 10) {
      isSnapping = true;

      if (scrollY > vh * 0.45) {
        fastSnapScroll(targetTop, 220); // Доводка вверх до упора
      } else {
        fastSnapScroll(0, 220); // Возврат вниз к исходной позиции
      }
    }
  }

  // Скролл-событие: отвечает только за визуальный прогресс и смену классов
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateVisuals);
      ticking = true;
    }

    // Обработка десктопного колеса мыши/трекпада (когда pointerup не вызывается физически)
    if (!isPointerDown) {
      if (scrollTimeout !== null) window.clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(evaluateSnapTrigger, 60);
    }
  }, { passive: true });

  // 4. Семантический перехват жестов и кликов (Pointer Events API)
  // touchstart + mousedown
  window.addEventListener('pointerdown', (event) => {
    // Игнорируем правый клик мыши
    if (event.pointerType === 'mouse' && event.button !== 0) return; 
    isPointerDown = true;
  }, { passive: true });

  // touchend + mouseup
  window.addEventListener('pointerup', () => {
    isPointerDown = false;
    // Пользователь отпустил экран/курсор — мгновенно проверяем необходимость магнита
    window.requestAnimationFrame(evaluateSnapTrigger);
  }, { passive: true });

  // Страховочный сброс флага, если курсор увели за пределы окна браузера
  window.addEventListener('pointercancel', () => {
    isPointerDown = false;
  }, { passive: true });

  // Инициализация при загрузке страницы
  updateVisuals();
}
