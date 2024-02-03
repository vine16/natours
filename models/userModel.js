const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

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
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      //this only works on CREATE OR SAVE!!(not on UPDATE)
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not same'
    }
  },
  passwordChangedAt: Date,
  role: {
    type: String,
    enum: ['user', 'admin', 'lead-guide', 'guide'],
    default: 'user'
  }
});

userSchema.pre('save', async function(next) {
  //just updated the password or created new
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  //   This line effectively removes the passwordConfirm field from the document before it goes through the validation phase and gets saved to the database
  this.passwordConfirm = undefined; //no need to store this in DB
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

userSchema.methods.changedPasswordAFter = function(JWTTimeStamp) {
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
const User = mongoose.model('User', userSchema);

module.exports = User;
