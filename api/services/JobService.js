module.exports = {
    /* check if candidate can apply for the job */
    checkEligibility: function(job_id, candidate_id) {
        var criteria = {
            test: false,
            video: false
        };
        return new Promise(function(resolve, reject) {
            Job.find({ id: job_id }).exec(function(err, job) {
                if (err || job.length < 1) return reject('Job not found');
                Resume.find({ user: candidate_id }).exec(function(err, resume) {
                    // test requirement
                    if (job[0].require_test === true && resume[0].test_status === true) {
                        criteria.test = true;
                    } else if (job[0].require_test === false) {
                        criteria.test = true;
                    }
                    // video profile requirement
                    if (job[0].require_video === true && resume[0].video_status === true) {
                        criteria.video = true;
                    } else if (job[0].require_video === false) {
                        criteria.video = true;
                    }
                    return resolve({ status: criteria.test && criteria.video ? true : false });
                });
            });
        });
    },

    apply: function (job_id, applicant_id) {
        return new Promise(function (resolve, reject) {
            // let's make sure no one applies more than once
            Application.find({job: job_id, applicant: applicant_id}).exec(function (err, result) {
                if (err) return reject(err);
                if (result.length > 0) return resolve(true);

                // let's proceed
                Job.findOne({id: job_id}).exec(function (err, job) {
                    if (err) return reject(err);
                    if (!job) return reject('Job not found'); // shouldn't get here in the first place.
                    JobTest.find({ job_category_id: job.category, job_level: job.job_level }).exec(function(jt_err, tests) {
                        var data = {
                            job: job_id,
                            company: job.company,
                            applicant: applicant_id,
                            status: tests.length > 0 ? 'Take test' : 'Under Review'
                        };
                        Application.create(data).exec(function (err) {
                            if (err) return reject(err);
                            return resolve(true);
                        });
                    });
                });
            });
        });
    },


    // this function will delete ALL the jobs the applicant applied to
    removeApplicantJobs: function (applicant_id) {
        Application.destroy({applicant: applicant_id}).exec(function (err, applications) {
            // remove competency tests if any
            applications.forEach(function (app) {
                Job.find({id: app.job}).exec(function (err, job) {
                    JobTest.find({
                        job_level: job[0].job_level,
                        job_category_id: job[0].category
                    }).exec(function (err, test) {
                        if (test[0].test_source == 'gq') {
                            GQTestResult({candidate: applicant_id}).exec(function (err, deleted_test) {
                                ProctorService.deleteProctorSession(deleted_test.proctor);
                            });
                        } else {
                            TestResult({applicant: applicant_id}).exec(function () {
                            });
                        }
                    });
                });
            });
        });
    },


    fetchCompanyJobs: function (coy_id, job_status = 'open') {
        var criteria = { company: coy_id };
        var today = new Date();
        if (job_status == 'open') {
            criteria.closing_date = { '>=': today };
            criteria.status = 'Active';
        } else if (job_status == 'all') {
            criteria.closing_date = { '>': new Date('2017-05-05') }; // this is a stale date
        } else if (job_status == 'closed') {
            criteria.closing_date = { '<': today };
            criteria.status = 'Active';
        } else {
            criteria.closing_date = { '<': today };
            criteria.status = 'Inactive';
        }
        return new Promise(function (resolve, reject) {
            Job.find(criteria).populate('category').populate('applications').populate('poster').sort('createdAt desc').exec(function (err, jobs) {
                if (err) {
                    reject(err);
                    return;
                }
                var _jobs = [];
                var today = new Date();

                async.eachSeries(jobs, function (job, cb) {
                    JobTest.count({
                        job_level: job.job_level,
                        job_category_id: job.category
                    }).exec(function (err, assessed) {
                        job.assessed = assessed;

                        // catch GQ posted jobs
                        //console.log(job)
                        if (job.poster && job.poster.id == 0) {
                            job.admin_post = 'GQ';
                        }

                        if (Date.parse(job.closing_date) <= Date.parse(today)) {
                            SelectedCandidate.count({job_id: job.id}).populate('candidate').exec(function (err, selected_candidates) {
                                job.shortlisted = selected_candidates;
                                _jobs.push(job);
                                cb();
                            });
                        } else {
                            job.shortlisted = false;
                            _jobs.push(job);
                            cb();
                        }
                    });
                }, function (err) {
                    return resolve(_jobs);
                });
            });
        });
    },


    fetchJobApplicants: function(job_id, start, rows, search = undefined) {
        var query = { job: job_id };
        return new Promise(function(resolve, reject) {
            if (search && search.length > 2) {
                let sql = "SELECT DISTINCT email, fullname, u.status, u.id FROM application ap JOIN user u ON u.id = ap.applicant WHERE job = ? AND fullname LIKE ? OR email LIKE ? AND job = ?";
                Application.query(sql, [ job_id, search + '%', search + '%', job_id ], function(err, result) {
                    if (err) {
                        console.log(err);
                    }
                    let applicants = [];
                    applicants.num = result.length;
                    result.forEach(function(row) {
                        applicants.push({ applicant: row });
                    });
                    return resolve(applicants);
                });
            } else {
                criteria = { where: query, limit: rows, skip: start };
                return Promise.all([
                    Application.find(criteria).populate('applicant').sort('createdAt desc'),
                    Application.count(query)
                ]).then(result => {
                    let applicants = result[0];
                    applicants.num = result[1];
                    return resolve(applicants);
                }).catch(err => {
                    return reject(err);
                });
            }
        });
    },


    fetchShortlistedCandidates: function (job_id, coy_id) {
        return new Promise(function (resolve, reject) {
            // Companies can only view shortlist for their jobs
            Job.findOne({id: job_id, company: coy_id}).populate('company').then(function (job) {
                if (job) {
                    return Promise.all([
                        JobTest.findOne({ job_level: job.job_level, job_category_id: job.category}).populate('test'),
                        //SelectedCandidate.find({job_id: job_id}).populate('candidate')
                    ]).then(testAndCandidates => {
                        let test = testAndCandidates[0];
                        //let selected_candidates = testAndCandidates[1];

                        const sql = `SELECT score, fullname, u.id AS uid, gq.id AS test_id, gq.createdAt, u.email, sc.status FROM selectedcandidate sc 
                                    JOIN gqaptitudetestresult gq ON sc.candidate = gq.user 
                                    JOIN user u ON u.id = gq.user WHERE job_id = ? AND gq.status = 'Accepted' ORDER BY score DESC`;
            
                        GQAptitudeTestResult.query(sql, [ job_id ], function(err, candidates) {            
                            if (err) {
                                return res.serverError(err);
                            }
                            return CBTService.getJobTestResults(candidates, test).then(function (results) {
                                // add shortlisting status to the result
                                var _results = [];
                                results.forEach(function(result) {
                                    var status = candidates.find(x => x.uid == result.applicant.id).status;
                                    result.status = status;
                                    _results.push(result);
                                });
                                return resolve({
                                    results: _results,
                                    paid: job.paid,
                                    jobTitle: job.job_title,
                                    companyName: job.company.company_name
                                });
                            });
                        });
                    });
                } else {
                    return resolve({
                        results: []
                    });
                }
            }).catch(err => {
                console.error(err);
                reject(err);
            });
        });
    }
}
