const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 3000;

// ✅ 关键一步：暴露 public 文件夹作为静态页面目录
app.use(express.static('public'));

let rooms = {};

io.on('connection', socket => {
  socket.on('join', roomId => {
    socket.join(roomId);
    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push(socket);

    io.to(roomId).emit('status', rooms[roomId].length);

    socket.on('play', ({ roomId, hand }) => {
      socket.hand = hand;
      const players = rooms[roomId];
      if (players.length === 2 && players[0].hand && players[1].hand) {
        const [p1, p2] = players;
        let result = {
          p1: p1.hand,
          p2: p2.hand,
          winner: getWinner(p1.hand, p2.hand)
        };
        io.to(roomId).emit('result', result);
        delete p1.hand;
        delete p2.hand;
      }
    });

    socket.on('disconnect', () => {
      rooms[roomId] = rooms[roomId].filter(s => s !== socket);
      if (rooms[roomId].length === 0) delete rooms[roomId];
    });
  });
});

function getWinner(h1, h2) {
  if (h1 === h2) return 'draw';
  if ((h1 === '石头' && h2 === '剪刀') || (h1 === '剪刀' && h2 === '布') || (h1 === '布' && h2 === '石头')) return 'p1';
  return 'p2';
}

http.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});

