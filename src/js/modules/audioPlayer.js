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

  // Принудительная загрузка аудио
  audioTrack.load();
  
  // Устанавливаем комфортную фоновую громкость на 30%
  audioTrack.volume = 0.3;

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
      return;
    }

    isPlaybackProcessing = true;
    
    try {
      const playPromise = audioTrack.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            isPlaybackProcessing = false;
            updatePlaybackUI();
          })
          .catch((error) => {
            isPlaybackProcessing = false;
            console.warn('Playback deferred or blocked:', error.message);
            updatePlaybackUI();
          });
      } else {
        isPlaybackProcessing = false;
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
    // Unmute и запуск в контексте жеста пользователя
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
        console.warn('Initial autoplay gesture blocked:', error.message);
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
    
    // Если еще не было жеста пользователя, помечаем его и снимаем mute
    if (!isInteracted) {
      isInteracted = true;
      removeGlobalTriggers();
      audioTrack.muted = false;
    }
    
    togglePlaybackState();
  };

  toggleButton.addEventListener('click', processButtonClick);

  document.addEventListener('click', processInitialGesture);
  document.addEventListener('keydown', processInitialGesture);
  document.addEventListener('pointerup', processInitialGesture);
  document.addEventListener('touchend', processInitialGesture);

  // Попытка запустить аудио при загрузке ( MEI / кэш пользователя )
  setTimeout(() => {
    processInitialGesture();
  }, 500);

  return () => {
    removeGlobalTriggers();
    toggleButton.removeEventListener('click', processButtonClick);
    executePause();
  };
};

