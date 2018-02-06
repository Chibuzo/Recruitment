//'use strict';
//const nodemailer = require('nodemailer');
//var hbs = require('nodemailer-express-handlebars');
//var options = {
//    viewEngine: 'express-handlebars',
//    viewPath: sails.config.appPath + '/views/emails/'
//};
//
//// create reusable transporter object using the default SMTP transport
//let transporter = nodemailer.createTransport({
//    host: 'smtp.zoho.com',
//    port: 465,
//    secure: true, // true for 465, false for other ports
//    auth: {
//        user: 'noreply@getqualified.work',
//        pass: 'change+this'  // generated ethereal password
//    }
//});
//transporter.use('compile', hbs(options));
//
//module.exports = {
//    //sendEmail: function(template, data, opts, cb) {
//    //    sails.hooks.email.send(template, data, opts, cb);
//    //},
//
//    // company request verification
//    sendVerificationEmail: function(coy) {
//        var base_url = 'https://getqualified.work/';
//        var email_b64 = new Buffer(coy.contact_email).toString('base64');
//        var crypto = require('crypto');
//        var hash = crypto.createHash('md5').update(coy.contact_email + 'thishastobesomethingextremelynonsensicalanduseless').digest('hex');
//        var data = {
//            company: coy.company_name,
//            contact_name: coy.contact_person,
//            email: coy.contact_email,
//            url: base_url + 'coy/setup/' + hash + '/' + email_b64
//        };
//        var opts = {
//            from: "Get Qualified <no-reply@getqualifed.ng>",
//            sender: "no-reply@getqualifed.ng",
//            to: coy.contact_email,
//            subject: "GQ Company Verification"
//        };
//        module.exports.sendEmail('verificationEmail', data, opts, function(err) {
//            if (err) console.log(err);
//        });
//        let mailOptions = {
//            from: '"Get Qualified" <no-reply@getqualifed.ng>', // sender address
//            to: user.fullname + ', ' + user.email,
//            subject: 'GQ Company Verification', // Subject line
//            template: 'company_verification',
//            context: {
//                company: coy.company_name,
//                contact_name: coy.contact_person,
//                url: base_url + 'coy/setup/' + hash + '/' + email_b64
//            }
//        };
//        // send mail with defined transport object
//        transporter.sendMail(mailOptions, (error, info) => {
//            if (error) {
//                return console.log(error);
//            }
//            console.log('Message sent: %s', info.messageId);
//        });
//    },
//
//    sendConfirmationEmail: function(user) {
//        var email_b64 = new Buffer(user.email).toString('base64');
//        var crypto = require('crypto');
//        var hash = crypto.createHash('md5').update(user.email + 'okirikwenEE129Okpkenakai').digest('hex');
//
//        var data = {
//            user: user.fullname,
//            email: email_b64,
//            hash: hash
//        };
//        var opts = {
//            from: "Get Qualified <no-reply@getqualified.ng>",
//            sender: "no-reply@getqualified.ng",
//            to: user.email,
//            subject: "Get Qualified - Confirm Your Account"
//        };
//        module.exports.sendEmail('activationEmail', data, opts, function(err) {
//            if (err) console.log(err);
//        });
//    },
//
//    sendCompanyInviteEmail: function(user, coy) {
//        var base_url = 'http://18.217.134.186:1337/';
//        var email_b64 = new Buffer(user.email).toString('base64');
//        var crypto = require('crypto');
//        var hash = crypto.createHash('md5').update(user.email + 'thishastobesomethingextremelynonsensicalanduseless').digest('hex');
//        var data = {
//            user: user.fullname,
//            company: coy.company_name,
//            contact_name: coy.contact_person,
//            url: base_url + 'company/activate-user/' + hash + '/' + email_b64
//        };
//        var opts = {
//            from: "Get Qualified <no-reply@getqualifed.ng>",
//            sender: "no-reply@getqualifed.ng",
//            to: user.email,
//            subject: "GQ Company User Verification"
//        };
//        module.exports.sendEmail('companyUserActivationEmail', data, opts, function(err) {
//            if (err) console.log(err);
//        });
//    },
//
//    sendAppliedJobNotice: function(job, user) {
//        var email_b64 = new Buffer(user.email).toString('base64');
//        var crypto = require('crypto');
//        var hash = crypto.createHash('md5').update(user.email + 'okirikwenEE129Okpkenakai').digest('hex');
//
//        var data = {
//            user: user.fullname,
//            job_title: job.job_title,
//            company: job.company.company_name,
//            email: email_b64,
//            hash: hash
//        };
//        var opts = {
//            from: "Get Qualified <no-reply@getqualified.ng>",
//            sender: "no-reply@getqualified.ng",
//            to: user.email,
//            subject: "Get Qualified - Complete Your Job Application"
//        };
//        module.exports.sendEmail('appliedJobNotice', data, opts, function(err) {
//            if (err) console.log(err);
//        });
//    }
//
//
//}
