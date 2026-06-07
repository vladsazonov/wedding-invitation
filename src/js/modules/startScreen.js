export function initStartScreen() {
  const container = document.getElementById('start-screen-component');
  
  if (!container) {
    document.body.style.overflow = '';
    console.warn('Start screen container #start-screen-component not found.');
    return;
  }

  const intro = container.querySelector('.intro');
  const openBtn = container.querySelector('#open-invitation-btn');

  if (!intro || !openBtn) {
    console.warn('Start screen inner elements not found, removing empty container.');
    container.remove();
    document.body.style.overflow = '';
    return;
  }

  document.body.style.overflow = 'hidden';
  window.scrollTo(0, 0);

  const toggleIntro = () => {
    intro.classList.add('intro--hidden');
    
    document.body.style.overflow = '';

    setTimeout(() => {
      container.remove();
      if (typeof AOS !== 'undefined') AOS.refresh();
    }, 600); // 600ms match with CSS transition duration
  };

  openBtn.addEventListener('click', toggleIntro);
}
