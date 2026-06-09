// Конфигурация вынесена в единую точку редактирования
const MAP_CONFIG = {
    latitude: 44.110056,
    longitude: 43.005946,
    zoom: 16
};

export const initMapHandler = () => {
    const openBtn = document.getElementById('openMapAction');
    const modal = document.getElementById('mapModalComponent');
    const closeBtn = document.getElementById('closeMapButtonAction');
    const overlay = document.getElementById('closeMapOverlayAction');
    const mapContainer = document.getElementById('mapContainer');

    if (!openBtn || !modal || !closeBtn || !overlay || !mapContainer) {
        return () => {};
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            toggleModal(false);
        }
    };

    const toggleModal = (isActive) => {
        if (isActive) {
            modal.classList.add('map-modal--active');
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden'; // Запрет скролла подложки
            injectMap();
            document.addEventListener('keydown', handleKeyDown);
        } else {
            modal.classList.remove('map-modal--active');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = ''; // Восстановление скролла страницы
            clearMap();
            document.removeEventListener('keydown', handleKeyDown);
        }
    };

    const injectMap = () => {
        if (mapContainer.children.length === 0) {
            const iframe = document.createElement('iframe');
            // Добавлен параметр &mode=usermashup для скрытия линеек, пробок и лишнего UI
            iframe.src = `https://yandex.ru/map-widget/v1/?ll=${MAP_CONFIG.longitude}%2C${MAP_CONFIG.latitude}&z=${MAP_CONFIG.zoom}&mode=usermashup&pt=${MAP_CONFIG.longitude}%2C${MAP_CONFIG.latitude},pm2blm`;
            iframe.setAttribute('allowfullscreen', 'true');
            iframe.setAttribute('title', 'Интерактивная карта');
            iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            mapContainer.appendChild(iframe);
        }
    };

    const clearMap = () => {
        mapContainer.replaceChildren(); // Более безопасный и быстрый метод очистки DOM
    };

    const openModal = () => toggleModal(true);
    const closeModal = () => toggleModal(false);

    openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    return () => {
        openBtn.removeEventListener('click', openModal);
        closeBtn.removeEventListener('click', closeModal);
        overlay.removeEventListener('click', closeModal);
        document.removeEventListener('keydown', handleKeyDown);
    };
};
