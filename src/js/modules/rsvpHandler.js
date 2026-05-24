export function initRsvpHandler() {
  const form = document.getElementById('rsvp-form');
  const hiddenNameInput = document.getElementById('form-names-hidden');
  const submitBtn = document.getElementById('submit-btn');
  const successBlock = document.getElementById('success-block');

  if (!form || !hiddenNameInput || !submitBtn || !successBlock) return;

  // Твои технические заглушки Google Forms (замени entry.XXXXXXXXX при деплое)
  const GOOGLE_FORM_CONFIG = {
    url: 'https://docs.google.com/forms/u/0/d/e/1FAIpQLSfXXXXXXXXXXXXX/formResponse',
    entries: {
      names: 'entry.XXXXXXXXX',       
      attendance: 'entry.XXXXXXXXX',  
      allergy: 'entry.XXXXXXXXX',     
      wishes: 'entry.XXXXXXXXX'       
    }
  };

  function parseAndPersonalizeGreeting() {
    const urlParams = new URLSearchParams(window.location.search);
    const guestsParam = urlParams.get('guests');
    const fmtParam = urlParams.get('fmt');

    const greetingElement = document.querySelector('[data-content="guest-greeting"]');
    const namesElement = document.querySelector('[data-content="guest-names"]');

    if (!guestsParam) {
      if (greetingElement) greetingElement.textContent = 'Дорогие';
      if (namesElement) namesElement.textContent = 'гости';
      hiddenNameInput.value = 'Дорогие гости';
      applyGrammar(true, false);
      return;
    }

    const guestsArray = guestsParam.split(',').map(name => name.trim()).filter(Boolean);
    let formattedNames = '';

    if (guestsArray.length > 2) {
      const lastGuest = guestsArray.pop();
      formattedNames = `${guestsArray.join(', ')} и ${lastGuest}`;
    } else {
      formattedNames = guestsArray.join(' и ');
    }

    // Сохраняем итоговую строку имён в скрытый инпут для отправки в Google Form
    hiddenNameInput.value = formattedNames;
    if (namesElement) namesElement.textContent = formattedNames;

    const isPlural = guestsArray.length > 1 || fmtParam === 'pl';
    const isFormal = fmtParam === 'formal';

    // Склоняем заголовок-приветствие
    if (greetingElement) {
      if (isPlural) {
        greetingElement.textContent = 'Дорогие';
      } else if (isFormal) {
        greetingElement.textContent = 'Уважаемый(-ая)';
      } else {
        greetingElement.textContent = 'Дорогой(-ая)';
      }
    }

    applyGrammar(isPlural, isFormal);
  }

  function applyGrammar(isPlural, isFormal) {
    const titleQuestion = document.getElementById('rsvp-title-question');
    const subtitle = document.getElementById('rsvp-subtitle');
    const attendanceLabel = document.getElementById('attendance-label');
    const statusYes = document.getElementById('status-yes-text');
    const statusNo = document.getElementById('status-no-text');
    const successDynamicText = document.getElementById('success-dynamic-text');

    if (isPlural) {
      if (titleQuestion) titleQuestion.textContent = 'разделите ли вы с нами этот праздничный день?';
      if (subtitle) subtitle.textContent = 'Пожалуйста, ответьте на несколько вопросов, чтобы мы могли учесть все детали при подготовке.';
      if (attendanceLabel) attendanceLabel.textContent = 'Ваш совместный ответ';
      if (statusYes) statusYes.textContent = 'Да, мы с удовольствием придем';
      if (statusNo) statusNo.textContent = 'К сожалению, мы не сможем приехать';
      if (successDynamicText) successDynamicText.textContent = 'Мы очень-очень ждем встречи с вашей прекрасной компанией!';
    } else {
      // Единственное число (Ты или официальное Вы)
      if (titleQuestion) {
        titleQuestion.textContent = isFormal 
          ? 'разделите ли Вы с нами этот праздничный день?' 
          : 'разделишь ли ты с нами этот праздничный день?';
      }
      if (subtitle) {
        subtitle.textContent = isFormal
          ? 'Пожалуйста, ответьте на несколько вопросов, чтобы мы могли учесть все детали при подготовке.'
          : 'Пожалуйста, ответь на пару вопросов, это поможет нам при подготовке.';
      }
      if (attendanceLabel) attendanceLabel.textContent = 'Твой ответ';
      if (statusYes) statusYes.textContent = isFormal ? 'Да, я с удовольствием приду' : 'Да, я приду с радостью!';
      if (statusNo) statusNo.textContent = isFormal ? 'К сожалению, я не смогу присутствовать' : 'К сожалению, не смогу прийти';
      if (successDynamicText) {
        successDynamicText.textContent = isFormal 
          ? 'С нетерпением ждем встречи с Вами!' 
          : 'С нетерпением ждем встречи с тобой!';
      }
    }
  }

  async function submitRsvp(event) {
    event.preventDefault();

    const selectedAttendance = form.querySelector('input[name="attendance"]:checked');
    if (!selectedAttendance) return;

    const allergyInput = document.getElementById('form-allergy');
    const wishesInput = document.getElementById('form-wishes');
    const submitText = submitBtn.querySelector('.button__text');
    const submitLoader = submitBtn.querySelector('.button__loader');

    submitBtn.disabled = true;
    if (submitText) submitText.style.display = 'none';
    if (submitLoader) submitLoader.style.display = 'inline-block';

    const bodyParams = new URLSearchParams();
    bodyParams.append(GOOGLE_FORM_CONFIG.entries.names, hiddenNameInput.value);
    bodyParams.append(GOOGLE_FORM_CONFIG.entries.attendance, selectedAttendance.value);
    bodyParams.append(GOOGLE_FORM_CONFIG.entries.allergy, allergyInput ? allergyInput.value.trim() : '');
    bodyParams.append(GOOGLE_FORM_CONFIG.entries.wishes, wishesInput ? wishesInput.value.trim() : '');

    try {
      await fetch(GOOGLE_FORM_CONFIG.url, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: bodyParams.toString()
      });

      form.style.display = 'none';
      successBlock.classList.remove('rsvp__success--hidden');
    } catch (error) {
      console.error('Ошибка отправки формы:', error);
      submitBtn.disabled = false;
      if (submitText) submitText.style.display = 'inline-block';
      if (submitLoader) submitLoader.style.display = 'none';
      alert('Произошла техническая ошибка. Пожалуйста, попробуйте отправить ответ снова.');
    }
  }

  // Инициализация
  parseAndPersonalizeGreeting();
  form.addEventListener('submit', submitRsvp);
}
