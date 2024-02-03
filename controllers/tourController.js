const Tour = require('./../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
//ALIASING
exports.topcheapTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name, price, ratingsAverage, summary, difficulty';
  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
  // console.log(req.query);
  const features = new APIFeatures(Tour.find({}), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tours = await features.query; //execute query object present in features object
  //Execute query
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    data: { tours }
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // console.log(req.params);
  const id = req.params.id * 1;

  const tour = await Tour.findOne({ _id: id });
  //wrong id
  if (!tour) {
    return next(new AppError('No Tour found with that id', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  });
});

//catch async errors
//here no req,res, next are passed into the catchAsync
//we should not calls a function
// const catchAsync = fn => {
//   fn(req, res, next).catch(err => next(err));
// };

//this controller fn will be called when it's route is hit
exports.createTour = catchAsync(async (req, res, next) => {
  // try {
  //   // const newTour = new Tour({});

  // newTour.save();
  const newTour = await Tour.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour
    }
  });
  // } catch (err) {
  //   //promise rejected
  //   res.status(400).json({
  //     status: 'fail',
  //     message: err
  //   });
  // }
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!tour) {
    return next(new AppError('No Tour found with that id', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError('No Tour found with that id', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// 1 operator=>
// {
//   operatorName: {}
// }
//  $avg: '$ratingsAverage' = AVG(ratingsAverage) in SQL
//sum += ratingsQuantity, do it for each document
// numRatings: {
//   $sum: '$ratingsQuantity';
// }
exports.getTourStats = catchAsync(async (req, res, next) => {
  // all the collection docs will pass through it
  // difficulty level, tour name, and maximum price.
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgRating: 1 }
    },
    {
      $match: { _id: { $ne: 'EASY' } } //_id = difficulty
    }
  ]);
  res.status(200).json({
    status: 'success',
    data: { stats }
  });
});
