/**
 * ApplicantController
 *
 * @description :: Server-side logic for managing Applicants
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
    dashboard: function(req, res) {
        // find GQ Test results
        GQTestResult.find({candidate: req.session.userId}).populate('test').exec(function (err, test_result) {
            //if (err) console.log(err)
            var gq_results = [];
            async.eachSeries(test_result, function(test, cb) {
                GQTestService.prepareCandidateResult(test.test.id, test.score, test.no_of_questions).then(function(result) {
                    result.test_title = test.test.test_name;
                    gq_results.push(result);
                    cb();
                }).catch(function(err) {
                    console.log('Catch:' + err);
                    cb(err);
                })
            },
            function() {
                // check for expertrating test result
                TestResult.find({ applicant: req.session.userId }).populate('applicant').exec(function(err, results) {
                    var xpr_results = [];
                    if (results.length > 0) {
                        //results.forEach(function(result) {
                        async.eachSeries(results, function(result, cb) {
                            CBTTest.find({ test_id: result.test_id }).populate('category').exec(function(err, test) {
                                if (test.length < 1) return cb();
                                result.test_title = test[0].test_name;
                                xpr_results.push(result);
                                cb();
                            });
                        },
                        function() {
                            return res.view('applicant/dashboard', {xpr_results: xpr_results, gq_results: gq_results});
                        });
                    } else {
                        return res.view('applicant/dashboard', { gq_results: gq_results });
                    }
                });
            });
        });
    },

    videoPage: function(req, res) {
        Resume.findOne({ user: req.session.userId }).exec(function(err, resume) {
            var fullname = resume.fullname.split(' ').join('-');
            return res.view('applicant/video', { video: resume.video_file, fname: fullname, resume_id: resume.id });
        });
    },

    //uploadVideo: function(req, res) {
    //    var allowedVidTypes = ['video/mp4'];
    //    var filename;
    //    var hr = process.hrtime();
    //    req.file('video_file').upload({
    //        dirname: require('path').resolve(sails.config.appPath, 'assets/applicant_videos/'),
    //        saveAs: function (file, cb) {
    //            if (allowedVidTypes.indexOf(file.headers['content-type']) === -1) {
    //                return res.badRequest('Unsupported video format.');
    //            }
    //            var ext = file.filename.split('.').pop();
    //            filename = req.param('video_file').length > 3 ? req.param('video_file') : req.param('video_title') + "_" + hr[1] + '.' + ext;
    //            return cb(null, filename);
    //        },
    //        maxBytes: 100 * 1024 * 1024
    //    },
    //    function (err) {
    //        if (err) {
    //            return res.view('misc/error-page', { error: 'Video file size must not be more than 100MB', url: '/applicant/resume-page' });
    //        }
    //        console.log(req.param('resume_id'));
    //        Resume.update({id: req.param('resume_id')}, { video_file: filename, video_status: 'true' }).exec(function (err, resume) {
    //            if (err) {
    //                return res.badRequest(err);
    //            }
    //            if (resume[0].status != 'Complete' && resume[0].test_status == true && resume[0].profile_status == true) {
    //                Resume.update({id: req.param('resume_id')}, {status: 'Complete'}).exec(function () {
    //                });
    //            }
    //            return res.redirect('/applicant/resume-page');
    //        });
    //    });
    //},

    getYoutubeAccessToken: function(req, res) {
        if (req.param('code')) { // for refresh token
            Youtube.authenticate(req.param('code')).then(function(token) {
                return res.json(200, { token: token });
            }).catch(function(err) {
                console.log('Error: ' + err);
            });
        } else {
            // run first time
            Youtube.getToken().then(function(resp) {
                if (resp.state == 'refresh') {
                    return res.redirect(resp.url);
                } else {
                    return res.json(resp.tokens)
                }
            }).catch(function(err) {
                console.log('Err: ' + err);
            });
        }
    },


    addYoutubeVideoID: function(req, res) {
        if (req.session.userId) {
            Resume.update({ user: req.session.userId }, { youtube_vid_id: req.param('video_id') }).exec(function() {});
        }
    },


    uploadPassport: function(req, res) {
        var allowedVidTypes = ['image/jpg', 'image/jpeg', 'image/png'];
        var filename;
        req.file('passport').upload({
            dirname: require('path').resolve(sails.config.appPath, 'assets/applicant_passports/'),
            saveAs: function (file, cb) {
                if (allowedVidTypes.indexOf(file.headers['content-type']) === -1) {
                    return res.badRequest('Unsupported photo format.');
                }
                var ext = file.filename.split('.').pop();
                filename = req.param('photo_title') + "_" + req.session.userId + '.' + ext;
                return cb(null, filename);
            },
            maxBytes: 16 * 1024 * 1024
        },
        function (err) {
            if (err) {
                return res.badRequest(err);
            }
            Resume.update({ user: req.session.userId }, { passport: filename }).exec(function () {
                return res.redirect('/applicant/profile');
            });
        });
    },

    showLanding: function(req, res) {
        Course.find({ status: 'Active' }).limit(3).exec(function(err, courses) {
            if (err) return res.badRequest();
            return res.view('candidate-page', { courses: courses });
        });
    },


    fetchApplicants: function(req, res) {
        GQTestService.fetchAllCandidatesAptitudeTestResult().then(function(candidates) {
            return res.view('admin/candidates', { candidates: candidates });
        }).catch(function(err) {
            console.log(err);
        });
    },

    // consider refactoring this method
    search: function(req, res) {
        var q = req.param;
        if (q('school') && q('course') && q('certification'))
        {
            var sql = "SELECT user FROM resume r JOIN education e ON e.resume = r.id JOIN qualification q ON r.id = q.resume " +
                "WHERE institution = ? AND programme = ? AND qualification = ?";

            var data = [q('school'), q('course'), q('certification')];
            Resume.query(sql, data, function(err, result) {
                var users = [];
                result.forEach(function(user) {
                    users.push(user);
                });
                GQTestService.fetchAllCandidatesAptitudeTestResult(users).then(function(results) {
                    return res.view('admin/candidates', { candidates: results });
                }).catch(function(err) {
                    return res.serverError(err);
                });
            });
        }
        else if (q('school') && q('course'))
        {
            console.log('Sola')
            var sql = "SELECT user FROM resume r JOIN education e ON e.resume = r.id WHERE institution = ? AND programme like ?";

            var data = [ q('school').trim(), '%' + q('course').trim() + '%' ];
            Resume.query(sql, data, function(err, result) {
                var users = [];
                result.forEach(function(user) {
                    users.push(user);
                });
                GQTestService.fetchAllCandidatesAptitudeTestResult(users).then(function(results) {
                    return res.view('admin/candidates', { candidates: results });
                }).catch(function(err) {
                    return res.serverError(err);
                });
            });
        }
        else if (q('course') && q('certification'))
        {
            var sql = "SELECT user FROM resume r JOIN education e ON e.resume = r.id JOIN qualification q ON r.id = q.resume " +
                "WHERE programme = ? AND qualification = ?";

            var data = [q('course').trim(), '%' + q('certification').trim() + '%'];
            Resume.query(sql, data, function(err, result) {
                var users = [];
                result.forEach(function(user) {
                    users.push(user);
                });
                GQTestService.fetchAllCandidatesAptitudeTestResult(users).then(function(results) {
                    return res.view('admin/candidates', { candidates: results });
                }).catch(function(err) {
                    return res.serverError(err);
                });
            });
        }
        else if (q('school') && q('certification'))
        {
            var sql = "SELECT user FROM resume r JOIN education e ON e.resume = r.id JOIN qualification q ON r.id = q.resume " +
                "WHERE institution = ? AND qualification = ?";

            var data = [q('school'), q('certification')];
            Resume.query(sql, data, function(err, result) {
                var users = [];
                result.forEach(function(user) {
                    users.push(user);
                });
                GQTestService.fetchAllCandidatesAptitudeTestResult(users).then(function(results) {
                    return res.view('admin/candidates', { candidates: results });
                }).catch(function(err) {
                    return res.serverError(err);
                });
            });
        }
        else if (q('school'))
        {
            Education.find({ institution: q('school') }).populate('resume').exec(function(err, results) {
                var users = [];
                results.forEach(function(user) {
                    users.push(user);
                });
                GQTestService.fetchAllCandidatesAptitudeTestResult(users).then(function(results) {
                    return res.view('admin/candidates', { candidates: results });
                }).catch(function(err) {
                    return res.serverError(err);
                });
            });
        }
        else if (q('course'))
        {
            Education.find({ programme: q('course') }).populate('resume').exec(function(err, results) {
                var users = [];
                results.forEach(function(user) {
                    users.push(user);
                });
                GQTestService.fetchAllCandidatesAptitudeTestResult(users).then(function(results) {
                    return res.view('admin/candidates', { candidates: results });
                }).catch(function(err) {
                    return res.serverError(err);
                });
            });
        }
        else if (q('certification'))
        {
            Qualification.find({ qualification: q('certification') }).populate('resume').exec(function(err, results) {
                var users = [];
                results.forEach(function(user) {
                    users.push(user);
                });
                GQTestService.fetchAllCandidatesAptitudeTestResult(users).then(function(results) {
                    return res.view('admin/candidates', { candidates: results });
                }).catch(function(err) {
                    return res.serverError(err);
                });
            });
        } else {
            GQTestService.fetchAllCandidatesAptitudeTestResult().then(function(candidates) {
                return res.view('admin/candidates', { candidates: candidates });
            }).catch(function(err) {
                console.log(err);
            });
        }
    }
};

