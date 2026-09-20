let scale = 1;
let posX = 0;
let posY = 0;
let isPanning = false;
let startX, startY;
let currentStep = 0;
let initialPinchDist = 0;
let initialScale = 1;

let frames;
let totalSteps;

const viewport = document.getElementById('viewport');
const gallery = document.getElementById('gallery');
const uiPanel = document.getElementById('uiPanel');
const galleryOpName = document.getElementById('galleryOpName');
const scrollbarTrack = document.getElementById('scrollbarTrack');
const scrollbarThumb = document.getElementById('scrollbarThumb');

function initGallery() {
    frames = document.querySelectorAll('.frame');
    totalSteps = frames.length;
    const GALLERY_VERSION = totalSteps;

    const savedVersion = parseInt(localStorage.getItem('galleryVersion')) || 0;

    if (savedVersion === GALLERY_VERSION && savedVersion !== 0) {
        currentStep = parseInt(localStorage.getItem('galleryPos')) || 0;
    } else {
        currentStep = 0;
        localStorage.setItem('galleryVersion', GALLERY_VERSION);
        localStorage.setItem('galleryPos', 0);
    }

    gallery.style.transition = 'none';
    gallery.style.transform = `translateX(-${currentStep * 100}vw)`;

    // Inizializza la nuova barra di scorrimento interattiva al posto delle miniature
    initCustomScrollbar();

    requestAnimationFrame(() => {
        gallery.style.transition = '';
        updateDisplay();
    });
}

// --- Gestione della barra di scorrimento personalizzata ---
let isDraggingThumb = false;
let dragStartX = 0;
let dragStartThumbLeft = 0;

function getThumbLeft() {
    // Legge la posizione X corrente del thumb dal transform applicato
    const t = scrollbarThumb.style.transform || '';
    const m = t.match(/translateX\(([-\d.]+)px\)/);
    return m ? parseFloat(m[1]) : 0;
}

function initCustomScrollbar() {
    if (!scrollbarTrack || !scrollbarThumb) return;

    // Click o tocco diretto sulla traccia grigia per saltare al punto
    scrollbarTrack.addEventListener('pointerdown', (e) => {
        if (e.target === scrollbarThumb) return;
        const rect = scrollbarTrack.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const thumbWidth = scrollbarThumb.offsetWidth;
        const maxTranslate = rect.width - thumbWidth;

        if (maxTranslate <= 0) return;

        let targetRatio = (clickX - thumbWidth / 2) / maxTranslate;
        targetRatio = Math.max(0, Math.min(1, targetRatio));

        const targetStep = Math.round(targetRatio * (totalSteps - 1));
        if (targetStep !== currentStep) {
            resetZoom();
            currentStep = targetStep;
            gallery.style.transition = '';
            updateDisplay();
        }
    });

    // Trascinamento del cursore
    scrollbarThumb.addEventListener('pointerdown', (e) => {
        isDraggingThumb = true;
        dragStartX = e.clientX;

        // Legge la posizione reale del thumb (non offsetLeft, che è 0)
        dragStartThumbLeft = getThumbLeft();

        scrollbarThumb.classList.add('dragging');
        scrollbarThumb.setPointerCapture(e.pointerId);
        e.stopPropagation();
        e.preventDefault();

        // Disattiva la transizione del muro: durante il drag segue il dito in tempo reale
        gallery.style.transition = 'none';
    });

    scrollbarThumb.addEventListener('pointermove', (e) => {
        if (!isDraggingThumb) return;
        const rect = scrollbarTrack.getBoundingClientRect();
        const thumbWidth = scrollbarThumb.offsetWidth;
        const maxTranslate = rect.width - thumbWidth;
        if (maxTranslate <= 0) return;

        let deltaX = e.clientX - dragStartX;
        let newLeft = dragStartThumbLeft + deltaX;
        newLeft = Math.max(0, Math.min(maxTranslate, newLeft));

        // Posizione frazionaria (0 .. totalSteps-1) -> movimento fluido del muro
        const ratio = newLeft / maxTranslate;
        const fractionalStep = ratio * (totalSteps - 1);

        // Il muro segue in tempo reale
        gallery.style.transform = `translateX(-${fractionalStep * 100}vw)`;

        // Thumb esattamente sotto il puntatore, senza transizione
        scrollbarThumb.style.transform = `translateX(${newLeft}px)`;

        // Aggiorna la label al dipinto più vicino
        const nearestStep = Math.round(fractionalStep);
        if (nearestStep !== currentStep) {
            currentStep = nearestStep;
            updateThumbnailsUI();
        }
    });

    const endThumbDrag = (e) => {
        if (!isDraggingThumb) return;
        isDraggingThumb = false;
        scrollbarThumb.classList.remove('dragging');
        if (scrollbarThumb.hasPointerCapture(e.pointerId)) {
            scrollbarThumb.releasePointerCapture(e.pointerId);
        }
        resetZoom();

        // Ripristina la transizione CSS: l'effetto camminata torna attivo
        gallery.style.transition = '';

        // Snap allo step intero più vicino, animato dalla transizione CSS
        updateDisplay();
    };

    scrollbarThumb.addEventListener('pointerup', endThumbDrag);
    scrollbarThumb.addEventListener('pointercancel', endThumbDrag);
}

