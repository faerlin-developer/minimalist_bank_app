const express = require('express');
const { app, io, http } = require('./app');
const transactionRouter = require('./routes/transactionRoutes');
const userRouter = require('./routes/userRoutes');
const socketController = require('./controllers/socketController');

/**********
 * Routes *
 **********/

app.use(express.static(`${__dirname}/public`));
app.use('/api/v1/transactions', transactionRouter);
app.use('/api/v1/users', userRouter);
app.get('/', function (req, res) {
  res.sendFile(`${__dirname}/public/index.html`);
});

/**************************
 * Socket Event Listeners *
 **************************/

io.on('connection', socket => {
  const socketId = socket.id;
  console.log(`a user connected with id: ${socket.id}`);

  socketController.disconnect(socket);
  socketController.join(socket);
  socketController.leave(socket);
});

const port = process.env.PORT || 3000;
http.listen(port, () => {
  console.log(`App running on port ${port}`);
});
