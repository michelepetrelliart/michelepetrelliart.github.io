# Definizione locale delle variabili di protezione
ENABLE_GDPR_SCRIPT = True
ENABLE_RIGHT_CLICK = True
ENABLE_L_DETECT_SCRIPT = True

GDPR_SCRIPT = (
    """<script>
(()=>{if(location.protocol==="file:"||/^(localhost|127\\.0\\.0\\.1)$/.test(location.hostname))return;
if(localStorage.getItem("cAcc"))return;
let d=document.createElement("div");
d.style="position:fixed;bottom:200px;left:0;width:100%;background:#222;color:#fff;padding:10px 14px;font:14px/1.4 sans-serif;text-align:center;z-index:9999";
d.innerHTML = "The site uses third-party cookies. <a href='/pages_static/privacy.html' style='color:#fff !important; text-decoration:underline;'>Info</a> <button id='cOk' style='margin-left:10px'>OK</button>";
document.body.appendChild(d);
document.getElementById("cOk").onclick=()=>{localStorage.setItem("cAcc","1");d.remove()};
})();
</script>"""
    if ENABLE_GDPR_SCRIPT
    else ""
)

RIGHT_CLICK = (
    """<script>
// Disabilita il menu contestuale (tasto destro)
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

// Disabilita il drag and drop
document.addEventListener('dragstart', function(e) {
    e.preventDefault();
});
</script>"""
    if ENABLE_RIGHT_CLICK
    else ""
)
L_DETECT_SCRIPT = (
    """<script type='text/javascript'>
document.addEventListener("DOMContentLoaded",function(){const e=navigator.languages||[navigator.language||navigator.userLanguage],t=e.some(l=>l.startsWith("it")),z=Intl.DateTimeFormat().resolvedOptions().timeZone==="Europe/Rome",n=new URLSearchParams(window.location.search).get("fromX");if(!(t||z)&&n==="1")localStorage.setItem("visitedFromX","1");const o=localStorage.getItem("visitedFromX"),i=document.querySelectorAll(".cont-t"),s=document.querySelectorAll(".cont-h"),r=document.querySelectorAll(".cont-it");if(t||z){r.forEach(a=>a.style.display="block");s.forEach(a=>a.style.display="none");i.forEach(a=>a.style.display="none")}else{if(!o){s.forEach(a=>a.style.display="block");i.forEach(a=>a.style.display="none")}else{i.forEach(a=>a.style.display="block");s.forEach(a=>a.style.display="none")}r.forEach(a=>a.style.display="none")}});</script>"""
    if ENABLE_L_DETECT_SCRIPT
    else ""
)

MUSIC_SCRIPT = """
<audio id="bg-music" preload="none"></audio>

<script>
(function() {
    const audio = document.getElementById('bg-music');

    const mutedIcon = `<svg class="audio-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(1px 0 0 white) drop-shadow(-1px 0 0 white) drop-shadow(0 1px 0 white) drop-shadow(0 -1px 0 white);"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;

    const activeIcon = `<svg class="audio-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(1px 0 0 white) drop-shadow(-1px 0 0 white) drop-shadow(0 1px 0 white) drop-shadow(0 -1px 0 white);"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.5 8.5a5 5 0 0 1 0 7"></path><path d="M19 5a10 10 0 0 1 0 14"></path></svg>`;

    const playlist = [
        "https://archive.org/download/michelepetrelliart-historical-archive/music/track06.mp3",
        "https://archive.org/download/michelepetrelliart-historical-archive/music/track05.mp3",
        "https://archive.org/download/michelepetrelliart-historical-archive/music/track04.mp3",
        "https://archive.org/download/michelepetrelliart-historical-archive/music/track09.mp3",
        "https://archive.org/download/michelepetrelliart-historical-archive/music/track10.mp3"
    ];

    let currentTrack = Math.floor(Math.random() * playlist.length);
    let isPlaying = false;

    // Delegazione: gestisce il click ovunque sulla pagina
    document.addEventListener('click', (e) => {
        const control = e.target.closest('.audio-control');
        if (!control) return;

        if (isPlaying) {
            audio.pause();
            document.querySelectorAll('.audio-control').forEach(el => el.innerHTML = mutedIcon);
            isPlaying = false;
        } else {
            if (!audio.src) audio.src = playlist[currentTrack];
            audio.play().then(() => {
                document.querySelectorAll('.audio-control').forEach(el => el.innerHTML = activeIcon);
                isPlaying = true;
            }).catch(err => console.error(err));
        }
    });

    audio.addEventListener('ended', () => {
        currentTrack = (currentTrack + 1) % playlist.length;
        audio.src = playlist[currentTrack];
        if (isPlaying) audio.play();
    });
})();
</script>
"""
