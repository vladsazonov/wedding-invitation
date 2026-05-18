export function initRsvpHandler() {
  const form = document.getElementById('rsvp-form');
  if (!form) return;

  const submitBtn = document.getElementById('submit-btn');
  const btnText = submitBtn.querySelector('.button__text');
  const btnLoader = submitBtn.querySelector('.button__loader');
  const successBlock = document.getElementById('success-block');

  // ЗАМЕНИТЕ НА ВАШИ ИДЕНТИФИКАТОРЫ ИЗ GOOGLE FORMS
  const FORM_ID = '1FAIpQLSfXXXXXXXXXXXXX'; 
  const ENTRY_NAME = 'entry.123456789';       // ID поля "Имя"
  const ENTRY_ATTENDANCE = 'entry.987654321'; // ID поля "Присутствие"

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Состояние Loading
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';

    const nameValue = document.getElementById('form-name').value;
    const attendanceValue = form.querySelector('input[name="attendance"]:checked').value;

    const url = `https://docs.google.com/forms/u/0/d/e/${FORM_ID}/formResponse`;
    
    // Формирование URL-encoded тела
    const formData = new URLSearchParams();
    formData.append(ENTRY_NAME, nameValue);
    formData.append(ENTRY_ATTENDANCE, attendanceValue);

    fetch(url, {
      method: 'POST',
      mode: 'no-cors', // Важно: Google Forms не отдает CORS заголовки, используем no-cors
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    })
    .then(() => {
      // При no-cors ответ всегда будет опущен, но переход в .then гарантирует отправку данных
      form.style.display = 'none';
      successBlock.classList.remove('rsvp__success--hidden');
    })
    .catch((error) => {
      console.error('Ошибка отправки формы:', error);
      alert('Произошла ошибка при отправке. Пожалуйста, попробуйте еще раз.');
    })
    .finally(() => {
      submitBtn.disabled = false;
      btnText.style.display = 'inline-block';
      btnLoader.style.display = 'none';
    });
  });
}
