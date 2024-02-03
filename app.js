const express = require('express');
const morgan = require('morgan');
const AppError = require('./utils/appError');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const globalErrorHandler = require('./controllers/errorController');

const app = express();

// 1) MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.static(`${__dirname}/public`));

// 3) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

//if were reach here, means user's url is not okay
//req-res has not ended yet
// creates an AppError with a 404 status and passes it to the next() middleware.
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server`
  // });
  // const err = new Error(`Can't find ${req.originalUrl} on this server`);
  // err.status = 'fail';
  // err.statusCode = 404;
  // next(err);

  // If a route handler or middleware calls next with an argument (an instance of AppError), it triggers the error handling middleware (errorController).
  // The errorController sets the status code and status based on the error properties and sends a JSON response with the error message.
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

//global error handler middleware
app.use(globalErrorHandler);

module.exports = app;
