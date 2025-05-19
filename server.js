const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

const players = [];
const games = {}; // { gameId: { players: [player1, player2], currentQuestion, answered, firstAnswered, scores } }
const pendingChallenges = {}; // { opponentId: { challengerId, challengerName } }

// 示例题库
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

io.on('connection', (socket) => {
    socket.on('join', (name) => {
        players.push({ id: socket.id, name, score: 0 });
        io.emit('updatePlayers', players);
        console.log(`[Connected] User ID: ${socket.id} has connected`);
    });

    socket.on('disconnect', () => {
        console.log(`[Disconnected] User ID: ${socket.id} has disconnected`);
        const index = players.findIndex(p => p.id === socket.id);
        if (index !== -1) {
            players.splice(index, 1);
            io.emit('updatePlayers', players);
        }
    });
    
    // 发起挑战
    socket.on('challenge', (opponentId) => {
        const challenger = players.find(p => p.id === socket.id);
        const opponent = players.find(p => p.id === opponentId);
        if (!opponent || !challenger) return;
        pendingChallenges[opponentId] = { challengerId: socket.id, challengerName: challenger.name };
        io.to(opponentId).emit('challengeRequest', { challengerId: socket.id, challengerName: challenger.name });
    });

    // 接受挑战
    socket.on('acceptChallenge', (challengerId) => {
        const opponent = players.find(p => p.id === socket.id);
        const challenger = players.find(p => p.id === challengerId);
        if (!challenger || !opponent) return;
        const gameId = `${challengerId}_${socket.id}_${Date.now()}`;
        games[gameId] = {
            players: [challengerId, socket.id],
            currentQuestion: 0,
            answered: {},
            firstAnswered: null,
            scores: { [challengerId]: 0, [socket.id]: 0 }
        };
        io.to(challengerId).emit('startGame', { gameId, opponent: opponent.name });
        io.to(socket.id).emit('startGame', { gameId, opponent: challenger.name });
        delete pendingChallenges[socket.id];
    });

    // 拒绝挑战
    socket.on('rejectChallenge', (challengerId) => {
        io.to(challengerId).emit('challengeRejected');
        delete pendingChallenges[socket.id];
    });


// 答题事件处理
socket.on('answer', ({ gameId, selected }) => {
    const game = games[gameId];
    if (!game) return;
    const question = quizData[game.currentQuestion];
    const correctAnswer = question.answer;
    
    // 向两方发送停止信号和正确答案
    game.players.forEach(playerId => {
        io.to(playerId).emit('stopTimeForBoth', { correctAnswer });
    });
    
    // 记录答案
    if (!game.answered) game.answered = {};
    if (game.answered[socket.id]) return;
    game.answered[socket.id] = selected;
    
    // 记录第一个答对的人
    if (selected === correctAnswer && !game.firstAnswered) {
        game.firstAnswered = socket.id;
    }

    // 3秒后进入下一题
    setTimeout(() => {
        const [p1, p2] = game.players;
        
        // 确保分数初始化
        if (!game.scores) game.scores = {};
        if (typeof game.scores[p1] !== 'number') game.scores[p1] = 0;
        if (typeof game.scores[p2] !== 'number') game.scores[p2] = 0;
        
        // 获取双方答案
        const answer1 = game.answered[p1] || null;
        const answer2 = game.answered[p2] || null;
        
        // 分数判定逻辑
        if (game.firstAnswered) {
            // 有人答对了，得2分
            game.scores[game.firstAnswered] += 2;
        } else {
            // 没人答对，看谁答错了
            if (answer1 !== null && answer1 !== correctAnswer) {
                // p1答错，p2得1分
                game.scores[p2] += 1;
            }
            if (answer2 !== null && answer2 !== correctAnswer) {
                // p2答错，p1得1分
                game.scores[p1] += 1;
            }
        }
        
        // 同步分数
        io.to(p1).emit('scoreUpdate', {
            yourScore: game.scores[p1],
            opponentScore: game.scores[p2]
        });
        io.to(p2).emit('scoreUpdate', {
            yourScore: game.scores[p2],
            opponentScore: game.scores[p1]
        });
        
        // 进入下一题
        game.currentQuestion++;
        if (game.currentQuestion >= quizData.length) {
            io.to(p1).emit('endGame', { yourScore: game.scores[p1], opponentScore: game.scores[p2] });
            io.to(p2).emit('endGame', { yourScore: game.scores[p2], opponentScore: game.scores[p1] });
            delete games[gameId];
        } else {
            const nextQuestion = quizData[game.currentQuestion];
            io.to(p1).emit('nextQuestion', nextQuestion);
            io.to(p2).emit('nextQuestion', nextQuestion);
            game.answered = {};
            game.firstAnswered = null;
        }
    }, 3000);
    });


    socket.on('leaveGame', ({ gameId }) => {
        const game = games[gameId];
        if (!game) return;
        notifyOpponentAndClean(game, socket.id);
    });

    socket.on('disconnect', () => {
        const game = Object.values(games)
          .find(g => g.players.includes(socket.id));
        if (game) notifyOpponentAndClean(game, socket.id);
    });



});
function notifyOpponentAndClean(game, leaverId) {
  const otherId = game.players.find(pid => pid !== leaverId);
  if (otherId) io.to(otherId).emit('opponentLeft'); 
  
  for (const gameId in games) {
    if (games[gameId] === game) {
      delete games[gameId];
      break;
    }
  }
}

http.listen(3000, '0.0.0.0', () => console.log('Server running on port 3000'));