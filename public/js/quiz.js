const socket = io();
let playerName = '';

function joinGame() {
    playerName = document.getElementById('player-name').value;
    if (playerName) {
        socket.emit('join', playerName);
        document.getElementById('player-info').style.display = 'none';
    }
}

socket.on('updatePlayers', (players) => {
    const playerList = document.getElementById('player-list');
    playerList.innerHTML = '';
    players.forEach((player) => {
        if (player !== playerName) {
            const li = document.createElement('li');
            li.textContent = player;
            li.onclick = () => socket.emit('challenge', player);
            playerList.appendChild(li);
        }
    });
});

socket.on('question', (data) => {
    document.getElementById('quiz-area').style.display = 'block';
    document.getElementById('question-text').textContent = data.question;
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';
    data.options.forEach((option) => {
        const button = document.createElement('button');
        button.textContent = option;
        button.onclick = () => socket.emit('answer', option);
        optionsDiv.appendChild(button);
    });
});

socket.on('score', (score) => {
    document.getElementById('score').textContent = `Score: ${score}`;
});
