// Quiz data
const quizData = [
    {
        question: "This fruit is?",
        image: "images/question1.jpg", // Replace with actual image
        options: ["Apple", "Banana", "Grape", "Watermelon"],
        answer: "Apple"
    },
    {
        question: "This sport is?",
        image: "images/question2.jpg",
        options: ["Basketball", "Football", "Badminton", "Volleyball"],
        answer: "Basketball"
    },
    {
        question: "In China, what is the age of adulthood?",
        image: "images/question3.jpg",
        options: ["16", "18", "20", "22"],
        answer: "18"
    },
    {
        question: "What is the capital of China?",
        image: "images/question4.jpg",
        options: ["Beijing", "Shanghai", "Guangzhou", "Shenzhen"],
        answer: "Beijing"
    },
    {
        question: "Which course have we NOT studied?",
        image: "images/question5.jpg",
        options: ["Calculus", "Linear Algebra", "Python", "C++"],
        answer: "C++"
    },
    {
        question: "How many seasons are there in a year?",
        image: "images/question6.jpg",
        options: ["1", "2", "3", "4"],
        answer: "4"
    }
];

// Realistic names for opponents
const realisticNames = [
    "Bob", "Jone", "Grace", "Alice", "Tom", "Emma", "Liam", "Olivia", "Noah", "Sophia"
];

// Game state
let currentPlayer = null;
let players = [];
let opponent = null;
let currentQuestion = 0;
let playerScore = 0;
let opponentScore = 0;
let timer = null;
const TIME_PER_QUESTION = 10; // 10 seconds per question
let questionAnswered = false;

// DOM elements
const playerNameInput = document.getElementById('player-name');
const playerList = document.getElementById('player-list');
const quizSection = document.getElementById('quiz-section');
const questionNumber = document.getElementById('question-number');
const questionImage = document.getElementById('question-image');
const questionText = document.getElementById('question-text');
const timerProgress = document.getElementById('timer-progress');
const optionsGrid = document.getElementById('options-grid');
const playerScoreText = document.getElementById('player-score');
const opponentScoreText = document.getElementById('opponent-score');
const challengeModal = document.getElementById('challenge-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const acceptChallenge = document.getElementById('accept-challenge');
const rejectChallenge = document.getElementById('reject-challenge');
const resultModal = document.getElementById('result-modal');
const resultMessage = document.getElementById('result-message');

// Register player
function registerPlayer() {
    const name = playerNameInput.value.trim();
    if (!name) {
        alert('Please enter a name!');
        return;
    }
    currentPlayer = name;
    players.push(name);
    // Add 2-3 initial opponents immediately
    const initialOpponentCount = Math.floor(Math.random() * 2) + 2; // 2 or 3
    for (let i = 0; i < initialOpponentCount; i++) {
        addRandomOpponent();
    }
    updatePlayerList();
    playerNameInput.value = '';
    playerNameInput.disabled = true;
    document.querySelector('.player-input button').disabled = true;
}

// Add a random opponent with a realistic name
function addRandomOpponent() {
    if (players.length >= 5) return; // Limit to 5 players total
    let newName;
    do {
        newName = realisticNames[Math.floor(Math.random() * realisticNames.length)];
    } while (players.includes(newName)); // Ensure unique name
    players.push(newName);
}

// Update online player list
function updatePlayerList() {
    playerList.innerHTML = '';
    players.forEach(player => {
        if (player !== currentPlayer) {
            const li = document.createElement('li');
            li.textContent = player;
            li.onclick = () => challengePlayer(player);
            li.setAttribute('tabindex', '0');
            li.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    challengePlayer(player);
                    e.preventDefault();
                }
            });
            playerList.appendChild(li);
        }
    });
}

// Challenge another player
function challengePlayer(player) {
    opponent = player;
    modalTitle.textContent = 'Challenge Request';
    modalMessage.textContent = `You challenged ${player}! Waiting for response...`;
    challengeModal.style.display = 'flex';
    acceptChallenge.style.display = 'none';
    rejectChallenge.style.display = 'none';
    // Simulate opponent response (70% chance to accept)
    setTimeout(() => {
        const accept = Math.random() > 0.3;
        if (accept) {
            startQuiz();
            challengeModal.style.display = 'none';
        } else {
            modalMessage.textContent = `${player} rejected the challenge.`;
            setTimeout(() => {
                challengeModal.style.display = 'none';
                opponent = null;
            }, 2000);
        }
    }, 1000);
}

// Receive challenge from other players
function simulateIncomingChallenge() {
    if (!currentPlayer || opponent || quizSection.style.display === 'block') return;
    const otherPlayers = players.filter(p => p !== currentPlayer);
    if (otherPlayers.length === 0) return;
    opponent = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
    modalTitle.textContent = 'Incoming Challenge';
    modalMessage.textContent = `${opponent} challenges you!`;
    challengeModal.style.display = 'flex';
    acceptChallenge.style.display = 'inline-block';
    rejectChallenge.style.display = 'inline-block';
}

