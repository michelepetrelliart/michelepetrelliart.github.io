document.addEventListener("DOMContentLoaded", function() {
    let slideIndex = 0;
    let slides = document.getElementsByClassName("pslides");

    function showSlides() {
        if (slides.length === 0) return; // Evita errori se non ci sono slide

        for (let i = 0; i < slides.length; i++) {
            slides[i].style.display = "none";
        }

        slideIndex++;
        if (slideIndex > slides.length) { slideIndex = 1; }

        slides[slideIndex - 1].style.display = "block";

        setTimeout(showSlides, 4000); // Cambia immagine ogni 5 secondi
    }

    showSlides();
});
