/**
 * ApplicantController
 *
 * @description :: Server-side logic for managing Applicants
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
    dashboard: function(req, res) {
        const enableAmplitude = sails.config.ENABLE_AMPLITUDE ? true : false;
        const userEmail = req.session.userEmail;

		return ApplicantService.getChecklistData(req.session.userId)
			.then(userChecklist => {
				return res.view('applicant/dashboard', {
					userChecklist: userChecklist,
					enableAmplitude: enableAmplitude,
					userEmail: userEmail
				});
			}).catch(err => {
				return res.serverError(err);
			});
    },

    videoPage: function(req, res) {
        Resume.findOne({ user: req.session.userId }).exec(function(err, resume) {
            var fullname = resume.fullname.split(' ').join('-');
            return res.view('applicant/video', { video: resume.video_file, fname: fullname, resume_id: resume.id });
        });
    },

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
            return Resume.update({ user: req.session.userId }, { youtube_vid_id: req.param('video_id'), video_status: 'true' })
                .then(resumes => {
                    if (resumes[0].status != 'Complete' && resumes[0].test_status == true && resumes[0].profile_status == true) {
                        return Resume.update({id: resumes[0].id}, {status: 'Complete'})
                            .then(() => {
                                return res.ok();
                            })
                            .catch(err => {
                                return res.serverError(err);
                            });
                    }
                    return res.ok();
                }).catch(err => {
                    return res.serverError(err);
                })
        } else {
            return res.forbidden();
        }
    },


    deleteYoutubeVideo: function(req, res) {
        Youtube.deleteVideo(req.param('video_id'));
        return res.ok();
    },


    // candidate's profile photo
    uploadPhoto: function(req, res) {
        // var allowedVidTypes = ['image/jpg', 'image/jpeg', 'image/png'];
        req.file('photo').upload({
            adapter: require('skipper-better-s3'),
            key: 'AKIAITZYZILPYGBFJWCA',
            secret: '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',
            region: 'us-east-1',
            bucket: 'getqualified',
            headers: {
                ContentType: 'image/*'
            },
            maxBytes: 2 * 1024 * 1024
        },
        function (err, upfile) {
            if (err == '01') {
                return res.view('misc/error-page', { error: 'Unsupported photo format. Must be a JPG or PNG file', url: '/applicant/resume-page' })
            } else if (err) {
                return res.view('misc/error-page', { error: 'Photo file size must not be more than 2MB', url: '/applicant/resume-page' })
            }
            // this is weird but let's check if a file was uploaded
            if (!upfile) {
                return res.redirect('/applicant/resume-page#photo');
            }
            let fname;
            try {
                fname = upfile[0].extra.Location;
            } catch (err) {
                console.log(err)
            }

            Resume.update({ user: req.session.userId }, { photo: fname, photo_status: 'true', profile_status: 'true' }).exec(function () {
                AmplitudeService.trackEvent('Uploaded Profile Photo', req.session.userEmail);
                return res.redirect('/applicant/resume-page#photo');
            });
            if (_.isUndefined(req.param('photo_name')) || req.param('photo_name').length < 1) {
                GeneralReportService.updateField('photos');
            }
        });
    },


    // candidate's profile video
    uploadVideo: function(req, res) {
        const fs = require('fs');
        var path = require('path').resolve(sails.config.appPath + '/assets/applicant_profilevideos');
        var hr = process.hrtime();
        var filename = hr[1] + '.webm';
        path += '/' + filename;
        var video = req.param('data').split(';base64,').pop();
        var buff = new Buffer(video, 'base64');
        fs.writeFileSync(path, buff);

        const uploadedvid = require('path').resolve(sails.config.appPath, 'assets/applicant_profilevideos') + '/' + filename;

        S3Service.uploadProfileVideo(uploadedvid).then(function(resp) {
            Resume.update({ user: req.session.userId }, { video_file: resp.url, youtube_vid_id: '', video_status: 'true' }).exec(function () {
                // check for old video and delete
                // console.log(req.param('old_video'))
                // S3Service.deleteProfileVideo(req.param('old_video'));
                
                // delete GQ's copy of the uploaded video
                if (fs.existsSync(uploadedvid)) {
                    fs.unlinkSync(uploadedvid);
                }
                AmplitudeService.trackEvent('Uploaded Profile Video', req.session.userEmail);
                if (req.param('video_status') === false) GeneralReportService.updateField('videos'); 
                return res.redirect('/applicant/resume-page#video');
            });
        }).catch(function(err) {
            return res.json(400, { status: 'error', message: err });
        });
    },

    // will deprecate this hot messy fix asap
    uploadDownloadedVideo: function(req, res) {        
        req.file('profile_video').upload({
            adapter: require('skipper-better-s3'),
            key: 'AKIAITZYZILPYGBFJWCA',
            secret: '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',
            region: 'us-east-1',
            bucket: 'getqualified',
            headers: {
                ContentType: 'video/*'
            }
        }, function (err, upfile) {
            if (err) {
                return res.json(400, { status: 'error', message: err });
            }
            // this is weird but let's check if a file was uploaded
            if (!upfile) {
                return res.json(400, { status: 'error', message: 'No file was uploaded' });
            }
            try {
                let fname = upfile[0].extra.Location;
            
                Resume.update({ user: req.session.userId }, { video_file: fname, youtube_vid_id: '', video_status: 'true' }).exec(function (err) {
                    return res.json(200, { status: 'success' });
                });
            } catch(err) {
                return res.json(400, { status: 'error', message: err.message });
            }
        });
    },


    showLanding: function(req, res) {
        Course.find({ status: 'Active' }).limit(3).exec(function(err, courses) {
            if (err) return res.badRequest();
            return res.view('candidate-page', { courses: courses });
        });
    },


    fetchStatisticsPage: function(req, res) {
        ApplicantService.getApplicantStatistics().then(function(stats) {
            return res.view('admin/candidates-stat', { 
                statistics: stats,
                filter: 'All Users',
                info: 'All the user who have signed up with Get Qualified.'
            });
        }).catch(err => {
            return res.serverError(err);
        });
    },


    search: function(req, res) {
        const q = req.param;

        ApplicantService.searchResume(q('school'), q('course'), q('result'), q('certificate'), q('state')).then(function(users) {
            // choose a struggle
            if (q('page') == 'test') {
                // for test result page
                GQTestService.fetchAllCandidatesAptitudeTestResult(users).then(function(results) {
                    return res.view('admin/testresult', { candidates: results });
                }).catch(function(err) {
                    return res.serverError(err);
                });
            } else if (q('page') == 'stat') {
                // for all candidates' page
                ApplicantService.getApplicantStatistics().then(function(stats) {
                    Resume.find({ user: users }).exec(function(err, fusers) {
                        return res.view('admin/candidates-stat', {
                            statistics: stats,
                            users: fusers,
                            filter: 'Search Result',
                            info: 'All the Candidates that match the search criteria',
                            resume: true
                        });
                    });
                });
            }
        }).catch(function(err) {
            if (q('page') == 'test') {
                return res.redirect('/admin/applicants');
            } else {
                return res.redirect('/admin/candidates/all');
            }
        });
    },

    deleteTestScoreAndFiles: function(req, res) {
        const userId = parseInt(req.param('userId') || "");

        if (!userId) {
            return res.badRequest('Missing/invalid user id');
        }
        CBTService.cancelGQApptitudeTest(userId);
        User.findOne(userId).exec(function(err, user) {
            sendMail.testResetNotification(user);
        });
        return res.ok();
    },


    sendEmail: function(req, res) {
        let email_arr = req.param('users').split(",");  // convert string to array
        if (email_arr.length < 50) {
            let emails = email_arr.toString();
            sendMail.emailCandidates(emails, req.param('subject'), req.param('message'));
            return res.json(200, { status: 'success' });
        } else {
            while (email_arr.length > 0) {
                let emails = [];
                while (email_arr.length > 0 && emails.length < 49) {
                    emails.push(email_arr.pop());
                }
                sendMail.emailCandidates(emails, req.param('subject'), req.param('message'));
            }
            return res.json(200, { status: 'success' });
        }
    },

    deleteApplicants: function(req, res) {
        var users = req.param('users');

        if (!users) {
            return res.badRequest('Missing Users');
        }

        return ApplicantService.deleteApplicant(users)
            .then(() => {
                return res.ok();
            })
            .catch(err => {
                return res.serverError(err);
            });
    }
};
