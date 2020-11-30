const Transaction = require('../models/transactionModel');
const User = require('../models/userModel');
const { io } = require('../app');

const CREATE_TRANSACTION_EVENT = 'createTransaction';
const MAKE_TRANSFER_EVENT = 'makeTransfer';

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      username: req.params.username,
    });
    res.status(200).json({
      status: 'success',
      results: transactions.length,
      data: {
        transactions,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.toString(),
    });
  }
};



exports.createTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.create(req.body);
    io.sockets.in(req.body.username).emit(CREATE_TRANSACTION_EVENT, transaction);

    res.status(200).json({
      status: 'success',
      results: transaction.length,
      data: {
        transaction,
      },
    });
  } catch (err) {
    return sendError(res, 400, err.toString());
  }
};

exports.makeTransfer = async (req, res) => {
  const usernameFrom = req.body.usernameFrom;
  const usernameTo = req.body.usernameTo;
  const amount = req.body.amount;

  const negativeBody = {
    username: usernameFrom,
    amount: -1 * req.body.amount,
    type: 'WITHDRAW',
    transfer_username: usernameTo,
  };

  const positiveBody = {
    username: usernameTo,
    amount: req.body.amount,
    type: 'DEPOSIT',
    transfer_username: usernameFrom,
  };

  try {
    const negativeTransaction = await Transaction.create(negativeBody);
    const positiveTransaction = await Transaction.create(positiveBody);
    io.sockets.in(usernameFrom).emit(MAKE_TRANSFER_EVENT, negativeTransaction);
    io.sockets.in(usernameTo).emit(MAKE_TRANSFER_EVENT, positiveTransaction);
  } catch (err) {
    return sendError(res, 400, err.toString());
  }

  res.status(200).json({
    status: 'success',
  });
};

function sendError(res, statusCode, message) {
  res.status(statusCode).json({
    status: 'fail',
    message: message,
  });
}
