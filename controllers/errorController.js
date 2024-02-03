const mongoose = require('mongoose');
const AppError = require('./../utils/appError');

const handleCastErrorDB = err => {
  // console.log('000000', err, '0000000');
  const message = `Invalid ${err.path}: ${err.value}`;

  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  // Extract the duplicate field from the error object
  const duplicatedField = Object.keys(err.keyValue)[0];

  // Check if the duplicated field is present and has a value
  const value = err.keyValue[duplicatedField];
  const message = `Duplicate field value: ${value}. Please use another value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError('Invalid token please login again', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired.', 401);
// set NODE_ENV=production
// node your_app.js
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  //  introduced because of user like entering invalid data,
  if (err.isOperational) {
    console.log('production error');
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
    //Programming or other unknown error: don't leak error details
  } else {
    //log the error for programmer
    console.error('ERROR', err);
    //send generic message

    res.status(500).json({
      status: 'error',
      message: 'Something went wrong'
    });
  }
};

//4 args, error handing middleware
// In Express.js, when you call the next function with an argument (usually an error), it triggers the error-handling middleware.
module.exports = (err, req, res, next) => {
  // ('🔥 ', err, '🔥');console.log
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    //error from mongodb, they are not marked as operational: true
    //err is inherting 'Error' class, so it can acess a property 'message' of Error class
    //but error has just direct properties of 'err'
    let error = { ...err };
    error.message = err.message; //solution
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    //fun will create error from our appError class, therefore marked as operational: true

    if (error.code === 11000) error = handleDuplicateFieldsDB(error);

    //mongoose validation error
    if (err instanceof mongoose.Error.ValidationError) {
      error = handleValidationErrorDB(error);
    }

    if (error.name === 'JsonWebTokenError') {
      error = handleJWTError(error);
    }

    if (error.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }
    sendErrorProd(error, res);
  }
};
