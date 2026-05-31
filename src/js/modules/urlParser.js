export function initDynamicContent() {
  const params = new URLSearchParams(window.location.search);
  const guestsParam = params.get('guests');
  const fmt = params.get('fmt') || 'formal';

  const namesContainer = document.getElementById('guest-names-container');
  const invitationText = document.getElementById('dynamic-invitation-text');

  if (!guestsParam) {
    if (namesContainer) namesContainer.textContent = 'Дорогие гости';
    return;
  }

  // Разделение гостей по запятой
  const guestsArray = guestsParam.split(',').map(name => name.trim()).filter(Boolean);
  
  // Рендер имен через запятую и амперсанд
  let formattedNames = '';
  if (guestsArray.length === 1) {
    formattedNames = guestsArray[0];
  } else if (guestsArray.length === 2) {
    formattedNames = `${guestsArray[0]} и ${guestsArray[1]}`;
  } else {
    const last = guestsArray.pop();
    formattedNames = `${guestsArray.join(', ')} и ${last}`;
  }

  if (namesContainer) namesContainer.textContent = formattedNames;

  // Логика множественного/единственного числа
  if (invitationText) {
    if (guestsArray.length > 0 || guestsParam.split(',').length > 1) {
      invitationText.textContent = `Скоро наступит особенный для нас момент, и мы мечтаем разделить его с вами. Будем рады видеть вас на нашем венчании!`;
    } else {
      if (fmt === 'sg') {
        invitationText.textContent = `Скоро наступит особенный для нас момент, и я мечтаю разделить его с тобой. Буду рада видеть тебя на нашем венчании!`;
      } else {
        invitationText.textContent = `Скоро наступит особенный для нас момент, и мы мечтаем разделить его с Вами. Будем рады видеть Вас на нашем венчании!`;
      }
    }
  }
}

export function parseGuestParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  const rawGuests = urlParams.get('guests');
  const id = urlParams.get('id');

  return {
    guests: rawGuests ? rawGuests.split(',').map(name => name.trim()).filter(Boolean) : [],
    rawGuests: rawGuests || '',
    id: id || ''
  };
}
