const express = require('express');
const bodyParser = require('body-parser');
const { Kafka } = require('kafkajs');
const mailHelper = require('./helpers/mail_helper');
const smtpSettingsTimeout = 60 * 60 * 24 * 30;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const kafka = new Kafka({
  brokers: ['bank-services-cluster-kafka-bootstrap.bank-services.svc:9092'],
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});
const producer = kafka.producer()
const consumer = kafka.consumer({ groupId: 'group1' })

const run = async () => {
  // Producing
  await producer.connect()


  // Consuming
  await consumer.connect()
  await consumer.subscribe({ topic: 'send-email', fromBeginning: true })

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      var mailAddress = message.mailAddress.toString();
      console.log({
        partition,
        offset: message.offset,
        value: mailAddress,
      })

      handleSendMail(req.body.mailAddress, (response) => {
        producer.send({
          topic: 'send-email',
          messages: [
            { value: response.msg },
          ],
        });
        // return res.status(response.status).send(response.msg);
      });
    },
  })
}

run().catch(console.error);

app.get('/', (req, res) => {
  console.log('req.quary:', req.quary);
  return handleSendMail(res, null);
});

app.post('/', (req, res) => {
  console.log('req.body:', req.body);
  handleSendMail(req.body.mailAddress, (response) => {
    return res.status(response.status).send(response.msg);
  });
});

app.get('/health', (req, res) => {
  res.status(200);
  res.send('healthy');
});

app.listen(8080, () => {
  console.log('App listening on port 8080!');
});

function handleSendMail(mailAddress, callback) {
  let data = { to: mailAddress || 'amr.fahmy@linkdev.com', message: 'Hello Dear', subject: 'Thank you' };

  mailHelper.getSMTPsettings(function (smtpData) {
    if (!smtpData) {
      return callback({ status: 500, msg: 'Please configure your SMTP settings first' }); //res.status(500).send("Please configure your SMTP settings first");
    }

    mailHelper.setSmtpTransport(smtpData);

    mailHelper.setMaileTemplate('mail', data, function (html) {
      data.html = html;
      mailHelper.send(data, smtpData, function (error) {
        console.log('send error:', error);

        return callback({ status: 200, msg: 'ok' }); //res.status(200).send('Ok');
      });
    });
  });
}
