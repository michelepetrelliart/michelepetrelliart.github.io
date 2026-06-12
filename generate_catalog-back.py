import json
import os
import re
import sys
from config_scripts import GDPR_SCRIPT, RIGHT_CLICK, L_DETECT_SCRIPT, MUSIC_SCRIPT

def get_hidden_works(base_dir):
    root_dir = os.path.dirname(base_dir)
    hide_path = os.path.join(root_dir, 'images_high_res', 'hide.txt')
    if not os.path.exists(hide_path):
        return set()
    with open(hide_path, 'r', encoding='utf-8') as f:
        return {line.strip() for line in f if line.strip()}

def rebuild_catalog_from_files(base_dir):
    """Scansiona tutte le sottocartelle in All_works e ricostruisce il catalogo."""
    all_works_dir = os.path.join(base_dir, 'thumbs', 'All_works')

    # Inizializziamo il dizionario con tutte le chiavi che ti aspetti
    new_data = {}

    if os.path.exists(all_works_dir):
        # Iteriamo su ogni sottocartella (es. Portraits, Landscapes, ecc.)
        for category in os.listdir(all_works_dir):
            category_path = os.path.join(all_works_dir, category)

            if os.path.isdir(category_path):
                new_data[category] = []
                # Scansioniamo i file in questa categoria
                for filename in sorted(os.listdir(category_path)):
                    if filename.lower().endswith(('.webp', '.jpg', '.jpeg', '.png')):
                        item = {
                            "src": f"../thumbs/All_works/{category}/{filename}",
                            "title": filename.split('_')[0]
                        }
                        new_data[category].append(item)
    return new_data

def generate_static_html():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(base_dir, 'pages_static', 'catalog.json')

    # 1. Ricostruiamo i dati da zero leggendo i file nelle cartelle
    data = rebuild_catalog_from_files(base_dir)

    # 2. Filtro opere nascoste
    hidden_list = get_hidden_works(base_dir)
    cleaned_data = {}
    all_works = []

    for key, items in data.items():
        if isinstance(items, list):
            cleaned_list = []
            for item in items:
                src = item.get('src', '')
                filename = os.path.splitext(os.path.basename(src))[0].strip()
                check_name = filename.replace('_wm', '')

                if check_name in hidden_list:
                    continue

                cleaned_list.append(item)

            cleaned_data[key] = cleaned_list
            all_works.extend(cleaned_list)
        else:
            cleaned_data[key] = items

    # Salvataggio del JSON fresco
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(cleaned_data, f, ensure_ascii=False, indent=4)

    # 3. Funzione di ordinamento per la galleria
    def extract_number(item):
        path = item.get('src', '')
        numbers = re.findall(r'\d+', path)
        return int(numbers[-1]) if numbers else 0

    all_works.sort(key=extract_number, reverse=True)

    # 4. AGGIORNAMENTO PRELOADER
    if all_works:
        first_img_src = all_works[0].get('src', '').replace('../', '')
        preload_tag = f'<link rel="preload" as="image" href="{first_img_src}">'

        index_path = os.path.join(base_dir, 'index.html')
        if os.path.exists(index_path):
            with open(index_path, 'r', encoding='utf-8') as f:
                index_content = f.read()

            # Definiamo il blocco che vogliamo gestire
            start_marker="<!-- PRELOAD_START -->"
            end_marker="<!-- PRELOAD_END -->"

            # Creiamo il contenuto da inserire
            new_preload_block = f"{start_marker}\n{preload_tag}\n{end_marker}"

            # Regex per sostituire tutto quello che sta tra i due marker
            pattern = re.escape(start_marker) + r".*?" + re.escape(end_marker)

            if re.search(pattern, index_content, re.DOTALL):
                # Sostituiamo il vecchio blocco con quello nuovo
                new_index = re.sub(pattern, new_preload_block, index_content, flags=re.DOTALL)
            else:
                # Se non trova i marker, lo aggiunge prima di </head> come fallback
                new_index = index_content.replace('</head>', f'    {new_preload_block}\n</head>')

            with open(index_path, 'w', encoding='utf-8') as f:
                f.write(new_index)
            print(f"Preloader della galleria aggiornato in index.html")

    # 4. Generazione moduli HTML
    modules_html = ""
    for i, item in enumerate(all_works):
        src = item.get('src', '')
        if not src.startswith('../') and not src.startswith('http'):
            src = '../' + src

        is_video = src.lower().endswith(('.mp4', '.webm', '.mov'))
        if is_video:
            content = f'<video src="{src}" preload="none" controls></video>'
        else:
            onload = ' onload="document.documentElement.classList.add(\'gallery-ready\')"' if i == 0 else ""
            content = f'<img src="{src}"{onload} loading="lazy">'

        # Inseriamo il frame DIRETTAMENTE dentro il modulo
        modules_html += f'''            <div class="wall-module">
                <div class="frame">
                    <div class="audio-control">
                        <svg class="audio-icon" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(1px 0 0 white) drop-shadow(-1px 0 0 white) drop-shadow(0 1px 0 white) drop-shadow(0 -1px 0 white);">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                            <line x1="23" y1="9" x2="17" y2="15"></line>
                            <line x1="17" y1="9" x2="23" y2="15"></line>
                        </svg>
                    </div>
                    <div class="frame-content" style="position: relative; z-index: 1;">{content}</div>
                </div>
            </div>\n'''

    # 5. Struttura HTML finale
    full_html = f'''<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="../gallery/gallery.css">
</head>
<body>


<div id="mobileNotice" class="mobile-notice" style="display: none;">
    <div class="notice-content">
        <p><strong>Desktop experience recommended for optimal viewing and navigation.</strong></p>
        <p><em>Si consiglia la visione da desktop per un'esperienza ottimale.</em></p>
    </div>
</div>

<div class="gallery-viewport" id="viewport">
    <div class="gallery-container" id="gallery">
        <div class="grand-wall wall-left" id="wallLeft">
            {modules_html}
        </div>
        <div class="grand-wall wall-right"></div>
        <div class="corridor-floor" id="floor"></div>
    </div>
    <div class="viewport-vignette"></div>
</div>

<div class="ui-container">
    <div class="ui-panel" id="uiPanel">
        <div class="nav-main">
        <button id="prevBtn" class="btn-arrow">◀ Prev</button>
        <span id="stepIndicator" class="step-txt">...</span>
        <button id="nextBtn" class="btn-arrow">Next ▶</button>
    </div>
    <div class="nav-shortcuts">
        <button id="jumpM8" class="btn-jump">-8</button>
        <button id="jumpM4" class="btn-jump">-4</button>
        <button id="resetGalleryBtn" class="btn-jump btn-reset">Start</button>
        <button id="jumpP4" class="btn-jump">+4</button>
        <button id="jumpP8" class="btn-jump">+8</button>
        </div>
    </div>
</div>
{GDPR_SCRIPT}
{RIGHT_CLICK}
{L_DETECT_SCRIPT}
{MUSIC_SCRIPT}
<script src="../gallery/script.js"></script>
</body>
</html>'''

    output_dir = os.path.join(base_dir, 'pages_static')
    target_html = os.path.join(output_dir, 'gallery.html')
    with open(target_html, 'w', encoding='utf-8') as f:
        f.write(full_html)

    print(f"Successo: Generato {target_html} e aggiornato {json_path}")

if __name__ == "__main__":
    generate_static_html()