function updateThumbnailsUI() {
    if (frames && frames[currentStep] && galleryOpName) {
        const activeFrame = frames[currentStep];
        const labelNum = activeFrame.querySelector('.label-number');
        const labelTitle = activeFrame.querySelector('.label-title');

        let numText = labelNum ? labelNum.textContent.trim() : '';
        let titleText = labelTitle ? labelTitle.textContent.trim() : '';

        if (numText && titleText) {
            galleryOpName.textContent = `${numText} - ${titleText}`;
        } else if (titleText) {
            galleryOpName.textContent = titleText;
        } else {
            galleryOpName.textContent = numText || 'Opera';
        }
    }

    if (scrollbarTrack && scrollbarThumb && totalSteps > 1 && !isDraggingThumb) {
        const trackWidth = scrollbarTrack.clientWidth;
        const thumbWidth = scrollbarThumb.clientWidth;
        const maxTranslate = trackWidth - thumbWidth;

        if (maxTranslate > 0) {
            const ratio = currentStep / (totalSteps - 1);
            scrollbarThumb.style.transform = `translateX(${ratio * maxTranslate}px)`;
        }
    }
}

function updateTransform(el) {
    if (!el) return;

    const zoomStartPan = 1.1;
    const maxZoom = 3;
    const panFactor = Math.max(0, (scale - zoomStartPan) / (maxZoom - zoomStartPan));
    const clampedPanFactor = Math.min(1, panFactor);

    const limitX = (el.offsetWidth * (scale - 1)) / 0.8;
    const limitY = (el.offsetHeight * (scale - 1)) / 0.8;

    posX = Math.max(-limitX * clampedPanFactor, Math.min(limitX * clampedPanFactor, posX));
    posY = Math.max(-limitY * clampedPanFactor, Math.min(limitY * clampedPanFactor, posY));

    el.style.transform = `translate(calc(-50% + ${posX}px), calc(-50% + ${posY}px)) scale(${scale})`;

    const isZoomed = scale > 1.05;
    document.body.classList.toggle('zoomed', isZoomed);

    document.querySelectorAll('nav, .nav-main, .nav-main2, #uiPanel, .audio-control').forEach(e => {
        if (e) e.style.display = isZoomed ? 'none' : '';
    });
}

function resetZoom() {
    scale = 1;
    posX = 0;
    posY = 0;
    document.body.classList.remove('zoomed');
    if (uiPanel) uiPanel.style.display = 'flex';

    const activeFrame = frames[currentStep];
    if (activeFrame) updateTransform(activeFrame);
}

viewport.addEventListener('wheel', e => {
    const activeFrame = frames[currentStep];
    if (!activeFrame) return;

    e.preventDefault();
    scale = Math.min(Math.max(scale + (e.deltaY > 0 ? -0.1 : 0.1), 1), 2);
    if (scale === 1) { posX = 0; posY = 0; }

    updateTransform(activeFrame);
}, { passive: false });

