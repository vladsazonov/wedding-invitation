export function initLayerController() {
    const welcomeBlock = document.getElementById('welcome-block');
    const dimmer = document.querySelector('.header__dimmer');

    if (!welcomeBlock || !dimmer) return;

    const thresholdSteps = Array.from({ length: 101 }, (_, i) => i / 100);

    const observerOptions = {
        root: null,
        threshold: thresholdSteps
    };

    const processLayers = (entries) => {
        entries.forEach(entry => {
            if (entry.target === welcomeBlock) {
                const ratio = entry.intersectionRatio;
                // При входе шторки в экран (ratio увеличивается) слой плавно темнеет до 0.65
                const maxDimming = 0.8;
                dimmer.style.opacity = (ratio * maxDimming).toFixed(2);
            }
        });
    };

    const observer = new IntersectionObserver(processLayers, observerOptions);
    observer.observe(welcomeBlock);
}
