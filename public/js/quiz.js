const socket = io();

let currentPlayer = null;
let players = [];
let opponent = null;
let opponentId = null;
let currentGameId = null;
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

// Quiz data (仅用于本地显示题目，实际判题以服务端为准)
const quizData = [
    {
        question: "This fruit is?",
        image: "images/question1.jpg",
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

// 挑战请求弹窗
socket.on('challengeRequest', ({ challengerId, challengerName }) => {
    opponentId = challengerId;
    modalTitle.textContent = 'Challenge Request';
    modalMessage.textContent = `${challengerName} wants to challenge you!`;
    challengeModal.style.display = 'flex';
});

// 挑战被拒绝
socket.on('challengeRejected', () => {
    alert('Your challenge was rejected.');
});

// 接受/拒绝挑战
acceptChallenge.onclick = () => {
    socket.emit('acceptChallenge', opponentId);
    challengeModal.style.display = 'none';
};
rejectChallenge.onclick = () => {
    socket.emit('rejectChallenge', opponentId);
    challengeModal.style.display = 'none';
};

// 开始游戏
socket.on('startGame', ({ gameId, opponent: oppName }) => {
    currentGameId = gameId;
    quizSection.style.display = 'block';
    opponent = oppName;
    currentQuestion = 0;
    playerScore = 0;
    opponentScore = 0;
    playerScoreText.textContent = `You: 0`;
    opponentScoreText.textContent = `Opponent: 0`;
    loadQuestion();
});
socket.on('nextQuestion', (question) => {
    // 直接更新题号
    currentQuestion++;
    
    setTimeout(() => {
        loadQuestion(question);
        questionAnswered = false;
        startTimer();
    }, 3000);
});
socket.on('scoreUpdate', ({ yourScore, opponentScore }) => {
    console.log('scoreUpdate:', yourScore, opponentScore);
    playerScoreText.textContent = `You: ${yourScore}`;
    opponentScoreText.textContent = `Opponent: ${opponentScore}`;
});
socket.on('stopTimeForBoth', ({ correctAnswer }) => {
    console.log('收到停止指令:', correctAnswer);
    clearInterval(timer);
    timerProgress.style.width = '0%';
    
    const options = document.querySelectorAll('.option');
    options.forEach(option => {
        option.style.pointerEvents = 'none';
        option.style.cursor = 'default';
        
        // 对选项进行标记
        if (option.textContent.trim() === correctAnswer.trim()) {
            option.classList.add('correct');
        }
    });
    
    questionAnswered = true;
});


socket.on('endGame', ({ yourScore, opponentScore }) => {
    let msg = `Your final score: ${yourScore}. Opponent: ${opponentScore}. `;
    if (yourScore > opponentScore) msg += "You Win!";
    else if (yourScore < opponentScore) msg += "You Lose!";
    else msg += "Draw!";
    resultMessage.textContent = msg;
    resultModal.style.display = 'flex';
});


function loadQuestion(q) {
    // q 为空时用本地 quizData
    let questionObj = q || quizData[currentQuestion];
    questionNumber.textContent = `Question ${currentQuestion + 1}/${quizData.length}`;
    questionImage.src = questionObj.image;
    questionText.textContent = questionObj.question;
    optionsGrid.innerHTML = '';
    questionObj.options.forEach(option => {
        const div = document.createElement('div');
        div.className = 'option';
        div.textContent = option;
        div.onclick = () => selectOption(option);
        optionsGrid.appendChild(div);
    });
    questionAnswered = false;
    startTimer();
}

function startTimer() {
    let timeLeft = TIME_PER_QUESTION;
    timerProgress.style.width = '100%';
    if (timer) clearInterval(timer);
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
    
    // 禁用所有选项
    const options = document.querySelectorAll('.option');
    options.forEach(option => option.style.pointerEvents = 'none');
    
    // 通知服务器提交答案 (服务器会返回 stopTimeForBoth 事件)
    socket.emit('answer', { gameId: currentGameId, selected });

const correctAnswer = quizData[currentQuestion].answer;
console.log('Debug - 答题:', {selected, correctAnswer, currentQuestion});

options.forEach(option => {
    // 先移除可能存在的类
    option.classList.remove('correct', 'wrong');
    
    const optionText = option.textContent.trim();
    const correctAnswerText = correctAnswer.trim();
    
    // 选择的选项
    if (optionText === selected) {
        // 选择正确 - 绿色
        if (selected === correctAnswerText) {
            option.classList.add('correct');
            console.log('选择正确:', optionText);
        } 
        // 选择错误 - 红色
        else {
            option.classList.add('wrong');
            console.log('选择错误:', optionText);
        }
    }
    // 标记正确答案
    else if (optionText === correctAnswerText) {
        option.classList.add('correct');
        console.log('正确答案标记:', optionText);
    }
});

    // 更新得分板
    setTimeout(() => {
        socket.emit('scoreUpdate'); // 更新得分
    }, 3000); // 等待3秒
}

// 重新开始
function restartQuiz() {
    window.location.reload();
}