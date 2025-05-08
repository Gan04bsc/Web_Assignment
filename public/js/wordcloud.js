document.addEventListener('DOMContentLoaded', () => {
    const words = document.querySelectorAll('.word');
    
    // Randomly position words for a natural cloud effect
    words.forEach(word => {
        const size = parseFloat(word.getAttribute('data-size'));
        word.style.fontSize = `${size * 18}px`; // Base size scaled by data-size
    });

    // Optional: Add slight animation for dynamic feel
    words.forEach(word => {
        word.addEventListener('mouseenter', () => {
            word.style.zIndex = 2; // Bring to front on hover
        });
        word.addEventListener('mouseleave', () => {
            word.style.zIndex = 1;
        });
    });
});
