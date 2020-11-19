const Transaction = require('../models/transactionModel');
const User = require('../models/userModel');
const { app, io, http } = require('../app');

const CREATE_TRANSACTION_NAME = 'createTransaction';
const MAKE_TRANSFER_NAME = 'makeTransfer';

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

exports.createTransactionValidation = async (req, res, next) => {
  const schemaAttributes = Object.entries(Transaction.schema.paths);
  for (const [field, attributes] of schemaAttributes) {
    if (attributes.isRequired && !(field in req.body)) {
      const message = `Invalid request: ${field} is missing in body.`;
      return sendError(res, 400, message);
    }
  }

  const account = await User.find({ username: req.body.username });
  const message = 'Invalid request: username not found in database';
  if (account.length === 0) {
    return sendError(res, 400, message);
  }

  next();
};

exports.createTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.create(req.body);
    io.sockets.in(req.body.username).emit(CREATE_TRANSACTION_NAME, transaction);

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

exports.makeTransferValidation = async (req, res, next) => {
  const requiredFields = ['usernameFrom', 'usernameTo', 'amount'];
  for (const field of requiredFields) {
    if (!(field in req.body)) {
      const message = `Invalid request: ${field} is missing in body.`;
      return sendError(res, 400, message);
    }
  }

  if (req.body.usernameFrom === req.body.usernameTo) {
    const message = 'Invalid request: cannot send money to the same account.';
    return sendError(res, 400, message);
  }

  if (req.body.usernameFrom === '' || req.body.usernameTo === '') {
    const message = 'Invalid request: username cannot be empty string';
    return sendError(res, 400, message);
  }

  const accountFrom = await User.find({ username: req.body.usernameFrom });
  const accountTo = await User.find({ username: req.body.usernameTo });
  if (accountFrom.length === 0 || accountTo.length === 0) {
    const message = 'Invalid request: username does not exist in database.';
    return sendError(res, 400, message);
  }

  const transactions = await Transaction.find({
    username: req.body.usernameFrom,
  });

  let balance = 0;
  transactions.forEach(transaction => {
    balance += transaction.amount;
  });

  if (req.body.amount > balance) {
    const message = 'Invalid request: insufficient funds';
    return sendError(res, 400, message);
  }

  next();
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
    io.sockets.in(usernameFrom).emit(MAKE_TRANSFER_NAME, negativeTransaction);
    io.sockets.in(usernameTo).emit(MAKE_TRANSFER_NAME, positiveTransaction);
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
