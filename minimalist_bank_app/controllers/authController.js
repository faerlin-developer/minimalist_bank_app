const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { promisify } = require('util');
const { send } = require('process');

exports.signup = async (req, res, next) => {
  try {
    const newUser = await User.create({
      username: req.body.username,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });

    const token = signToken(newUser._id);

    res.status(201).json({
      status: 'success',
      token,
      data: {
        username: newUser.username,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.toString(),
    });
  }
};

exports.signupValidation = async (req, res, next) => {
  const schemaAttributes = Object.entries(User.schema.paths);
  for (const [field, attributes] of schemaAttributes) {
    if (attributes.isRequired && !(field in req.body)) {
      const message = `Invalid request: ${field} is missing in body.`;
      return sendError(res, 400, message);
    }
  }

  next();
};

exports.loginValidation = async (req, res, next) => {
  const schemaAttributes = Object.entries(User.schema.paths);
  for (const [field, attributes] of schemaAttributes) {
    if (attributes.isRequired && !(field in req.body)) {
      const message = `Invalid request: ${field} is missing in body.`;
      return sendError(res, 400, message);
    }
  }

  next();
};

exports.login = async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  const user = await User.findOne({ username });

  if (!user) {
    return res.status(400).json({
      status: 'fail',
      message: 'Incorrect username or password',
    });
  }

  const correct = await user.correctPassword(password, user.password);

  if (correct) {
    const token = signToken(user._id);
    res.status(200).json({
      status: 'success',
      token,
      data: { username },
    });
  } else {
    return res.status(401).json({
      status: 'fail',
      message: 'Incorrect username or password',
    });
  }
};

exports.protect = async (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return sendError(res, 401, 'Token is missing from header.');
  }

  const { isVerified, error } = await verifyToken(token);
  if (isVerified) {
    next();
  } else {
    return sendError(res, error.errCode, error.errMessage);
  }
};

exports.verifyToken = verifyToken;

function signToken(id) {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
}

function getTokenFromRequest(req) {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(/\s+/)[1];
  }
  return token;
}

async function verifyToken(token) {
  let isVerified, error;
  try {
    // Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // Check if user still exists
    const freshUser = await User.findById(decoded.id);

    isVerified = true;
    if (!freshUser) {
      error = {
        errCode: 401,
        errMessage: 'The user belonging to the token no longer exists',
      };
      isVerified = false;
    }

    // If application allows updating password, check that next.
    // Otherwise, skip to next step.
  } catch (err) {
    error = { errCode: 500, errMessage: err.toString() };
    isVerified = false;
  }

  return { isVerified, error };
}

function sendError(res, statusCode, message) {
  res.status(statusCode).json({
    status: 'fail',
    message: message,
  });
}
