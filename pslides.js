document.addEventListener("DOMContentLoaded", function() {
    let slideIndex = 0;
    let slides = document.getElementsByClassName("pslides");

    if (slides.length === 0) return; // Evita errori se non ci sono slide

    // Forza la visibilità immediata della prima slide
    slides[0].style.display = "block";

    function showSlides() {
        // Nascondi tutte le slide
        for (let i = 0; i < slides.length; i++) {
            slides[i].style.display = "none";
        }

        slideIndex++;
        if (slideIndex > slides.length) {
            slideIndex = 1;
        }

        // Mostra la slide corrente
        slides[slideIndex - 1].style.display = "block";

        // Cambia immagine ogni 4 secondi
        setTimeout(showSlides, 3000); // Cambia immagine ogni 3 secondi
    }

    // Avvia lo slideshow dopo la visualizzazione della prima immagine
    setTimeout(showSlides, 0); // Avvia immediatamente lo slideshow
});
