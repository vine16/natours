const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name']
  },
  email: {
    type: String,
    required: [true, 'Please enter you email'],
    unique: [true, 'Email already exits'],
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'Enter a password'],
    minLength: 8,
    select: false
  },
  passwordConfirm: {
    type: String
    // required: [true, 'Please confirm your password'],
    // validate: {
    //   //this only works on CREATE OR SAVE!!(not on UPDATE)
    //   validator: function(el) {
    //     return el === this.password;
    //   },
    //   message: 'Passwords are not same'
    // }
  },
  passwordChangedAt: Date,
  role: {
    type: String,
    enum: ['user', 'admin', 'lead-guide', 'guide'],
    default: 'user'
  },
  passwordResetToken: String,
  passwordResetExpires: Date
});

userSchema.pre('save', async function(next) {
  //just updated the password or created new
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  //   This line effectively removes the passwordConfirm field from the document before it goes through the validation phase and gets saved to the database
  this.passwordConfirm = undefined; //no need to store this in DB
  next();
});

userSchema.pre('save', function(next) {
  //password modify ni hua hai ya fir new doc hai
  //new user k lie 'passwordChangeAt' set krne ki zarurat ni hai, usko to abhi abhi new token mila hi hai
  //old token misuse krne ka darr thodi hai yha pe
  if (!this.isModified('password') || this.isNew) {
    return next(); //run the next middleware
  }

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// model should be responsible for actions directly related to the data it represents.

//caller will use the async await
userSchema.methods.comparePassword = async (
  userEnteredPassword,
  hashedPassword
) => {
  const result = await bcrypt.compare(userEnteredPassword, hashedPassword);
  return result;
};

//check if password is changed after assigning this token, if so, then token will be invalid
userSchema.methods.changedPasswordAfter = function(JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const passwordChangedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // console.log(passwordChangedTimeStamp, JWTTimeStamp, '🔥');
    return passwordChangedTimeStamp > JWTTimeStamp;
  }
  return false;
};

//send this token to user, to uniquely identify the user to reset password
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  //store hashed password in database
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //store it, because we have to compare it when user visits the password reset link and share the token
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
