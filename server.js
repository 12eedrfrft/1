const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const rooms = {};

io.on('connection', socket => {
  socket.on('join', roomId => {
    socket.join(roomId);
    if (!rooms[roomId]) rooms[roomId] = { p1: null, p2: null, sockets: [] };
    rooms[roomId].sockets.push(socket.id);
    io.to(roomId).emit('status', rooms[roomId].sockets.length);
  });

  socket.on('play', ({ roomId, hand }) => {
    const rm = rooms[roomId];
    if (!rm) return;
    if (rm.sockets[0] === socket.id) rm.p1 = hand;
    else rm.p2 = hand;

    if (rm.p1 && rm.p2) {
      let result;
      if (rm.p1 === rm.p2) result = 'draw';
      else if (
        (rm.p1 === '石头' && rm.p2 === '剪刀') ||
        (rm.p1 === '剪刀' && rm.p2 === '布') ||
        (rm.p1 === '布' && rm.p2 === '石头')
      ) result = 'p1';
      else result = 'p2';

      io.to(roomId).emit('result', {
        p1: rm.p1,
        p2: rm.p2,
        winner: result
      });

      rm.p1 = rm.p2 = null;
    }
  });

  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      const rm = rooms[roomId];
      if (rm) {
        rm.sockets = rm.sockets.filter(id => id !== socket.id);
        if (rm.sockets.length === 0) delete rooms[roomId];
        else io.to(roomId).emit('status', rm.sockets.length);
      }
    }
  });
});

server.listen(3000, () => console.log(`服务器已启动：http://localhost:3000`));
