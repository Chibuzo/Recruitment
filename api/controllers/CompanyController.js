/**
 * CompanyController
 *
 * @description :: Server-side logic for managing Companies
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var Passwords = require('machinepack-passwords');
var os = require('os');
os.tmpDir = os.tmpdir;

module.exports = {
    dashboard: function(req, res) {
        Job.find().populate('applications').exec(function(err, jobs) {
            if (err) return res.badRequest(err);
            return res.view('company/dashboard', { jobs: jobs });
        });
    },


	initialSetup: function(req, res) {
        var hash = req.param('hash');
        var email = new Buffer(req.param('email'), 'base64').toString('ascii');
        var crypto = require('crypto');
        var expected_hash = crypto.createHash('md5').update(email + 'thishastobesomethingextremelynonsensicalanduseless').digest('hex');
        if (hash == expected_hash) {
            // lets see if this idiot is clicking a stale link
            Company.find({contact_email: email}).exec(function (err, com) {
                if (err) return console.log(err);
                CountryStateService.getCountries().then(function (resp) {
                    if (com.length > 0) {
                        // mofo detected! redirect...
                        req.session.coy_id = com.id;
                        Sector.find({removed: 'false'}).exec(function (err, sectors) {
                            return res.view('company/setup', {
                                company: com[0],
                                sectors: sectors,
                                first_time: 'true',
                                countries: resp.countries,
                                states: resp.states
                            });
                        });
                    } else {
                        CompanyRequest.findOne({contact_email: email}).exec(function (err, coy) {
                            if (err) return console.log(err);
                            var comp = {
                                company_name: coy.company_name,
                                contact_person: coy.contact_person,
                                contact_phone: coy.contact_phone,
                                contact_email: coy.contact_email
                            };
                            Company.create(comp).exec(function (err, cmpy) {
                                if (err) return console.log(err);
                                req.session.coy_id = cmpy.id;
                                Sector.find({removed: 'false'}).exec(function (err, sectors) {
                                    return res.view('company/setup', {
                                        company: cmpy,
                                        sectors: sectors,
                                        first_time: 'true',
                                        countries: resp.countries,
                                        states: resp.states
                                    });
                                });
                            });
                        });
                    }
                });
            });
        }
    },

    updateDetails: function (req, res) {
        var q = req.param;

        var data = {
            company_name: q('company_name'),
            sector: q('sector'),
            contact_person: q('contact_person'),
            contact_phone: q('contact_phone'),
            contact_email: q('contact_email'),
            description: q('description'),
            address: q('address'),
            country: q('country'),
            r_state: q('state'),
            city: q('city'),
            sector: q('sector'),
        };
        Company.update({ id: req.session.coy_id }, data).exec(function (err, com) {
            if (err) return console.log(err);
        });

        var allowedImgTypes = ['image/png', 'image/jpeg', 'image/gif'];
        var filename;
        req.file('logo').upload({
            dirname: require('path').resolve(sails.config.appPath, 'assets/logos/'),
            saveAs: function(file, cb) {
                if (allowedImgTypes.indexOf(file.headers['content-type']) === -1) {
                    return res.badRequest('Unsupported picture format.');
                }
                var ext = file.filename.split('.').pop();
                filename = q('company_name').split(' ').join('-') + '_logo.' + ext;
                return cb(null, filename);
            }
        },
        function(err) {
            if (err) {
                return res.ok();
            }
            //if (!_.isEmpty(q('logo_name'))) filename = q('logo_name');
            Company.update({ id: req.session.coy_id }, { logo_name: filename }).exec(function() {});
        });

        if (q('first_check') == 'true') {
            Passwords.encryptPassword({
                password: q('password'),
            }).exec({
                error: function (err) {
                    return res.json(200, { status: 'error', msg: err });
                },
                success: function (encryptedPassword) {
                    // add access user for this company
                    var user = {
                        fullname: q('contact_person'),
                        email: q('contact_email'),
                        password: encryptedPassword,
                        company: req.session.coy_id,
                        user_type: 'company-admin',
                        status: 'Active'
                    };
                    User.create(user).exec(function () {});
                }
            });
        }
        return res.json(200, { status: 'success' });
    },

    profile: function(req, res) {
        Company.findOne({ id: req.session.coy_id }).exec(function (err, com) {
            if (err) return console.log(err);
            Sector.find({ removed: 'false'}).exec(function(err, sectors) {
                CountryStateService.getCountries().then(function(resp) {
                    return res.view('company/setup', {company: com, sectors: sectors, countries: resp.countries, states: resp.states});
                });
            });
        });
    },

    addUser: function(req, res) {
        if (_.isUndefined(req.param('email'))) {
            return res.json(200, { status: 'error', msg: 'An email address is required!' });
        }

        var data = {
            fullname: req.param('fname') + ' ' + req.param('lname'),
            email: req.param('email'),
            company: req.session.coy_id
        };
        CompanyUser.create(data).exec(function(err, comp_user) {
            if (err) {
                if (err.invalidAttributes && err.invalidAttributes.email && err.invalidAttributes.email[0] && err.invalidAttributes.email[0].rule === 'unique') {
                    return res.json(200, { status: 'error', msg: 'Email address is already taken, please try another one.' });
                }
                return res.json(501, { status: 'error', msg: err }); // couldn't be completed
            }
            Company.find({ id: req.session.coy_id }).exec(function(err, comp) {
                sendMail.sendCompanyInviteEmail(comp_user, comp[0]);
            });
            return res.json(200, { status: 'success' });
        });
    },

    activateUser: function(req, res) {
        var hash = req.param('hash');
        var email = new Buffer(req.param('email'), 'base64').toString('ascii');
        var crypto = require('crypto');
        var expected_hash = crypto.createHash('md5').update(email + 'thishastobesomethingextremelynonsensicalanduseless').digest('hex');
        if (hash == expected_hash) {
            CompanyUser.update({ email: email }, { status: 'Active' }).exec(function(err, coy_user) {
                if (err) return console.log(coy_user);
                var data = {
                    fullname: coy_user[0].fullname,
                    email: email,
                    user_type: 'company',
                    company: coy_user[0].company,
                    status: 'Active'
                };
                User.findOrCreate({ email: email }, data).exec(function(err, newUser) {
                    if (err) return;
                    var me = {
                        fname: coy_user[0].fullname.split(' ')[0],
                        lname: coy_user[0].fullname.split(' ')[1]
                    };
                    req.session.userId = newUser.id;
                    req.session.coy_id = coy_user[0].company;
                    req.session.user_type = 'company';
                    CountryStateService.getCountries().then(function(resp) {
                        return res.view('company/users/profile', {user: coy_user[0], me: me, countries: resp.countries, states: resp.states, first_time: true});
                    });
                });
            });
        } else {
            console.log('Wrong hash')
        }
    },

    updateUser: function(req, res) {
        Passwords.encryptPassword({
            password: req.param('new_password'),
        }).exec({
            error: function (err) {
                return res.serverError(err);
            },
            success: function (encryptedPassword) {
                var fullname = req.param('fname') + ' ' + req.param('lname');
                // update user and add password
                User.update({ id: req.session.userId }, { fullname: fullname, password: encryptedPassword }).exec(function() {});
                var data = {
                    fullname: fullname,
                    country: req.param('country'),
                    r_state: req.param('state'),
                    city: req.param('city')
                };
                CompanyUser.update({ id: req.param('coy_user_id') }, data).exec(function(err) {
                    if (err) console.log(err);
                    return res.json(200, { status: 'success' });
                });
            }
        });
    },

    getUsers: function(req, res) {
        CompanyUser.find({ company: req.session.coy_id }).exec(function(err, users) {
            if (err) return;
            return res.view('company/users', { users: users });
        });
    },

    removeUser: function(req, res) {
        CompanyUser.destroy({ id: req.param('id') }).exec(function(err, user) {
            User.destroy({ email: user.email }).exec(function() {});
            return res.json(200, { status: 'success' });
        });
    },


    // admin view
    viewCompanies: function(req, res) {
        Company.find({ status: 'Active' }).exec(function(err, coys) {
            return res.view('admin/list-companies', { companies: coys });
        });
    }
};