// Simulate incoming challenges periodically
setInterval(() => {
    if (Math.random() > 0.85) { // 15% chance every 5 seconds
        simulateIncomingChallenge();
    }
}, 5000);

// Simulate opponent addition periodically
setInterval(() => {
    if (Math.random() > 0.5 && players.length < 5) { // 50% chance every 3 seconds
        addRandomOpponent();
        updatePlayerList();
    }
}, 3000);

// Handle challenge response
acceptChallenge.onclick = () => {
    startQuiz();
    challengeModal.style.display = 'none';
};

rejectChallenge.onclick = () => {
    modalMessage.textContent = `You rejected ${opponent}'s challenge.`;
    setTimeout(() => {
        challengeModal.style.display = 'none';
        opponent = null;
    }, 2000);
};

// Start quiz
function startQuiz() {
    quizSection.style.display = 'block';
    currentQuestion = 0;
    playerScore = 0;
    opponentScore = 0;
    questionAnswered = false;
    updateScoreboard();
    loadQuestion();
}

// Load question
function loadQuestion() {
    if (currentQuestion >= quizData.length) {
        endQuiz();
        return;
    }
    questionAnswered = false;
    const q = quizData[currentQuestion];
    questionNumber.textContent = `Question ${currentQuestion + 1}/${quizData.length}`;
    questionImage.src = q.image;
    questionText.textContent = q.question;
    optionsGrid.innerHTML = '';
    q.options.forEach(option => {
        const div = document.createElement('div');
        div.className = 'option';
        div.textContent = option;
        div.onclick = () => selectOption(option);
        div.setAttribute('tabindex', '0');
        div.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                selectOption(option);
                e.preventDefault();
            }
        });
        optionsGrid.appendChild(div);
    });
    startTimer();
}

// Start timer
function startTimer() {
    let timeLeft = TIME_PER_QUESTION;
    timerProgress.style.width = '100%';
    timer = setInterval(() => {
        timeLeft -= 0.1;
        timerProgress.style.width = `${(timeLeft / TIME_PER_QUESTION) * 100}%`;
        if (timeLeft <= 0) {
            clearInterval(timer);
            if (!questionAnswered) {
                selectOption(null); // Timeout
            }
        }
    }, 100);
}

// Select option
function selectOption(selected) {
    if (questionAnswered) return;
    questionAnswered = true;
    clearInterval(timer);
    const q = quizData[currentQuestion];
    const correct = q.answer;
    let playerPoints = 0;
    let opponentPoints = 0;

    // Simulate opponent's answer
    const opponentAnswersFirst = Math.random() > 0.5; // 50% chance opponent answers first
    const opponentCorrect = opponentAnswersFirst ? true : Math.random() > 0.3; // 70% correct if not first

    if (opponentAnswersFirst && opponentCorrect) {
        // Case 1: Opponent answers first and correct
        opponentPoints = 2;
        playerPoints = 0;
        console.log(`Question ${currentQuestion + 1}: Opponent answered first and correct. Opponent +2, Player +0`);
    } else if (selected === correct && !opponentAnswersFirst) {
        // Case 2: Player answers first and correct
        playerPoints = 2;
        opponentPoints = 0;
        console.log(`Question ${currentQuestion + 1}: Player answered first and correct. Player +2, Opponent +0`);
    } else if (selected && selected !== correct) {
        // Case 3: Player answers wrong
        playerPoints = 0;
        opponentPoints = 1;
        console.log(`Question ${currentQuestion + 1}: Player answered wrong. Player +0, Opponent +1`);
    } else {
        // Case 4: Player times out (selected === null)
        playerPoints = 0;
        opponentPoints = 1;
        console.log(`Question ${currentQuestion + 1}: Player timed out. Player +0, Opponent +1`);
    }

    playerScore += playerPoints;
    opponentScore += opponentPoints;

    // Highlight correct/wrong
    Array.from(optionsGrid.children).forEach(div => {
        if (div.textContent === correct) {
            div.classList.add('correct');
        } else if (div.textContent === selected) {
            div.classList.add('wrong');
        }
        div.onclick = null;
        div.onkeydown = null; // Disable further interaction
    });

    updateScoreboard();
    setTimeout(() => {
        currentQuestion++;
        loadQuestion();
    }, 1000); // 1-second interval
}

// Update scoreboard
function updateScoreboard() {
    playerScoreText.textContent = `You: ${playerScore}`;
    opponentScoreText.textContent = `${opponent}: ${opponentScore}`;
}

// End quiz
function endQuiz() {
    quizSection.style.display = 'none';
    resultMessage.textContent = `You scored ${playerScore}, ${opponent} scored ${opponentScore}. ${playerScore > opponentScore ? 'You win!' : playerScore < opponentScore ? `${opponent} wins!` : 'It\'s a tie!'}`;
    resultModal.style.display = 'flex';
}

// Restart quiz
function restartQuiz() {
    resultModal.style.display = 'none';
    opponent = null;
    quizSection.style.display = 'none';
    questionAnswered = false;
}
