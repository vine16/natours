const nodemailer = require('nodemailer');

const sendEmail = async options => {
  //1. CREATE A TRANSPROT - to send mail
  const transporter = nodemailer.createTransport({
    host: 'sandbox.smtp.mailtrap.io',
    port: 2525,
    auth: {
      user: '42fdf142b7d4fa',
      pass: '9e953891f8ce8e'
    }
  });

  //2. Define the email option
  //this is just email testing, it will get trapped in the 'mailtrap'
  //to send actual email, we have to verify our mail address from which we are sending our email
  const sender = { name: 'Vinay Kumar', email: 'mynatoursapp.com' };
  const mailOptions = {
    from: sender,
    to: options.email,
    subject: options.subject,
    text: options.message
    // html:
  };

  //actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
