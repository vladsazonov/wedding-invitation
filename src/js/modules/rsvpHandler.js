import { parseGuestParameters } from './urlParser.js';

// Изолированная конфигурация Google Forms
const GOOGLE_FORM_CONFIG = {
  actionUrl: 'https://docs.google.com/forms/u/0/d/e/1FAIpQLScfi_YfaFSIoGJ5Xmc5rsSbrVAnmAU3RLdt7PAk5eczxwkntg/formResponse',
  entries: {
    guestId: 'entry.651581186',
    rawGuests: 'entry.624073897',
    attendance: 'entry.1213632584',
    alcohol: 'entry.1758539678',
    wishes: 'entry.158108047'
  }
};

export function initRsvpHandler() {
  const form = document.getElementById('wedding-form');
  const legendOutput = document.getElementById('rsvp-legend-target');
  
  if (!form) return;

  const urlParams = new URLSearchParams(window.location.search);
  const rawId = urlParams.get('id');
  const guestId = (rawId !== null && rawId !== undefined && rawId.trim() !== '') ? rawId.trim() : 'anonymous1';

  const hiddenIdInput = form.querySelector('.rsvp__hidden-id');
  const hiddenGuestsInput = form.querySelector('.rsvp__hidden-raw-guests');
  
  let params = { guests: [], formattedNames: '', rawGuests: 'Не указано' };
  try {
    // Защита от потенциального падения внешнего парсера
    params = parseGuestParameters() || params;
  } catch (error) {
    console.warn('Не удалось распарсить параметры гостей, применена заглушка', error);
  }

  if (hiddenIdInput) hiddenIdInput.value = guestId;
  if (hiddenGuestsInput) hiddenGuestsInput.value = params.rawGuests || 'Не указано';

  // Персонализация текстового узла
  if (legendOutput && params.guests) {
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

  setupAlcoholInteractions(form);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    processRsvpSubmission(form);
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

function processRsvpSubmission(form) {
  const submitBtn = document.getElementById('submit-btn');
  const successMessage = document.getElementById('success-message');
  if (!submitBtn || !successMessage) return;

  const formData = new FormData(form);
  const postData = new URLSearchParams();

  // Проверка: выбран ли хотя бы один вариант напитков (если вы хотите оставить вопрос обязательным)
  const checkedAlcohol = form.querySelectorAll('.rsvp-alcohol-item:checked');
  const attendanceValue = formData.get('attendance');
  if (checkedAlcohol.length === 0 && attendanceValue === 'Приду') {
    alert('Пожалуйста, выберите ваши предпочтения в напитках (или пункт "Не пью алкоголь")');
    return; // Останавливаем отправку
  }

  // Динамический маппинг стандартных полей из конфигурации (name="id" -> entry.XXXXXX)
  for (const [key, value] of formData.entries()) {
    const entryKey = GOOGLE_FORM_CONFIG.entries[key];
    if (entryKey && value && value.trim() !== '') {
      postData.append(entryKey, value.trim());
    }
  }

  // Для Google Форм чекбоксы (множественный выбор) нужно передавать отдельными параметрами с одним и тем же ключом
  checkedAlcohol.forEach(cb => {
    if (cb.value && cb.value.trim() !== '') {
      postData.append(GOOGLE_FORM_CONFIG.entries.alcohol, cb.value.trim());
    }
  });

  // Состояние загрузки кнопки
  submitBtn.disabled = true;
  submitBtn.textContent = 'Отправка...';

  fetch(GOOGLE_FORM_CONFIG.actionUrl, {
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

    // Повторное заполнение скрытого поля идентификатором после сброса формы
    const hiddenIdInput = form.querySelector('.rsvp__hidden-id');
    if (hiddenIdInput) {
      const urlParams = new URLSearchParams(window.location.search);
      const rawId = urlParams.get('id');
      hiddenIdInput.value = (rawId !== null && rawId !== undefined && rawId.trim() !== '') ? rawId.trim() : 'anonymous';
    }
  })
  .catch(error => {
    console.error('Ошибка отправки RSVP анкеты:', error);
    alert('Произошла ошибка сети. Пожалуйста, проверьте подключение к интернету и попробуйте отправить снова.');
  })
  .finally(() => {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Отправить ответ';
  });
}
