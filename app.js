const express = require('express');
const bodyParser = require('body-parser');
const mailHelper = require('./helpers/mail_helper');
const smtpSettingsTimeout = 60 * 60 * 24 * 30;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  console.log('req.body:', req.body);

  mailHelper.getSMTPsettings(function (smtpData) {
    if (!smtpData) {
      return res.status(500).send("Please configure your SMTP settings first");
    }

    mailHelper.setSmtpTransport(smtpData);
    var data = { to: 'amr.fahmy@linkdev.com', message: 'Hello Dear', subject: 'Thank you for using exchange online service' };

    mailHelper.setMaileTemplate('mail', data, function (html) {
      data.html = html;
      mailHelper.send(data, smtpData, function (error) {
        console.log('send error:', error);
        return res.status(200).send('Ok');
      });
    });
  });
});

app.get('/health', (req, res) => {
  res.status(200);
  res.send('healthy');
});

app.listen(8080, () => {
  console.log('App listening on port 8080!');
});
