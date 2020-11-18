const express = require('express');

const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authController = require('../controllers/authController');

router
  .route('/')
  .post(
    authController.protect,
    transactionController.createTransactionValidation,
    transactionController.createTransaction
  );

router
  .route('/:username')
  .get(authController.protect, transactionController.getTransactions);

router
  .route('/transfer')
  .post(
    authController.protect,
    transactionController.makeTransferValidation,
    transactionController.makeTransfer
  );

module.exports = router;
