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

const processRsvpSubmission = (form, elements) => {
  if (!elements.submitBtn || !elements.successMessage) {
    return;
  }

  const formData = new FormData(form);
  const postData = new URLSearchParams();

  const checkedAlcoholList = Array.from(elements.alcoholCheckboxes).filter(checkbox => { return checkbox.checked; });
  const attendanceValue = formData.get('attendance');
  
  if (!attendanceValue) {
    if (elements.attendanceError) {
      elements.attendanceError.textContent = 'Пожалуйста, выберите один из вариантов присутствия';
      elements.attendanceError.classList.add('rsvp__error--visible');
      elements.attendanceError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  } else {
    if (elements.attendanceError) {
      elements.attendanceError.classList.remove('rsvp__error--visible');
    }
  }

  if (checkedAlcoholList.length === 0 && (attendanceValue === 'Приду' || attendanceValue === 'Сообщу позже')) {
    if (elements.alcoholError) {
      elements.alcoholError.textContent = 'Пожалуйста, выберите ваши предпочтения в напитках (или "Не пью алкоголь")';
      elements.alcoholError.classList.add('rsvp__error--visible');
      elements.alcoholError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  } else {
    if (elements.alcoholError) {
      elements.alcoholError.classList.remove('rsvp__error--visible');
    }
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

  const formHeight = form.offsetHeight;

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
    
    if (elements.successMessage) {
      if (attendanceValue !== 'Не приду') {
        elements.successMessage.style.minHeight = `${formHeight}px`;
      } else {
        elements.successMessage.style.minHeight = '';
      }
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
};

export const initRsvpHandler = () => {
  const form = document.getElementById('wedding-form');
  if (!form) return () => {};

  // ОПТИМИЗАЦИЯ DOM: Единоразово кэшируем узлы, чтобы не дергать document.getElementById при каждом клике
  const elements = {
    introTitle: document.getElementById('rsvp-intro-title'),
    guestNames: document.getElementById('rsvp-guest-names'),
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
    labelAttendMaybe: document.getElementById('label-attend-maybe'),
    attendanceError: document.getElementById('rsvp-attendance-error'),
    alcoholError: document.getElementById('rsvp-alcohol-error')
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

  const isFallbackMode = !params.guests || params.guests.length === 0;

  if (isFallbackMode) {
    // Fallback: нет данных о гостях — показываем универсальное приветствие
    if (elements.introTitle) {
      elements.introTitle.textContent = 'Дорогие гости!';
    }
    if (elements.guestNames) {
      elements.guestNames.textContent = '';
      elements.guestNames.style.display = 'none';
    }
    // Форма в множественном числе
    if (elements.labelAttendYes) elements.labelAttendYes.textContent = 'Мы придем';
    if (elements.labelAttendNo) elements.labelAttendNo.textContent = 'Не сможем';
    if (elements.labelAttendMaybe) elements.labelAttendMaybe.textContent = 'Сообщим позже';
  } else {
    if (elements.guestNames) {
      elements.guestNames.textContent = params.formattedNames;
      elements.guestNames.style.display = '';
    }

    if (elements.introTitle) {
      elements.introTitle.textContent = params.guests.length === 1
        ? 'Наш дорогой гость'
        : 'Наши дорогие гости';
    }

    if (params.guests.length > 1) {
      if (elements.labelAttendYes) elements.labelAttendYes.textContent = 'Мы придем';
      if (elements.labelAttendNo) elements.labelAttendNo.textContent = 'Не сможем';
      if (elements.labelAttendMaybe) elements.labelAttendMaybe.textContent = 'Сообщим позже';
    }
  }

  const handleFormChange = (event) => {
    const target = event.target;

    // Скрываем ошибки при вводе/выборе
    if (target.name === 'attendance' && elements.attendanceError) {
      elements.attendanceError.classList.remove('rsvp__error--visible');
    }
    if (target.classList.contains('rsvp-alcohol-item') && elements.alcoholError) {
      elements.alcoholError.classList.remove('rsvp__error--visible');
    }

    // Логика блокировки: если гость нажал "Не приду"
    if (target.name === 'attendance') {
      const isNotComing = target.value === 'Не приду';

      elements.alcoholCheckboxes.forEach(checkbox => {
        checkbox.disabled = isNotComing;
        if (isNotComing) {
          checkbox.checked = false;
        }
      });

      if (elements.wishesTextarea) {
        elements.wishesTextarea.disabled = isNotComing;
        if (isNotComing) {
          elements.wishesTextarea.value = '';
        }
      }
    }

    // Логика чекбокса "Не пью алкоголь"
    if (target.classList.contains('rsvp-alcohol-item') && elements.noAlcoholCb) {
      if (target === elements.noAlcoholCb && target.checked) {
        elements.alcoholCheckboxes.forEach(checkbox => {
          if (checkbox !== elements.noAlcoholCb) {
            checkbox.checked = false;
          }
        });
      } else if (target !== elements.noAlcoholCb && target.checked) {
        elements.noAlcoholCb.checked = false;
      }
    }
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();
    processRsvpSubmission(form, elements);
  };

  const handleEditClick = () => {
    form.classList.remove('rsvp__form--hidden');
    elements.successMessage.classList.add('rsvp__success--hidden');
    elements.successMessage.style.minHeight = '';
  };

  form.addEventListener('change', handleFormChange);
  form.addEventListener('submit', handleFormSubmit);

  if (elements.editBtn && elements.successMessage) {
    elements.editBtn.addEventListener('click', handleEditClick);
  }

  return () => {
    form.removeEventListener('change', handleFormChange);
    form.removeEventListener('submit', handleFormSubmit);
    if (elements.editBtn) {
      elements.editBtn.removeEventListener('click', handleEditClick);
    }
  };
};
