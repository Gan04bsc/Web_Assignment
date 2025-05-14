const socket = io();

let currentPlayer = null;
let players = [];
let opponent = null;
let currentQuestion = 0;
let playerScore = 0;
let opponentScore = 0;
let timer = null;
const TIME_PER_QUESTION = 10;
let questionAnswered = false;

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

// Quiz data
const quizData = [
    {
        question: "This fruit is?",
        image: "images/question1.jpg", // Replace with actual image path
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

function registerPlayer() {
    const name = playerNameInput.value.trim();
    if (!name) {
        alert('Please enter a name!');
        return;
    }
    currentPlayer = name;
    socket.emit('join', name);
    playerNameInput.disabled = true;
    document.querySelector('.player-input button').disabled = true;
}

function updatePlayerList() {
    playerList.innerHTML = '';
    players.forEach(player => {
        if (player.name !== currentPlayer) {
            const li = document.createElement('li');
            li.textContent = player.name;
            li.onclick = () => challengePlayer(player.id);
            playerList.appendChild(li);
        }
    });
}

function challengePlayer(playerId) {
    socket.emit('challenge', playerId);
}
socket.on('connect', () => {
    console.log('Successfully connected to the server');
});

socket.on('updatePlayers', (playerListData) => {
    players = playerListData;
    updatePlayerList();
});

socket.on('startGame', ({ gameId, opponent }) => {
    quizSection.style.display = 'block';
    opponentName = opponent;
    currentQuestion = 0;
    playerScore = 0;
    opponentScore = 0;
    loadQuestion();
});

socket.on('nextQuestion', (question) => {
    loadQuestion(question);
});

socket.on('scoreUpdate', (score) => {
    playerScoreText.textContent = `You: ${score}`;
});

socket.on('endGame', (score) => {
    resultMessage.textContent = `Your final score: ${score}.`;
    resultModal.style.display = 'flex';
});

function loadQuestion() {
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
        optionsGrid.appendChild(div);
    });
    startTimer();
}

function startTimer() {
    let timeLeft = TIME_PER_QUESTION;
    timerProgress.style.width = '100%';
    timer = setInterval(() => {
        timeLeft -= 0.1;
        timerProgress.style.width = `${(timeLeft / TIME_PER_QUESTION) * 100}%`;
        if (timeLeft <= 0) {
            clearInterval(timer);
            if (!questionAnswered) selectOption(null);
        }
    }, 100);
}

function selectOption(selected) {
    if (questionAnswered) return;
    questionAnswered = true;
    clearInterval(timer);
    socket.emit('answer', { gameId: currentGameId, selected });
}

acceptChallenge.onclick = () => {
    socket.emit('acceptChallenge', opponentId);
    challengeModal.style.display = 'none';
};

rejectChallenge.onclick = () => {
    socket.emit('rejectChallenge', opponentId);
    challengeModal.style.display = 'none';
};
