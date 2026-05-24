export function initLayerController() {
    const welcomeBlock = document.getElementById('welcome-block');
    const dimmer = document.querySelector('.header__dimmer');

    if (!welcomeBlock || !dimmer) return;

    const thresholdSteps = Array.from({ length: 101 }, (_, i) => i / 100);
    let isSnapping = false;
    let isAnchoredTop = false;
    let lastScrollTop = window.scrollY;

    const observerOptions = {
        root: null,
        threshold: thresholdSteps
    };

    const processLayers = (entries) => {
        entries.forEach(entry => {
            if (entry.target !== welcomeBlock) return;

            const ratio = entry.intersectionRatio;
            const maxDimming = 0.65;
            dimmer.style.opacity = (ratio * maxDimming).toFixed(2);

            const currentScrollTop = window.scrollY;
            const isScrollingDown = currentScrollTop > lastScrollTop;
            lastScrollTop = currentScrollTop;

            // Контроль радиуса скругления
            if (ratio >= 0.98) {
                welcomeBlock.classList.add('welcome--docked');
            } else if (ratio < 0.95 && !isSnapping) {
                welcomeBlock.classList.remove('welcome--docked');
            }

            if (isSnapping) return;

            // Получаем точные физические координаты относительно вьюпорта
            const rect = welcomeBlock.getBoundingClientRect();
            const topBound = rect.top;
            const screenHeight = window.innerHeight;
            const midPoint = screenHeight / 2;

            // 1. Движение ВНИЗ: если шторка пересекла середину экрана вверх
            if (isScrollingDown && !isAnchoredTop && topBound < midPoint && topBound > 5) {
                isSnapping = true;
                const targetPosition = topBound + window.scrollY;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                setTimeout(() => {
                    isSnapping = false;
                    isAnchoredTop = true;
                    welcomeBlock.classList.add('welcome--docked');
                }, 600);
            }
            
            // 2. Движение ВВЕРХ: если шторка опустилась ниже середины экрана
            else if (!isScrollingDown && topBound > (screenHeight - midPoint) && window.scrollY < screenHeight) {
                isSnapping = true;
                isAnchoredTop = false;
                welcomeBlock.classList.remove('welcome--docked');

                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });

                setTimeout(() => {
                    isSnapping = false;
                }, 600);
            }

            // Корректировка флагов фиксации при крайних положениях страницы
            if (currentScrollTop < 10) {
                isAnchoredTop = false;
                welcomeBlock.classList.remove('welcome--docked');
            }
        });
    };

    const observer = new IntersectionObserver(processLayers, observerOptions);
    observer.observe(welcomeBlock);
}
