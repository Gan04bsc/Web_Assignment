const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

const players = [];

// Track the games
const games = {}; // { gameId: { players: [player1, player2], currentQuestion: 0 } }

io.on('connection', (socket) => {
    socket.on('join', (name) => {
        players.push({ id: socket.id, name });
        io.emit('updatePlayers', players);
        console.log(`[连接] 用户 ID: ${socket.id} 已连接`);
    });

    socket.on('disconnect', () => {
        // +++ 新增：用户断开时打印日志 +++
        console.log(`[断开] 用户 ID: ${socket.id} 已断开`);
        const index = players.findIndex(p => p.id === socket.id);
        if (index !== -1) {
            players.splice(index, 1);
            io.emit('updatePlayers', players);
        }
    });

    socket.on('challenge', (opponentId) => {
        const opponent = players.find(p => p.id === opponentId);
        if (!opponent) return;
        // Start the game
        const gameId = `${socket.id}_${opponentId}_${Date.now()}`;
        games[gameId] = { players: [socket.id, opponent.id], currentQuestion: 0 };
        io.to(socket.id).emit('startGame', { gameId, opponent: opponent.name });
        io.to(opponent.id).emit('startGame', { gameId, opponent: socket.name });
    });

    socket.on('answer', ({ gameId, selected }) => {
        const game = games[gameId];
        if (!game) return;
        const question = quizData[game.currentQuestion];
        const correctAnswer = question.answer;

        let playerScore = 0;
        if (selected === correctAnswer) playerScore = 2;

        // Update the scores
        const currentPlayer = players.find(p => p.id === socket.id);
        currentPlayer.score = (currentPlayer.score || 0) + playerScore;

        // Broadcast scores to both players
        io.to(game.players[0]).emit('scoreUpdate', currentPlayer.score);
        io.to(game.players[1]).emit('scoreUpdate', currentPlayer.score);

        // Move to the next question or end game
        game.currentQuestion++;
        if (game.currentQuestion >= quizData.length) {
            io.to(game.players[0]).emit('endGame', currentPlayer.score);
            io.to(game.players[1]).emit('endGame', currentPlayer.score);
            delete games[gameId];
        } else {
            const nextQuestion = quizData[game.currentQuestion];
            io.to(game.players[0]).emit('nextQuestion', nextQuestion);
            io.to(game.players[1]).emit('nextQuestion', nextQuestion);
        }
    });

    socket.on('disconnect', () => {
        const index = players.findIndex(p => p.id === socket.id);
        if (index !== -1) {
            players.splice(index, 1);
            io.emit('updatePlayers', players);
        }
    });
});

http.listen(3000, () => console.log('Server running on port 3000'));
