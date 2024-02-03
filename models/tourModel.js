const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
//natours => collections(tables) => one collection(table) is Tour
// So, Tour(returned by mongoose.model()) is the model that is now associated with the 'TourModel' collection in MongoDB. You can use the Tour model to perform CRUD (Create, Read, Update, Delete) operations on documents in the 'TourModel' collection.
// mongoose.model(<Collectionname>, <CollectionSchema>)
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Error: A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal than 40 chars'],
      minlength: [10, 'A tour must have more than 10 chars']
      // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    slug: String,
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty']
    },
    ratingsAverage: {
      type: Number,
      default: 4.5
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(valueEntered) {
          //this only points to teh current doc on NEW DOC creation, not on update
          return valueEntered > this.price;
        },
        message: 'Discount price ({VALUE}) should be less than actual price'
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a descripotion']
    },
    description: {
      type: String,
      trim: true
    },
    secretTour: {
      type: Boolean,
      default: false
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover iamge']
    },
    images: [String], //string array
    createdAt: {
      type: Date,
      default: Date.now()
    },
    startDates: [Date]
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

//this => currently processed document
//for each document in collection, call this method
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

//DOCUMENT MIDDLEWARE : runs before .save() or .create() methods for a doc
tourSchema.pre('save', function(next) {
  console.log(this);
  this.slug = slugify(this.name, { lower: true });
  next();
});

tourSchema.pre('save', function(next) {
  console.log('will save document..');
  next();
});

//after running all the .pre() and saving then doc
//no access to 'this' keyword, but the finished document
tourSchema.post('save', function(doc, next) {
  console.log(doc);
  //perform operations like logging, sending notifications, or updating related documents.
  next();
});

//QUERY MIDDLEWARE
tourSchema.pre(/^find/, function(next) {
  //when this query will be executed for 'find()'
  //this find() would also be remain attached and thus only the tours where
  //secretTour != true will be retrieved
  this.find({ secretTour: { $ne: true } });
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
