// Toggle card state
function toggleCard(card) {
    if (card.classList.contains('active')) {
        closeCard(card);
    } else {
        // Close any other active card
        document.querySelectorAll('.card.active').forEach(activeCard => {
            activeCard.classList.remove('active');
            // Remove Back button
            const btn = activeCard.querySelector('.card-back-btn');
            if (btn) btn.remove();
        });
        card.classList.add('active');
        document.body.classList.add('card-active');
        if (!card.querySelector('.card-back-btn')) {
            const backBtn = document.createElement('button');
            backBtn.className = 'card-back-btn';
            backBtn.innerText = 'Back';
            backBtn.onclick = function(e) {
                e.stopPropagation();
                closeCard(card);
            };
            card.appendChild(backBtn);
        }
    }
}

// Close card
function closeCard(card) {
    card.classList.remove('active');
    document.body.classList.remove('card-active');
    // Remove Back button
    const btn = card.querySelector('.card-back-btn');
    if (btn) btn.remove();
}

// Initialize event listeners
document.querySelectorAll('.card').forEach(card => {
    // Handle mouse click
    card.addEventListener('click', (e) => {
        // Prevent toggle if clicking on text, links, or buttons
        if (
            e.target.tagName === 'P' ||
            e.target.tagName === 'A' ||
            e.target.tagName === 'STRONG' ||
            e.target.tagName === 'BUTTON' ||
            e.target.classList.contains('card-back-btn')
        ) {
            return; 
        }
        if (!card.classList.contains('active')) {
            toggleCard(card);
        }
    });

    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === 'Space') {
            e.preventDefault();
            if (!card.classList.contains('active')) {
                toggleCard(card);
            }
        }
    });
});