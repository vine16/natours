// const dotenv = require('dotenv');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const app = require('./app');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE;
mongoose
  .connect(DB, {
    useNewUrlParser: true, // Ensure compatibility with modern MongoDB drivers
    useUnifiedTopology: true // Use the latest MongoDB driver topology
  })
  .then(() => console.log('DB connection successfull'));
// .catch(err => console.log('ERROR'));

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`App running on port ${PORT}...`);
});

//EVENT AND EVENT LISTENER
//in case of unhandled promise anywhere in our appcliation,
//the process object will emit 'unhandled rejection' event, so just listen to taht
//handle asynchronous code
process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! SHUTTING DOWN....');
  console.log(err);
  server.close(() => {
    //close after completing the running processes
    process.exit(1);
  });
});

// uncought exception
process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION');
  console.log(err);
  server.close(() => {
    //close after completing the running processes
    //WE NEED TO RESTART THE SERVER
    process.exit(1);
  });
});
