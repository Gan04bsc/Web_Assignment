function toggleCard(card) {
    // Close other open cards
    document.querySelectorAll('.card.active').forEach(otherCard => {
        if (otherCard !== card) {
            otherCard.classList.remove('active');
        }
    });
    // Toggle the clicked card
    card.classList.toggle('active');
}
