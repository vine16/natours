const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const User = require('./../models/userModel');
const AppError = require('../utils/appError');

function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
}

exports.signup = catchAsync(async (req, res, next) => {
  // const newUser = await User.create(req.body);
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt
  });

  const token = generateToken(newUser._id);

  res.status(200).json({
    status: 'success',
    token,
    data: {
      user: newUser
    }
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1. check if email and password exists
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  //2. check if user exixts && password is correct
  const user = await User.findOne({ email }).select('+password');
  const isMatched = await user.comparePassword(password, user.password);
  console.log(isMatched, 'isMatched');
  if (!user || !isMatched) {
    console.log('inside the if');
    return next(new AppError('Email or Password is incorrect', 401));
  }

  //3. if everything ok, send token to client
  const token = generateToken(user._id);
  res.status(200).json({
    status: 'success',
    token
  });
});

exports.protect = catchAsync(async function(req, res, next) {
  // console.log(req.headers);

  //1. check if token exists
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError("You're not logged in. Please log in first", 401));
  }

  //2. verify the jwt token
  //.verify() will return the decoded payload
  const fn = promisify(jwt.verify);
  const decoded = await fn(token, process.env.JWT_SECRET);

  //3. check if user still exists(we may have deleted the user, after assiging the token)
  //here, we are sure, 'ID' is not changed
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError('the user belonging to this token does no longer exists')
    );
  }

  //4. Check if user changed password after the token was issued
  const isChanged = freshUser.changedPasswordAFter(decoded.iat);
  if (isChanged) {
    next(
      new AppError(
        'the passwod changed, please login again to get new token',
        401
      )
    );
  }

  req.user = freshUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //here we'll have acess to roles, because of  closure
    if (!roles.includes(req.user.role)) {
      next(new AppError('You are not allowed to perform this action'), 401);
    }

    next();
  };
};