viewport.addEventListener('mousedown', e => {
    if (e.button !== 0 || scale <= 1) return;
    isPanning = true;
    viewport.classList.add('grabbing');
    startX = e.clientX - posX;
    startY = e.clientY - posY;
});

window.addEventListener('mousemove', e => {
    if (!isPanning) return;
    const activeFrame = frames[currentStep];
    if (!activeFrame) return;
    posX = e.clientX - startX;
    posY = e.clientY - startY;
    updateTransform(activeFrame);
});

window.addEventListener('mouseup', () => {
    isPanning = false;
    viewport.classList.remove('grabbing');
});

viewport.addEventListener('touchstart', e => {
    if (e.touches.length === 1 && scale > 1) {
        isPanning = true;
        startX = e.touches[0].clientX - posX;
        startY = e.touches[0].clientY - posY;
    }
}, { passive: false });

viewport.addEventListener('touchmove', e => {
    const activeFrame = frames[currentStep];
    if (!activeFrame) return;

    if (e.touches.length === 1 && isPanning) {
        e.preventDefault();
        posX = e.touches[0].clientX - startX;
        posY = e.touches[0].clientY - startY;
        updateTransform(activeFrame);
    }
}, { passive: false });

function loadImage(img, frame, priority) {
    if (!img || !img.dataset.src || img.src) return;
    img.fetchPriority = priority;
    img.decoding = 'async';
    img.onload = () => requestAnimationFrame(() => frame.classList.add('loaded'));
    img.src = img.dataset.src;
    if (img.complete) requestAnimationFrame(() => frame.classList.add('loaded'));
}

function updateDisplay() {
    if (isNaN(currentStep) || currentStep < 0 || currentStep >= totalSteps) currentStep = 0;

    gallery.style.transform = `translateX(-${currentStep * 100}vw)`;

    frames.forEach((frame, index) => {
        const img = frame.querySelector('img');
        if (index === currentStep) {
            loadImage(img, frame, 'high');
        }
    });

    setTimeout(() => {
        const startBuffer = Math.max(0, currentStep - 2);
        const endBuffer = Math.min(currentStep + 4, totalSteps);
        for (let i = startBuffer; i < endBuffer; i++) {
            loadImage(frames[i].querySelector('img'), frames[i], 'low');
        }
    }, 1000);

    localStorage.setItem('galleryPos', currentStep);
    localStorage.setItem('galleryVersion', totalSteps);
    updateThumbnailsUI();
}

function generateArtworkLabels() {
    frames.forEach(frame => {
        const img = frame.querySelector('img');
        if (img && !frame.querySelector('.artwork-label')) {
            let src = img.getAttribute('src') || img.dataset.src;
            if (!src) return;
            let filename = src.substring(src.lastIndexOf('/') + 1).replace(/\.[^/.]+$/, "").replace(/_(wm|wm_identity|vm)$/, '');
            let firstUnderscore = filename.indexOf('_');
            let number = firstUnderscore !== -1 ? filename.substring(0, firstUnderscore) : "";
            let title = firstUnderscore !== -1 ? filename.substring(firstUnderscore + 1).replace(/_/g, ' ') : filename;

            const labelElement = document.createElement('div');
            labelElement.className = 'artwork-label';
            if (number && !isNaN(number)) {
                const numSpan = document.createElement('span');
                numSpan.className = 'label-number';
                numSpan.textContent = number;
                labelElement.appendChild(numSpan);
            }
            const titleSpan = document.createElement('span');
            titleSpan.className = 'label-title';
            titleSpan.textContent = title;
            labelElement.appendChild(titleSpan);
            frame.appendChild(labelElement);
        }
    });
}

// ============================================================
// NAVIGAZIONE AI BORDI
// ============================================================

const EDGE_ZONE_RATIO = 0.50;
const EDGE_NAV_INTERVAL_MS = 2500;

let edgeNavInterval = null;
let edgeNavDirection = 0;

function isZoomedNow() {
    return scale > 1.05;
}

