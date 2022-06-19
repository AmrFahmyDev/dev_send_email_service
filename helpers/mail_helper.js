const nodemailer = require("nodemailer");
const fs = require('fs');
const jade = require('jade');
var smtpTransport;

module.exports = {
    getSMTPsettings: function (callback) {
        const configData = {
            debug: process.env.smtp_debug || true,
            smtpHost: process.env.SMTP_HOST || "smtpHost",
            smtpPort: process.env.smtp_port || 587,
            smtpSecure: process.env.smtp_secure || true,
            smtpSecureConnection: process.env.smtp_secure_connection || false,
            smtpUser: process.env.SMTP_USER || "smtpUser",
            smtpPassword: process.env.SMTP_PASSWORD || "smtpPassword",
            smtpFrom: process.env.smtp_from || "Exchange Online Service' <no-reply@bubbles.cc>"
        }
        
        callback(configData);
    },
    setSmtpTransport: function (data) {
        if (data) {
            var transportData = {
                debug: data.debug,
                host: data.smtpHost,
                port: data.smtpPort,
                secure: data.smtpSecure,
                secureConnection: data.smtpSecureConnection,
                auth: {
                    user: data.smtpUser,
                    pass: data.smtpPassword
                }
            };

            console.log('transportData:', transportData);

            smtpTransport = nodemailer.createTransport("SMTP", transportData);
        } else {

        }
    },
    setMaileTemplate: function (template, replaceData, callback) {
        template = template || 'mail';

        var templateName = template + '.jade';
        var viewsPath = 'templates/';
        var filePath = viewsPath + '/emails/' + templateName;

        fs.readFile(filePath, 'utf8', function (err, data) {
            if (err)
                console.log('readFile|err: ', err);

            var fn = jade.compile(data);
            var html = fn(replaceData);
            callback(html);
        });
    },
    send: function (data, smtpData, callback) {
        data.variables = data.variables || {};
        if (!data || typeof data.to === 'undefined') {
            return false;
        }

        // send the message and get a callback with an error or details of the message that was sent
        var mailContainer = {
            text: data.message,
            to: data.to,
            subject: data.subject,
            from: smtpData.smtpFrom
        };
        if (data.attachments) {
            mailContainer.attachments = data.attachments;
        }

        if (typeof data.html !== "undefined") {
            mailContainer['html'] = data.html
        }

        this.sending(mailContainer, callback, undefined, smtpData);
    },
    sending: function (mailContainer, callback, dontHandleSendMailErrors, smtpData) {
        // console.log('mailContainer:', mailContainer);

        console.log('>>sending|smtpTransport:');

        if (smtpTransport == undefined) {
            setSmtpTransport(smtpData);
        }

        smtpTransport.sendMail(mailContainer, function (error) {
            console.log('sendMail|error:', error);
            smtpTransport = null;
            callback(error);
        });
    }
}