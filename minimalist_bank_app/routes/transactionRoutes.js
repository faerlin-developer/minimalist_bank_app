const express = require('express');

const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authController = require('../controllers/authController');
const { createTransactionValidation, makeTransferValidation } = require('../validators/transactionValidator');

router
  .route('/')
  .post(
    authController.protect,
    createTransactionValidation,
    transactionController.createTransaction
  );

router
  .route('/:username')
  .get(authController.protect, transactionController.getTransactions);

router
  .route('/transfer')
  .post(
    authController.protect,
    makeTransferValidation,
    transactionController.makeTransfer
  );

module.exports = router;
