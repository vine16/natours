const dotenv = require('dotenv');
const mongoose = require('mongoose');
const fs = require('fs');
const Tour = require('../../models/tourModel');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE;
mongoose.connect(DB, {
  useNewUrlParser: true, // Ensure compatibility with modern MongoDB drivers
  useUnifiedTopology: true // Use the latest MongoDB driver topology
});

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
// console.log(typeof tours, 'type');
const deleteData = async () => {
  try {
    await Tour.deleteMany(); //delete all doc in collection
    console.log('Data successfully deleted');
  } catch (err) {
    console.log(err);
  }

  process.exit();
};

const importData = async () => {
  try {
    await Tour.create(tours);
    console.log('Data successfully loaded');
  } catch (err) {
    console.log(err);
  }

  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