function isOnInteractiveElement(target) {
    return !!(target && target.closest && target.closest(
        'button, .custom-scrollbar-track, .custom-scrollbar-thumb, nav, .nav-main, .nav-main2, #uiPanel, .audio-control, a'
    ));
}

function getEdgeDirection(clientX, zoneRatio) {
    const width = window.innerWidth;
    if (clientX < width * zoneRatio) return -1;
    if (clientX > width * (1 - zoneRatio)) return 1;
    return 0;
}

function stepFrame(direction) {
    const next = currentStep + direction;
    if (next < 0 || next >= totalSteps) return false;
    currentStep = next;
    updateDisplay();
    return true;
}

function startEdgeNav(direction) {
    if (direction === edgeNavDirection && edgeNavInterval) return;
    stopEdgeNav();
    edgeNavDirection = direction;

    const advanced = stepFrame(direction);
    if (!advanced) {
        edgeNavDirection = 0;
        return;
    }

    edgeNavInterval = setInterval(() => {
        if (isZoomedNow()) { stopEdgeNav(); return; }
        const ok = stepFrame(edgeNavDirection);
        if (!ok) stopEdgeNav();
    }, EDGE_NAV_INTERVAL_MS);
}

function stopEdgeNav() {
    if (edgeNavInterval) {
        clearInterval(edgeNavInterval);
        edgeNavInterval = null;
    }
    edgeNavDirection = 0;
}

let edgeMouseActive = false;

document.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    if (Date.now() - lastTouchEdgeTime < 800) return;
    if (isZoomedNow()) return;
    if (isOnInteractiveElement(e.target)) return;

    const direction = getEdgeDirection(e.clientX, EDGE_ZONE_RATIO);
    if (direction !== 0) {
        e.preventDefault();
        edgeMouseActive = true;
        startEdgeNav(direction);
    }
});

document.addEventListener('mousemove', e => {
    if (!edgeMouseActive) return;

    if (isZoomedNow()) {
        edgeMouseActive = false;
        stopEdgeNav();
        return;
    }

    const direction = getEdgeDirection(e.clientX, EDGE_ZONE_RATIO);
    if (direction === 0) {
        edgeMouseActive = false;
        stopEdgeNav();
    } else if (direction !== edgeNavDirection) {
        startEdgeNav(direction);
    }
});

function endMouseEdgeNav() {
    edgeMouseActive = false;
    stopEdgeNav();
}

document.addEventListener('mouseup', endMouseEdgeNav);
document.addEventListener('mouseleave', endMouseEdgeNav);

let touchEdgeActive = false;
let lastTouchEdgeTime = 0;

viewport.addEventListener('touchstart', e => {
    if (isZoomedNow()) return;
    if (e.touches.length !== 1) return;
    if (isOnInteractiveElement(e.target)) return;

    const touch = e.touches[0];
    const direction = getEdgeDirection(touch.clientX, EDGE_ZONE_RATIO);
    if (direction !== 0) {
        e.preventDefault();
        lastTouchEdgeTime = Date.now();
        touchEdgeActive = true;
        startEdgeNav(direction);
    }
}, { passive: false });

viewport.addEventListener('touchmove', e => {
    if (!touchEdgeActive) return;

    if (isZoomedNow() || e.touches.length !== 1) {
        touchEdgeActive = false;
        stopEdgeNav();
        return;
    }

    const touch = e.touches[0];
    const direction = getEdgeDirection(touch.clientX, EDGE_ZONE_RATIO);
    if (direction === 0) {
        touchEdgeActive = false;
        stopEdgeNav();
    } else if (direction !== edgeNavDirection) {
        startEdgeNav(direction);
    }
}, { passive: true });

function endTouchEdgeNav(e) {
    if (e) e.preventDefault();
    lastTouchEdgeTime = Date.now();
    touchEdgeActive = false;
    stopEdgeNav();
}

viewport.addEventListener('touchend', endTouchEdgeNav, { passive: false });
viewport.addEventListener('touchcancel', endTouchEdgeNav, { passive: false });

window.addEventListener('load', () => {
    initGallery();
    generateArtworkLabels();
});
