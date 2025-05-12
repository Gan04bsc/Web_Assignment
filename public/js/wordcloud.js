document.addEventListener('DOMContentLoaded', () => {
    const words = document.querySelectorAll('.word');

    // Set initial sizes based on data-size
    words.forEach(word => {
        const size = parseFloat(word.getAttribute('data-size'));
        word.style.fontSize = `${size * 18}px`;
    });

    // Highlight hobbies
    window.highlightHobbies = () => {
        words.forEach(word => {
            if (word.classList.contains('hobby')) {
                word.classList.add('highlight');
                word.classList.remove('dim');
            } else {
                word.classList.add('dim');
                word.classList.remove('highlight');
            }
        });
    };

    // Reset cloud
    window.resetCloud = () => {
        words.forEach(word => {
            word.classList.remove('highlight', 'dim');
        });
    };

    // Hover effects
    words.forEach(word => {
        word.addEventListener('mouseenter', () => {
            if (!word.classList.contains('highlight') && !word.classList.contains('dim')) {
                word.style.zIndex = 2;
            }
        });
        word.addEventListener('mouseleave', () => {
            word.style.zIndex = 1;
        });
    });
});
