const Transaction = require('../models/transactionModel');
const User = require('../models/userModel');

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