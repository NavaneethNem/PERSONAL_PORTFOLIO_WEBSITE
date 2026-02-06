document.addEventListener('DOMContentLoaded', () => {

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu');
    const navMenu = document.querySelector('.nav-menu');

    mobileMenuBtn.addEventListener('click', () => {
        mobileMenuBtn.classList.toggle('is-active');
        navMenu.classList.toggle('active');
    });

    // Close menu when clicking a link
    document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
        mobileMenuBtn.classList.remove('is-active');
        navMenu.classList.remove('active');
    }));

    // Intersection Observer for Scroll Animations
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                entry.target.classList.remove('hidden');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    // Select elements to animate. 
    // We add the 'hidden' class initially to elements we want to fade in.
    const animatedElements = document.querySelectorAll('.hero-text, .hero-image, .about-img, .about-text, .interest-block, .happy-card, .contact-wrapper');

    animatedElements.forEach(el => {
        el.classList.add('hidden');
        observer.observe(el);
    });

    // Validating typing effect (Optional enhancement if requested later, 
    // but for now the CSS transitions + Observer is enough for the "Interactive" feel)
    // Slideshow Logic
    const slides = document.querySelectorAll('.slide');
    let currentSlide = 0;

    if (slides.length > 0) {
        setInterval(() => {
            // Remove active class from current slide
            slides[currentSlide].classList.remove('active');

            // Move to next slide
            currentSlide = (currentSlide + 1) % slides.length;

            // Add active class to new current slide
            slides[currentSlide].classList.add('active');
        }, 3000); // Change image every 3 seconds
    }
});
