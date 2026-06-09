export const initStartScreen = () => {
  const container = document.getElementById('start-screen-component');
  
  if (!container) {
    document.body.style.overflow = '';
    console.warn('Start screen container #start-screen-component not found.');
    return;
  }

  const envelope = container.querySelector('.intro-envelope');

  if (!envelope) {
    console.warn('Start screen inner elements not found, removing empty container.');
    container.remove();
    document.body.style.overflow = '';
    return;
  }

  document.body.style.overflow = 'hidden';
  window.scrollTo(0, 0);

  let isOpened = false;

  const openEnvelope = () => {
    if (isOpened) return;
    isOpened = true;

    envelope.classList.add('intro-envelope--opened');

    document.body.style.overflow = '';

    // Запускаем анимации страницы почти сразу, пока конверт еще разъезжается
    if (typeof AOS !== 'undefined') {
      setTimeout(() => {
        AOS.init({
          duration: 800,
          once: false,
          mirror: true,
          offset: 50
        });
      }, 150); // 150ms задержки для идеальной синхронизации
    }

    // Safely start audio playback within the click's Promise context
    const audioTrack = document.querySelector('[data-audio-element="track"]');
    if (audioTrack && audioTrack.paused) {
      audioTrack.muted = false;
      const playPromise = audioTrack.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => console.warn('Audio play prevented:', error));
      }
    }

    // Restore focus to main heading or header for accessibility
    const restoreFocus = () => {
      const targetFocus = document.querySelector('.header__names') || document.querySelector('#header');
      if (targetFocus) {
        targetFocus.setAttribute('tabindex', '-1');
        targetFocus.focus({ preventScroll: true });
      }
    };

    // Clean up DOM on transition end to prevent memory leaks and blocking
    let isCleanedUp = false;
    const topFlap = envelope.querySelector('.intro-envelope__flap--top');

    const cleanup = () => {
      if (isCleanedUp) return;
      isCleanedUp = true;
      
      if (topFlap) {
        topFlap.removeEventListener('transitionend', onTransitionEnd);
      }
      
      container.remove();
      restoreFocus();
    };

    const onTransitionEnd = (e) => {
      if (e.propertyName === 'transform') {
        cleanup();
      }
    };

    if (topFlap) {
      topFlap.addEventListener('transitionend', onTransitionEnd);
    }

    // Fallback cleanup after transition duration (2.2s + buffer)
    setTimeout(cleanup, 2500);
  };

  container.addEventListener('click', openEnvelope, { once: true });
};

