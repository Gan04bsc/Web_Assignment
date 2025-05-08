const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

const players = [];

io.on('connection', (socket) => {
    socket.on('join', (name) => {
        players.push(name);
        io.emit('updatePlayers', players);
    });

    socket.on('challenge', (opponent) => {
        // 实现挑战逻辑
    });

    socket.on('answer', (answer) => {
        // 验证答案并更新分数
    });

    socket.on('disconnect', () => {
        const index = players.indexOf(socket.name);
        if (index !== -1) {
            players.splice(index, 1);
            io.emit('updatePlayers', players);
        }
    });
});

http.listen(3000, () => console.log('Server running on port 3000'));
