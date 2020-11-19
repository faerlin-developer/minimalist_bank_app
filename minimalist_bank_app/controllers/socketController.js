const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const authController = require('../controllers/authController');
const { promisify } = require('util');

exports.disconnect = socket => {
  socket.on('disconnect', () => {
    console.log(`user disconnected with id: ${socket.id}`);
  });
};

exports.join = socket => {
  socket.on('join', async function (data) {
    const { isVerified, error } = await authController.verifyToken(data.token);
    if (isVerified) {
      socket.join(data.room);
      console.log(`Socket ID ${socket.id} joined ${data.room} room`);
      console.log(socket.rooms);
    } else {
      const message = `Failed to join ${data.room} room`;
      socket.emit('joinFail', message);
    }
  });
};

exports.leave = socket => {
  socket.on('leave', function (room) {
    socket.leave(room);
    console.log(`Socket ID ${socket.id} left ${room} room`);
    console.log(socket.rooms);
  });
};
