export function initLayerController() {
  const welcomeLayer = document.querySelector('.welcome');
  const headerDimmer = document.querySelector('.header__dimmer');
  
  if (!welcomeLayer) return;

  let ticking = false;
  let isSnapping = false;
  let isPointerDown = false;
  let scrollTimeout = null;

  // Переменные для расчета кинетики свайпа
  let startY = 0;
  let startTime = 0;
  let lastY = 0;
  let lastTime = 0;
  let velocityY = 0; // Скорость: пиксели в миллисекунду

  // Пороговые значения для калибровки жестов
  const VELOCITY_THRESHOLD = 0.5; // Скорость свайпа для триггера (px/ms)
  const SNAP_DURATION = 180; // Ускоренная анимация (было 220)

  // 1. Расчет визуала и плавного затемнения
  function updateVisuals() {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    const triggerPoint = vh - 35;

    if (scrollY >= triggerPoint) {
      welcomeLayer.classList.add('welcome--expanded');
    } else {
      welcomeLayer.classList.remove('welcome--expanded');
    }

    if (headerDimmer) {
      const progress = Math.min(scrollY / vh, 1);
      headerDimmer.style.opacity = progress.toFixed(3);
    }

    ticking = false;
  }

  // 2. Сверхбыстрая кастомная анимация примагничивания
  function fastSnapScroll(targetY, duration = SNAP_DURATION) {
    if (isSnapping) return;
    isSnapping = true;

    const startScrollY = window.scrollY;
    const diff = targetY - startScrollY;
    let startTimestamp = null;

    // Мгновенно глушим инерцию прерыванием скролла в текущей точке
    window.scrollTo(0, startScrollY);

    window.requestAnimationFrame(function step(timestamp) {
      if (!startTimestamp) startTimestamp = timestamp;
      const time = timestamp - startTimestamp;
      const percent = Math.min(time / duration, 1);
      
      // Более агрессивная кубическая кривая для мгновенного довода (Ease-Out Cubic)
      const easeProgress = 1 - Math.pow(1 - percent, 3);

      window.scrollTo(0, startScrollY + diff * easeProgress);

      if (time < duration) {
        window.requestAnimationFrame(step);
      } else {
        window.scrollTo(0, targetY); // Жесткая финальная фиксация точки
        isSnapping = false;
      }
    });
  }

  // 3. Валидация координат и запуск магнита
  function evaluateSnapTrigger() {
    if (isSnapping || isPointerDown) return;

    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    const targetTop = vh - 32;

    // Если шторка зависла в промежуточном положении без свайпа (медленный скролл)
    if (scrollY > 30 && scrollY < targetTop - 10) {
      if (scrollY > vh * 0.4) {
        fastSnapScroll(targetTop);
      } else {
        fastSnapScroll(0);
      }
    }
  }

  // Скролл-событие: только отрисовка изменений графики
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateVisuals);
      ticking = true;
    }

    if (!isPointerDown) {
      if (scrollTimeout !== null) window.clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(evaluateSnapTrigger, 40); // Уменьшен таймаут отклика
    }
  }, { passive: true });

  // 4. Семантический перехват жестов (Pointer Events API с расчетом вектора скорости)
  window.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return; 
    
    isPointerDown = true;
    startY = event.clientY;
    startTime = performance.now();
    lastY = startY;
    lastTime = startTime;
    velocityY = 0;
  }, { passive: true });

  window.addEventListener('pointermove', (event) => {
    if (!isPointerDown) return;

    const currentY = event.clientY;
    const currentTime = performance.now();
    const timeDelta = currentTime - lastTime;

    if (timeDelta > 0) {
      // Вычисляем мгновенную скорость движения пальца/курсора
      velocityY = (lastY - currentY) / timeDelta; 
      lastY = currentY;
      lastTime = currentTime;
    }
  }, { passive: true });

  window.addEventListener('pointerup', () => {
    isPointerDown = false;
    const vh = window.innerHeight;
    const targetTop = vh - 32;

    // Перехват быстрого свайпа по вектору мгновенной кинетической скорости
    if (Math.abs(velocityY) > VELOCITY_THRESHOLD) {
      if (velocityY > 0) {
        // Быстрый свайп вверх (палец идет вверх, страница листается вниз)
        fastSnapScroll(targetTop, 160); // Дополнительно ускоряем флик до 160ms
      } else {
        // Быстрый свайп вниз (палец идет вниз, страница листается вверх)
        fastSnapScroll(0, 160);
      }
      velocityY = 0; // Сброс вектора
      return;
    }

    window.requestAnimationFrame(evaluateSnapTrigger);
  }, { passive: true });

  window.addEventListener('pointercancel', () => {
    isPointerDown = false;
    velocityY = 0;
  }, { passive: true });

  // 5. Обработка быстрого прокручивания колеса мыши / трекпада Mac (исключает залипания)
  window.addEventListener('wheel', (event) => {
    // Если анимация уже идет, полностью блокируем нативную прокрутку wheel
    if (isSnapping) {
      event.preventDefault();
      return;
    }

    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    const targetTop = vh - 32;

    if (scrollY > 10 && scrollY < targetTop - 10) {
      if (event.deltaY > 20) {
        event.preventDefault();
        fastSnapScroll(targetTop, 180);
      } else if (event.deltaY < -20) {
        event.preventDefault();
        fastSnapScroll(0, 180);
      }
    }
  }, { passive: false }); // Важно: passive: false необходим для прерывания event.preventDefault()

  updateVisuals();
}
