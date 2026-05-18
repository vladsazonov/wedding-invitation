/**
 * Инициализирует независимый от таймзоны пользователя счетчик обратного отсчета.
 * Дата зафиксирована в одном месте через дефолтный параметр.
 */
export function initWeddingTimer(targetIsoDate = '2026-08-17T12:00:00+03:00') {
    const targetTimestamp = new Date(targetIsoDate).getTime();
    
    if (Number.isNaN(targetTimestamp)) return;

    const nodes = {
        days: document.getElementById('timer-days'),
        hours: document.getElementById('timer-hours'),
        minutes: document.getElementById('timer-minutes'),
        seconds: document.getElementById('timer-seconds')
    };

    if (!nodes.days || !nodes.hours || !nodes.minutes || !nodes.seconds) return;

    function updateDigitNode(node, nextValue) {
        if (node.textContent === nextValue) return;

        node.classList.add('countdown__digits--changing');
        setTimeout(() => {
            node.textContent = nextValue;
            node.classList.remove('countdown__digits--changing');
        }, 120);
    }

    function calculateTime() {
        const diff = targetTimestamp - Date.now();

        if (diff <= 0) {
            clearInterval(intervalId);
            Object.values(nodes).forEach(node => node.textContent = '00');
            return;
        }

        const timeUnits = {
            days: Math.floor(diff / 86400000),
            hours: Math.floor((diff % 86400000) / 3600000),
            minutes: Math.floor((diff % 3600000) / 60000),
            seconds: Math.floor((diff % 60000) / 1000)
        };

        updateDigitNode(nodes.days, String(timeUnits.days).padStart(2, '0'));
        updateDigitNode(nodes.hours, String(timeUnits.hours).padStart(2, '0'));
        updateDigitNode(nodes.minutes, String(timeUnits.minutes).padStart(2, '0'));
        updateDigitNode(nodes.seconds, String(timeUnits.seconds).padStart(2, '0'));
    }

    calculateTime();
    const intervalId = setInterval(calculateTime, 1000);
}
