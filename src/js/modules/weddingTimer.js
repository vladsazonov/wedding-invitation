export function initWeddingTimer() {
  // Установка целевой даты: 17 августа 2026 года, 00:00:00
  const targetDate = new Date('2026-08-17T00:00:00').getTime();

  const daysEl = document.getElementById('timer-days');
  const hoursEl = document.getElementById('timer-hours');
  const minutesEl = document.getElementById('timer-minutes');
  const secondsEl = document.getElementById('timer-seconds');

  if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;

  function updateTimer() {
    const now = new Date().getTime();
    const difference = targetDate - now;

    if (difference <= 0) {
      clearInterval(timerInterval);
      document.getElementById('wedding-timer').innerHTML = '<div class="countdown__finished">Этот счастливый день настал!</div>';
      return;
    }

    // Расчет времени
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    // Вывод с добавлением ведущего нуля
    daysEl.textContent = days < 10 ? `0${days}` : days;
    hoursEl.textContent = hours < 10 ? `0${hours}` : hours;
    minutesEl.textContent = minutes < 10 ? `0${minutes}` : minutes;
    secondsEl.textContent = seconds < 10 ? `0${seconds}` : seconds;
  }

  // Запуск и обновление каждую секунду
  updateTimer();
  const timerInterval = setInterval(updateTimer, 1000);
}
