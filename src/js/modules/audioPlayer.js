/**
 * Инициализирует модуль фонового плеера с защитой от блокировок Autoplay.
 * @returns {Function} Функция деинициализации модуля для предотвращения утечек памяти.
 */
export const initAudioPlayer = () => {
  const container = document.querySelector('.audio-control');
  const toggleButton = document.querySelector('[data-audio-action="toggle"]');
  const audioTrack = document.querySelector('[data-audio-element="track"]');

  if (!container || !toggleButton || !audioTrack) {
    console.warn('Audio elements not found:', { container, toggleButton, audioTrack });
    return () => {};
  }

  console.log('Audio track found, src:', audioTrack.src);
  
  // Переустанавливаем src для принудительной загрузки медиа (важно после innerHTML)
  const audioSrc = audioTrack.src;
  audioTrack.src = '';
  audioTrack.src = audioSrc;
  audioTrack.load();
  
  // Устанавливаем громкость на 30%
  audioTrack.volume = 0.3;
  
  console.log('Audio loaded, canPlayType:', audioTrack.canPlayType('audio/mpeg'));

  let isInteracted = false;
  let isPlaybackProcessing = false;

  const updatePlaybackUI = () => {
    const isPaused = audioTrack.paused;
    
    if (isPaused) {
      container.classList.remove('audio-control--playing');
      toggleButton.setAttribute('aria-pressed', 'false');
    } else {
      container.classList.add('audio-control--playing');
      toggleButton.setAttribute('aria-pressed', 'true');
    }
  };

  const executePlay = () => {
    if (isPlaybackProcessing) {
      console.log('Already processing playback, skipping');
      return;
    }

    isPlaybackProcessing = true;
    console.log('executePlay called, playing...', { paused: audioTrack.paused, muted: audioTrack.muted, readyState: audioTrack.readyState });
    
    try {
      const playPromise = audioTrack.play();
      console.log('play() returned:', playPromise);
      
      // Проверка на undefined страхует от падений в старых браузерах
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            isPlaybackProcessing = false;
            console.log('Play successful, paused:', audioTrack.paused);
            updatePlaybackUI();
          })
          .catch((error) => {
            isPlaybackProcessing = false;
            console.error('Play promise rejected:', error.name, error.message);
            updatePlaybackUI();
          });
      } else {
        isPlaybackProcessing = false;
        console.log('play() returned undefined');
        updatePlaybackUI();
      }
    } catch (error) {
      isPlaybackProcessing = false;
      console.error('Playback execution error:', error);
      updatePlaybackUI();
    }
  };

  const executePause = () => {
    audioTrack.pause();
    updatePlaybackUI();
  };

  const togglePlaybackState = () => {
    if (audioTrack.paused) {
      executePlay();
    } else {
      executePause();
    }
  };

  const processInitialGesture = () => {
    if (isInteracted || isPlaybackProcessing) {
      return;
    }

    isPlaybackProcessing = true;
    // Unmute и запусти синхронно в контексте user gesture
    audioTrack.muted = false;
    const playPromise = audioTrack.play();
    
    if (playPromise !== undefined) {
      playPromise.then(() => {
        isInteracted = true;
        isPlaybackProcessing = false;
        removeGlobalTriggers();
        updatePlaybackUI();
      }).catch((error) => {
        isPlaybackProcessing = false;
        console.warn('Play failed:', error.message);
        audioTrack.muted = true; // Сбрасываем mute, чтобы попробовать при следующем жесте
      });
    } else {
      isInteracted = true;
      isPlaybackProcessing = false;
      removeGlobalTriggers();
      updatePlaybackUI();
    }
  };

  const removeGlobalTriggers = () => {
    document.removeEventListener('click', processInitialGesture);
    document.removeEventListener('keydown', processInitialGesture);
    document.removeEventListener('pointerup', processInitialGesture);
    document.removeEventListener('touchend', processInitialGesture);
  };

  const processButtonClick = (event) => {
    event.stopPropagation();
    
    // Если еще не было жеста пользователя, помечаем его
    if (!isInteracted) {
      isInteracted = true;
      removeGlobalTriggers();
      // Unmute при первом взаимодействии
      audioTrack.muted = false;
    }
    
    // Синхронный вызов play/pause в контексте user gesture
    if (audioTrack.paused) {
      audioTrack.play().catch((error) => {
        console.warn('Play failed:', error.message);
      });
    } else {
      audioTrack.pause();
    }
    updatePlaybackUI();
  };

  toggleButton.addEventListener('click', processButtonClick);

  document.addEventListener('click', processInitialGesture);
  document.addEventListener('keydown', processInitialGesture);
  document.addEventListener('pointerup', processInitialGesture);
  document.addEventListener('touchend', processInitialGesture);

  // Попытка запустить аудио сразу при загрузке.
  // Сработает на ПК, если у пользователя высокий индекс вовлеченности (MEI) для вашего сайта,
  // либо если он уже кликал по сайту до этого и просто обновил страницу.
  // Небольшая задержка нужна, чтобы браузер успел отрисовать DOM.
  setTimeout(() => {
    processInitialGesture();
  }, 500);

  return () => {
    removeGlobalTriggers();
    toggleButton.removeEventListener('click', processButtonClick);
    executePause();
  };
};
