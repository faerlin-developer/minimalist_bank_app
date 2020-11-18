const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'A transaction must have a username'],
  },
  date: {
    type: Date,
    default: Date.now,
  },
  amount: {
    type: Number,
    required: [true, 'A transaction must have an amount'],
  },
  type: {
    type: String,
    enum: ['DEPOSIT', 'WITHDRAW'],
    required: [true, 'A transaction must have a type'],
  },
  transfer_username: {
    type: String,
    default: 'none',
  },
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
