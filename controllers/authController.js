const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const User = require('./../models/userModel');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

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
  const isChanged = freshUser.changedPasswordAfter(decoded.iat);
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

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1. Get user based on posted email
  // console.log(req.body);
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email address', 404));
  }

  //2. Generate te random token
  const resetToken = user.createPasswordResetToken();
  await user.save(); //but as we have not provided all the required data fields
  //3. send it back as an email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}}`;

  const message = `Forgot your password? Submit a new PATCH request with you new password and passwordConfirm to ${resetURL}. \n If you didn't forgot your password please ignore this email`;

  console.log('🔥🔥');
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('There was an error sending the email, try again later', 500)
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  //2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  //3) update changedPasswordAt property for the user
  //new password is in the body
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  //remove these fields from DB
  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;

  //can't just use the .update() because we want to run the 'pre' methods before save to hash passwords
  //and also to run the validators
  await user.save(); //no need to disabble the validator
  //4) Log the user in, send JWT

  const token = generateToken(user._id);
  res.status(200).json({
    status: 'success',
    token
  });
});
