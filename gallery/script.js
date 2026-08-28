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
const thumbRow = document.getElementById('thumbRow');
const galleryOpName = document.getElementById('galleryOpName');

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

    // Inizializza gli eventi sulle miniature generate dal server
    initThumbnails();

    requestAnimationFrame(() => {
        gallery.style.transition = '';
        updateDisplay();
    });
}

function initThumbnails() {
    if (!thumbRow) return;

    const btnPrev = document.getElementById('thumbPrev');
    const btnNext = document.getElementById('thumbNext');

    thumbRow.addEventListener('click', (e) => {
        const thumb = e.target.closest('.thumb-item');
        if (!thumb) return;

        const targetIndex = parseInt(thumb.getAttribute('data-index'));
        if (!isNaN(targetIndex) && targetIndex !== currentStep) {
            resetZoom();
            currentStep = targetIndex;
            updateDisplay();
        }
    });

    if (btnPrev) {
        btnPrev.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentStep > 0) {
                resetZoom();
                currentStep = Math.max(0, currentStep - 8);
                updateDisplay();
            }
        });
    }

    if (btnNext) {
        btnNext.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentStep < totalSteps - 1) {
                resetZoom();
                currentStep = Math.min(totalSteps - 1, currentStep + 8);
                updateDisplay();
            }
        });
    }
}

function updateThumbnailsUI() {
    const thumbs = document.querySelectorAll('.thumb-item');
    if (thumbs.length === 0) return;

    thumbs.forEach(thumb => {
        const idx = parseInt(thumb.getAttribute('data-index'));
        if (idx === currentStep) {
            thumb.classList.add('active');

            if (galleryOpName) {
                const activeFrame = frames[currentStep];
                if (activeFrame) {
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
                } else {
                    let fullTitle = thumb.getAttribute('title') || '';
                    let firstUnderscore = fullTitle.indexOf('_');
                    if (firstUnderscore !== -1) {
                        galleryOpName.textContent = fullTitle.replace(/_/g, ' ');
                    } else {
                        galleryOpName.textContent = fullTitle || 'Opera';
                    }
                }
            }

            thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
            thumb.classList.remove('active');
        }
    });
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
    const activeFrame = frames[currentStep];
    if (!activeFrame) return;

    if (e.touches.length === 2 && initialPinchDist > 0) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        scale = Math.min(Math.max(initialScale * (dist / initialPinchDist), 1), 3);
        updateTransform(activeFrame);

    } else if (e.touches.length === 1 && isPanning) {
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

// ============================================================
// NAVIGAZIONE AI BORDI (nuova funzionalità, aggiunta senza
// modificare nulla del codice sopra)
//
// Come gli epub, dove si clicca sul lato destro/sinistro del
// foglio per girare pagina: qui, cliccando (desktop) o toccando
// (mobile) nella fascia ai bordi dello schermo, si passa subito
// al frame precedente/successivo. Se si tiene premuto (mouse) o
// il dito resta a contatto, l'avanzamento continua a intervalli
// regolari finché non si rilascia o non ci si sposta fuori dalla
// fascia. Il semplice passaggio del mouse senza click NON attiva
// nulla, solo il click/tocco effettivo.
//
// La fascia è il 20% della larghezza della finestra su entrambi
// i lati, sia su desktop che su touch.
//
// In entrambi i casi la funzione è disattivata durante lo zoom
// (scale > 1.05), e ignora i click/tocchi sui controlli
// dell'interfaccia (pulsanti, miniature, nav). Al rilascio non
// viene mai annullata una transizione già avviata: si smette
// solo di innescarne di nuove, così il frame che resta centrato
// è sempre quello verso cui l'ultimo scatto puntava.
// ============================================================

const EDGE_ZONE_RATIO = 0.50; // 20% della larghezza della finestra/schermo
const EDGE_NAV_INTERVAL_MS = 2500; // ritmo di avanzamento mentre si resta nella fascia

let edgeNavInterval = null;
let edgeNavDirection = 0; // -1 sinistra, 1 destra, 0 nessuna

function isZoomedNow() {
    return scale > 1.05;
}

function isOnInteractiveElement(target) {
    return !!(target && target.closest && target.closest(
        'button, .thumb-item, #thumbRow, nav, .nav-main, .nav-main2, #uiPanel, .audio-control, a'
    ));
}

// Calcola la direzione in base alla posizione X rispetto alla larghezza
// della finestra (window.innerWidth) e alla percentuale di fascia data.
function getEdgeDirection(clientX, zoneRatio) {
    const width = window.innerWidth;
    if (clientX < width * zoneRatio) return -1;
    if (clientX > width * (1 - zoneRatio)) return 1;
    return 0;
}

// Avanza di un frame nella direzione data. Ritorna false se si è già
// al primo/ultimo frame (limite raggiunto).
function stepFrame(direction) {
    const next = currentStep + direction;
    if (next < 0 || next >= totalSteps) return false;
    currentStep = next;
    updateDisplay();
    return true;
}

function startEdgeNav(direction) {
    if (direction === edgeNavDirection && edgeNavInterval) return; // già in corso in quella direzione
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

// Non interrompe/annulla mai la transizione CSS già in corso: si limita
// a smettere di innescarne di nuove. L'animazione in atto si completa
// da sola sul frame già impostato come target.
function stopEdgeNav() {
    if (edgeNavInterval) {
        clearInterval(edgeNavInterval);
        edgeNavInterval = null;
    }
    edgeNavDirection = 0;
}

// --- Desktop: click (tenuto premuto per continuare) nella fascia ---
let edgeMouseActive = false;

document.addEventListener('mousedown', e => {
    if (e.button !== 0) return; // solo tasto sinistro
    if (isZoomedNow()) return;
    if (isOnInteractiveElement(e.target)) return;

    const direction = getEdgeDirection(e.clientX, EDGE_ZONE_RATIO);
    if (direction !== 0) {
        e.preventDefault(); // evita la selezione del testo mentre si tiene premuto
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

// --- Mobile/touch: tocco nella fascia, con ripetizione se tenuto premuto ---
let touchEdgeActive = false;

viewport.addEventListener('touchstart', e => {
    if (isZoomedNow()) return;
    if (e.touches.length !== 1) return;
    if (isOnInteractiveElement(e.target)) return;

    const touch = e.touches[0];
    const direction = getEdgeDirection(touch.clientX, EDGE_ZONE_RATIO);
    if (direction !== 0) {
        touchEdgeActive = true;
        startEdgeNav(direction);
    }
}, { passive: true });

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

function endTouchEdgeNav() {
    touchEdgeActive = false;
    stopEdgeNav();
}

viewport.addEventListener('touchend', endTouchEdgeNav);
viewport.addEventListener('touchcancel', endTouchEdgeNav);

window.addEventListener('load', () => {
    initGallery();
    generateArtworkLabels();
});
