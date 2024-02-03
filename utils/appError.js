class AppError extends Error {
  constructor(message, statusCode) {
    super(message); //set the message property
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; //send message to user for these errors

    // Error.captureStackTrace(this, this.constructor);: Captures the stack trace for the current instance of AppError, and this information will be available when inspecting the error object.
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
