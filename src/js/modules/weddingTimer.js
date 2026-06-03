import { getPluralForm } from './pluralize.js';

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

    const labels = {
        days: document.getElementById('label-days'),
        hours: document.getElementById('label-hours'),
        minutes: document.getElementById('label-minutes'),
        seconds: document.getElementById('label-seconds')
    };

    if (!nodes.days || !nodes.hours || !nodes.minutes || !nodes.seconds) return;

    // Словари склонений для каждой единицы времени
    const TIME_FORMS = {
        days: ['день', 'дня', 'дней'],
        hours: ['час', 'часа', 'часов'],
        minutes: ['минута', 'минуты', 'минут'],
        seconds: ['секунда', 'секунды', 'секунд']
    };

    // Универсальная функция обновления блока (цифры + лейбл)
    function updateBlock(key, rawValue) {
        const paddedValue = String(rawValue).padStart(2, '0');
        const node = nodes[key];
        const labelNode = labels[key];

        if (node.textContent !== paddedValue) {
            node.classList.add('countdown__digits--changing');
            setTimeout(() => {
                node.textContent = paddedValue;
                node.classList.remove('countdown__digits--changing');
            }, 120);
        }

        if (labelNode) {
            const pluralLabel = getPluralForm(rawValue, TIME_FORMS[key]);
            if (labelNode.textContent !== pluralLabel) {
                labelNode.textContent = pluralLabel;
            }
        }
    }

    let intervalId;

    function calculateTime() {
        const diff = targetTimestamp - Date.now();

        if (diff <= 0) {
            if (intervalId) clearInterval(intervalId);
            Object.keys(nodes).forEach(key => updateBlock(key, 0));
            return;
        }

        updateBlock('days', Math.floor(diff / 86400000));
        updateBlock('hours', Math.floor((diff % 86400000) / 3600000));
        updateBlock('minutes', Math.floor((diff % 3600000) / 60000));
        updateBlock('seconds', Math.floor((diff % 60000) / 1000));
    }

    calculateTime();
    intervalId = setInterval(calculateTime, 1000);
}
