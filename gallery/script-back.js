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

    requestAnimationFrame(() => {
        gallery.style.transition = '';
        updateDisplay();
    });
}
function updateTransform(el) {
    if (!el) return;

    const zoomStartPan = 1.1;
    const maxZoom = 3;
    const panFactor = Math.max(0, (scale - zoomStartPan) / (maxZoom - zoomStartPan));
    const clampedPanFactor = Math.min(1, panFactor);

    // Usiamo offsetWidth del frame per i limiti
    const limitX = (el.offsetWidth * (scale - 1)) / 0.8;
    const limitY = (el.offsetHeight * (scale - 1)) / 0.8;

    posX = Math.max(-limitX * clampedPanFactor, Math.min(limitX * clampedPanFactor, posX));
    posY = Math.max(-limitY * clampedPanFactor, Math.min(limitY * clampedPanFactor, posY));

    // Applichiamo il transform al frame stesso.
    // Usiamo calc() per mantenere la centratura originale (-50%, -50%)
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

    const activeFrame = frames[currentStep]; // Usa l'indice
    if (activeFrame) updateTransform(activeFrame);
}

viewport.addEventListener('wheel', e => {
    // Usiamo l'indice globale currentStep per trovare il frame corretto
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
    const activeFrame = frames[currentStep]; // Corretto qui
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
    if (e.touches.length === 2) {
        isPanning = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDist = Math.sqrt(dx * dx + dy * dy);
        initialScale = scale;
    } else if (e.touches.length === 1 && scale > 1) {
        isPanning = true;
        startX = e.touches[0].clientX - posX;
        startY = e.touches[0].clientY - posY;
    }
}, { passive: false });

viewport.addEventListener('touchmove', e => {
    // Usa l'indice corrente invece di cercare una classe CSS
    const activeFrame = frames[currentStep];
    if (!activeFrame) return;

    if (e.touches.length === 2 && initialPinchDist > 0) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Calcolo scala
        scale = Math.min(Math.max(initialScale * (dist / initialPinchDist), 1), 3);

        // Passa il frame corretto alla funzione
        updateTransform(activeFrame);

    } else if (e.touches.length === 1 && isPanning) {
        e.preventDefault();
        posX = e.touches[0].clientX - startX;
        posY = e.touches[0].clientY - startY;

        // Passa il frame corretto alla funzione
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

    const indicator = document.getElementById('stepIndicator');
    if (indicator) indicator.textContent = `${currentStep + 1} / ${totalSteps}`;
    localStorage.setItem('galleryPos', currentStep);
    localStorage.setItem('galleryVersion', totalSteps);
}

let isJumping = false;
async function jump(steps) {
    if (isJumping) return;
    const targetStep = Math.max(0, Math.min(totalSteps - 1, currentStep + steps));
    const direction = steps > 0 ? 1 : -1;
    isJumping = true;
    while (currentStep !== targetStep) {
        currentStep += direction;
        currentStep = Math.max(0, Math.min(totalSteps - 1, currentStep));
        updateDisplay();
        await new Promise(r => setTimeout(r, 500)); // Ridotto a 100ms per un effetto più fluido
    }
    isJumping = false;
}

function generateArtworkLabels() {
    frames.forEach(frame => {
        const img = frame.querySelector('img');
        if (img && !frame.querySelector('.artwork-label')) {
            let src = img.getAttribute('src') || img.dataset.src;
            let filename = src.substring(src.lastIndexOf('/') + 1).replace(/\.[^/.]+$/, "").replace(/_wm$|_wm_identity$/, '');
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

document.getElementById('nextBtn')?.addEventListener('click', () => jump(1));
document.getElementById('prevBtn')?.addEventListener('click', () => jump(-1));
document.getElementById('jumpM8')?.addEventListener('click', () => jump(-8));
document.getElementById('jumpM4')?.addEventListener('click', () => jump(-4));
document.getElementById('jumpP4')?.addEventListener('click', () => jump(4));
document.getElementById('jumpP8')?.addEventListener('click', () => jump(8));
document.getElementById('resetGalleryBtn')?.addEventListener('click', () => { currentStep = 0; updateDisplay(); });

window.addEventListener('load', () => {
    initGallery();
    generateArtworkLabels();
});
