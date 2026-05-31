import { parseGuestParameters } from './urlParser.js';

export function initRsvpHandler() {
  const form = document.getElementById('wedding-form');
  const legendOutput = document.getElementById('rsvp-legend-target');
  const hiddenIdInput = document.getElementById('google-entry-id');
  const hiddenGuestsInput = document.getElementById('google-entry-raw-guests');
  
  if (!form) return;

  const params = parseGuestParameters();

  // Персонализация текстового узла
  if (legendOutput) {
    const namesHtml = params.guests.length > 0 
      ? `<span class="rsvp__highlight-name">${params.formattedNames}</span>` 
      : '';

    if (params.guests.length === 1) {
      legendOutput.innerHTML = `Наш дорогой гость,<br>${namesHtml}Будем рады видеть тебя! Пожалуйста, подтверди присутствие до <span class="rsvp__highlight-date">17.07.2026</span>:`;
    } else if (params.guests.length > 1) {
      legendOutput.innerHTML = `Наши дорогие гости,<br>${namesHtml}Будем рады видеть вас! Пожалуйста, подтвердите присутствие до <span class="rsvp__highlight-date">17.07.2026</span>:`;
    } else {
      legendOutput.innerHTML = `Наши дорогие гости!<br><br>Будем рады видеть вас! Пожалуйста, подтвердите присутствие до <span class="rsvp__highlight-date">17.07.2026</span>:`;
    }
  }

  // Наполнение скрытых инпутов Идентификатором и Сырой строкой гостей
  if (hiddenIdInput) hiddenIdInput.value = params.id;
  if (hiddenGuestsInput) hiddenGuestsInput.value = params.rawGuests;

  setupAlcoholInteractions(form);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submitRsvp(form);
  });
}

function setupAlcoholInteractions(form) {
  const noAlcoholCb = form.querySelector('#alcohol-absent');
  const itemsCbs = form.querySelectorAll('.rsvp-alcohol-item');

  if (!noAlcoholCb) return;

  noAlcoholCb.addEventListener('change', () => {
    if (noAlcoholCb.checked) {
      itemsCbs.forEach(cb => {
        if (cb !== noAlcoholCb) cb.checked = false;
      });
    }
  });

  itemsCbs.forEach(cb => {
    if (cb !== noAlcoholCb) {
      cb.addEventListener('change', () => {
        if (cb.checked && noAlcoholCb.checked) {
          noAlcoholCb.checked = false;
        }
      });
    }
  });
}

function submitRsvp(form) {
  const submitBtn = document.getElementById('submit-btn');
  const successMessage = document.getElementById('success-message');
  if (!submitBtn || !successMessage) return;

  const FORM_ID = '1FAIpQLSfXXXXXXXXXXXXX'; // Замените на реальный хеш вашей Google Формы
  const actionUrl = `https://docs.google.com/forms/u/0/d/e/${FORM_ID}/formResponse`;

  const formData = new FormData(form);
  const postData = new URLSearchParams();

  // Собираем массив выбранных напитков в одну строку (Best Practice)
  const selectedDrinks = [];
  form.querySelectorAll('.rsvp-alcohol-item:checked').forEach(cb => {
    selectedDrinks.push(cb.value);
  });
  
  // Перенос стандартных полей из разметки
  for (const [key, value] of formData.entries()) {
    if (key) postData.append(key, value);
  }

  // Добавление сформированной строки алкоголя (замените на ваш entry.ID для напитков)
  postData.append('entry.2000002', selectedDrinks.length > 0 ? selectedDrinks.join(', ') : 'Не указано');

  // Состояние загрузки кнопки
  submitBtn.disabled = true;
  submitBtn.textContent = 'Отправка...';

  fetch(actionUrl, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: postData.toString()
  })
  .then(() => {
    form.classList.add('rsvp__form--hidden');
    successMessage.classList.remove('rsvp__success--hidden');
    form.reset();
  })
  .catch(error => {
    console.error('Ошибка отправки RSVP анкеты:', error);
    alert('Произошла ошибка сети. Пожалуйста, попробуйте отправить снова.');
  })
  .finally(() => {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Отправить ответ';
  });
}
