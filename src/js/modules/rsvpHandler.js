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

function escapeHtml(unsafe) {
  return (unsafe || '').toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function initRsvpHandler() {
  const form = document.getElementById('wedding-form');
  if (!form) return;

  // ОПТИМИЗАЦИЯ DOM: Единоразово кэшируем узлы, чтобы не дергать document.getElementById при каждом клике
  const elements = {
    legendOutput: document.getElementById('rsvp-legend-target'),
    submitBtn: document.getElementById('submit-btn'),
    successMessage: document.getElementById('success-message'),
    successText: document.getElementById('success-text'),
    successPhoto: document.getElementById('success-photo-wrapper'),
    editBtn: document.getElementById('edit-btn'),
    hiddenIdInput: form.querySelector('.rsvp__hidden-id'),
    hiddenGuestsInput: form.querySelector('.rsvp__hidden-raw-guests'),
    alcoholCheckboxes: form.querySelectorAll('.rsvp-alcohol-item'),
    noAlcoholCb: form.querySelector('#alcohol-absent'),
    wishesTextarea: form.querySelector('#rsvp-wishes'),
    labelAttendYes: document.getElementById('label-attend-yes'),
    labelAttendNo: document.getElementById('label-attend-no'),
    labelAttendMaybe: document.getElementById('label-attend-maybe')
  };

  const urlParams = new URLSearchParams(window.location.search);
  const rawId = urlParams.get('id');
  const guestId = (rawId !== null && rawId !== undefined && rawId.trim() !== '') ? rawId.trim() : 'anonymous1';

  let params = { guests: [], formattedNames: '', rawGuests: 'Не указано' };
  try {
    // Защита от потенциального падения внешнего парсера
    params = parseGuestParameters() || params;
  } catch (error) {
    console.warn('Не удалось распарсить параметры гостей, применена заглушка', error);
  }

  if (elements.hiddenIdInput) elements.hiddenIdInput.value = guestId;
  if (elements.hiddenGuestsInput) elements.hiddenGuestsInput.value = params.rawGuests || 'Не указано';

  // Персонализация текстового узла
  if (elements.legendOutput && params.guests) {
    const namesHtml = params.guests.length > 0
      ? `<span class="rsvp__highlight-name">${escapeHtml(params.formattedNames)}</span>` 
      : '';

    const deadlineBlock = `<span class="rsvp__deadline">Просьба ответить до <span class="rsvp__highlight-date">17.07.2026</span></span>`;

    if (params.guests.length === 1) {
      elements.legendOutput.innerHTML = `Наш дорогой гость,<br>${namesHtml}Будем рады видеть тебя!${deadlineBlock}`;
    } else if (params.guests.length > 1) {
      elements.legendOutput.innerHTML = `Наши дорогие гости,<br>${namesHtml}Будем рады видеть вас!${deadlineBlock}`;
    } else {
      elements.legendOutput.innerHTML = `Наши дорогие гости!<br><br>Будем рады видеть вас!${deadlineBlock}`;
    }

    // Множественное число для вариантов присутствия, если гостей 2 и больше
    if (params.guests.length > 1) {
      if (elements.labelAttendYes) elements.labelAttendYes.textContent = 'Мы придем';
      if (elements.labelAttendNo) elements.labelAttendNo.textContent = 'Не сможем';
      if (elements.labelAttendMaybe) elements.labelAttendMaybe.textContent = 'Сообщим позже';
    }
  }

  form.addEventListener('change', (event) => {
    const target = event.target;

    // Логика блокировки: если гость нажал "Не приду"
    if (target.name === 'attendance') {
      const isNotComing = target.value === 'Не приду';

      elements.alcoholCheckboxes.forEach(cb => {
        cb.disabled = isNotComing;
        if (isNotComing) cb.checked = false;
      });

      if (elements.wishesTextarea) {
        elements.wishesTextarea.disabled = isNotComing;
        if (isNotComing) elements.wishesTextarea.value = '';
      }
    }

    // Логика чекбокса "Не пью алкоголь"
    if (target.classList.contains('rsvp-alcohol-item') && elements.noAlcoholCb) {
      if (target === elements.noAlcoholCb && target.checked) {
        elements.alcoholCheckboxes.forEach(cb => {
          if (cb !== elements.noAlcoholCb) cb.checked = false;
        });
      } else if (target !== elements.noAlcoholCb && target.checked) {
        elements.noAlcoholCb.checked = false;
      }
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    processRsvpSubmission(form, elements);
  });

  if (elements.editBtn && elements.successMessage) {
    elements.editBtn.addEventListener('click', () => {
      form.classList.remove('rsvp__form--hidden');
      elements.successMessage.classList.add('rsvp__success--hidden');
    });
  }
}

function processRsvpSubmission(form, elements) {
  if (!elements.submitBtn || !elements.successMessage) return;

  const formData = new FormData(form);
  const postData = new URLSearchParams();

  const checkedAlcoholList = Array.from(elements.alcoholCheckboxes).filter(cb => cb.checked);
  const attendanceValue = formData.get('attendance');
  
  if (checkedAlcoholList.length === 0 && attendanceValue === 'Приду') {
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
  const alcoholEntryKey = GOOGLE_FORM_CONFIG.entries.alcohol;
  if (alcoholEntryKey) {
    checkedAlcoholList.forEach(cb => {
      if (cb.value && cb.value.trim() !== '') {
        postData.append(alcoholEntryKey, cb.value.trim());
      }
    });
  }

  // Состояние загрузки кнопки
  elements.submitBtn.disabled = true;
  elements.submitBtn.textContent = 'Отправка...';

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
    
    if (elements.successText) {
      elements.successText.style.display = attendanceValue === 'Не приду' ? 'none' : '';
    }
    if (elements.successPhoto) {
      elements.successPhoto.style.display = attendanceValue === 'Не приду' ? 'none' : '';
    }
    
    elements.successMessage.classList.remove('rsvp__success--hidden');
  })
  .catch(error => {
    console.error('Ошибка отправки RSVP анкеты:', error);
    alert('Произошла ошибка сети. Пожалуйста, проверьте подключение к интернету и попробуйте отправить снова.');
  })
  .finally(() => {
    elements.submitBtn.disabled = false;
    elements.submitBtn.textContent = 'Отправить ответ';
  });
}
