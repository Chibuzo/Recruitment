var Excel = require('exceljs');

module.exports = {
    extractTestQuestionsFromExcel: function(file_input, test_id) {
        var filename, testexcel = 'assets/testexcel/';
        file_input.upload({
            dirname: require('path').resolve(sails.config.appPath, testexcel),
            saveAs: function(file, cb) {
                var ext = file.filename.split('.').pop();
                filename = 'test_' + test_id + '.' + ext;
                return cb(null, filename);
            }
        },
        function(err, uploadedFile) {
            var workbook = new Excel.Workbook();
            workbook.xlsx.readFile(testexcel + filename)
                .then(function(d) {
                    // use workbook
                    var sheet = workbook.getWorksheet(1);
                    for (i = 2; i < sheet.actualRowCount + 1; i++) {
                        var row = sheet.getRow(i);
                        //if (row.getCell('B').value.length < 5) continue;
                        var data = {
                            test: test_id,
                            question: row.getCell('A').value,
                            opt_a: row.getCell('B').value,
                            opt_b: row.getCell('C').value,
                            opt_c: row.getCell('D').value,
                            opt_d: row.getCell('E').value,
                            opt_e: row.getCell('F').value,
                            answer: row.getCell('G').value
                        };
                        GQTestQuestions.create(data).exec(function (err, quest) {});
                    }
                }).catch(function(err) {
                    console.log('Error!!!');
                    console.log(err);
                });
        });
    },

    addImageToQuestion: function(image) {
        return new Promise(function(resolve, reject) {
            if (image) {
                var filename, hr = process.hrtime();
                var allowedImgTypes = ['image/jpg', 'image/jpeg', 'image/png', 'image/gif'];
                image.upload({
                    dirname: require('path').resolve(sails.config.appPath, 'assets/cbt-images/'),
                    saveAs: function(file, cb) {
                        if (allowedImgTypes.indexOf(file.headers['content-type']) === -1) {
                            return cb('Unsupported picture format.');
                        }
                        var ext = file.filename.split('.').pop();
                        filename = hr[1] + '.' + ext;
                        
                        return cb(null, filename);
                    },
                    maxBytes: 100 * 1024 * 1024
                },
                function(err, ufile) {
                    if (err) return reject(err);

                    if (!ufile || filename === undefined || filename.lenght < 1) {
                        return reject('No file was uploaded');
                    }
                    try {
                        const fs = require('fs');
                        const temp_pic = require('path').resolve(sails.config.appPath, '.tmp/public/cbt-images') + '/' + filename;
                        fs.createReadStream(require('path').resolve(sails.config.appPath, 'assets/cbt-images') + '/' + filename).pipe(fs.createWriteStream(temp_pic));
                    } catch(err) {
                        console.log(err)
                    }
                    return resolve(filename);
                });
            } else {
                return reject('This is not supposed to happen');
            }
        });
    },

    // for GQ aptitude test
    // if a candidate has taken part of the test, continue from where the candidate stopped
    determineTestId: function(candidate_id) {
        return new Promise(function(resolve, reject) {
            // look for test result
            var tests_taken = []
            GQTestResult.find({ candidate: candidate_id, test: [1,2,3] }).exec(function(err, tests) {
                var _tests = [];
                if (tests.length == 0) {
                    return resolve(1);
                } else {
                    tests.forEach(function(test) {
                        _tests.push(test.test);
                    });
                    var next = _.difference([1,2,3], _tests);
                    next.sort(function(a, b) { return a - b; });
                    return resolve(next[0]);
                }
            });
        });
    },

    prepareCandidateResult: function(test_id, candidate_score, no_of_questions) {
        return new Promise(function(resolve, reject) {
            GQTestResult.find({test: test_id}).groupBy('test').average('score').exec(function(err, test_ave) {
                if (err) return reject(err);
                if (test_ave.length < 1) reject('No Result');
                var percentage = ((parseInt(candidate_score) / parseInt(no_of_questions)) * 100).toFixed(1);
                var result = {
                    score: candidate_score, // really don't need this
                    percentage: percentage,
                    average: test_ave[0].score,
                    result: percentage > 60 ? 'Passed' : 'Failed',
                    no_of_questions: no_of_questions
                };
                return resolve(result);
            });
        });
    },

    fetchAllCandidatesAptitudeTestResult: function(_candidates = undefined, start = undefined, rows = undefined, mode = 'all', order_field = null, order_direction = null) {
        return new Promise(function(resolve, reject) {
            const candidates = [];
            let skip = start === undefined ? 1 : start;
            let limit = rows === undefined ? -1 : rows;
            let query = _candidates === undefined ? {}: {user: _candidates};
            let criteria;
            let paginate = false;
            if (start === undefined || rows === undefined) {
                criteria = query;
            } else {
                paginate = true;
                criteria = { where: query, limit: limit, skip: skip };
            }
            let sort = 'createdAt desc';
            if (mode == 'job') {
                sort = 'score desc';
            }
            if (order_field == 11) {
                sort = 'score ' + order_direction;
            }
            return Promise.all([
                GQAptitudeTestResult.find(criteria).populate('user').sort(sort), //.exec(function(err, apt_results) {
                GQAptitudeTestResult.find(query).sort('score desc')
            ]).then(results => {
                var apt_results = results[0];
                var count = results[1].length;
                var all_scores = results[1];

                var apt_scores = all_scores.map(function(e) { return e.score; });
                apt_scores = Array.from(new Set(apt_scores)); // remove duplicate scores; important for ranking
                async.eachSeries(apt_results, function(apt_result, cb) {
                    if (!apt_result.user) return cb();
                    GQTestResult.find({ test: [1,2,3], candidate: apt_result.user.id }).populate('proctor').sort('test').exec(function(err, tests) {
                        if (err) {
                            return reject(err);
                        }
                        if (tests.length < 3) return cb();
                    
                        let integrityScoreCumalative = _(tests).map(function(test) {
                            return test.proctor ? test.proctor.integrity_score : false;
                        })
                        .filter(function(integrityScore) {
                            return integrityScore !== false;
                        });
                        let integrityScore = integrityScoreCumalative.sum() / integrityScoreCumalative.value().length;
                        integrityScore = integrityScore.toFixed(1);

                        // Group together test information for each test
                        let generalAbilityTest = {
                            score: tests[0] ? ((tests[0].score / tests[0].no_of_questions) * 100).toFixed(1) : -1,
                            proctorScore: _.get(tests, '[0].proctor.integrity_score', -1),
                            proctorId: _.get(tests, '[0].proctor.id', -1)
                        };

                        let verbalTest = {
                            score: tests[1] ? ((tests[1].score / tests[1].no_of_questions) * 100).toFixed(1) : -1,
                            proctorScore: _.get(tests, '[1].proctor.integrity_score', -1),
                            proctorId: _.get(tests, '[1].proctor.id', -1)
                        };

                        let mathsTest = {
                            score: tests[2] ? ((tests[2].score / tests[2].no_of_questions) * 100).toFixed(1) : -1,
                            proctorScore: _.get(tests, '[2].proctor.integrity_score', -1),
                            proctorId: _.get(tests, '[2].proctor.id', -1)
                        };
                        var total_num_questions = parseInt(tests[0].no_of_questions) + parseInt(tests[1].no_of_questions) + parseInt(tests[2].no_of_questions);
                        try {
                            candidates.push({
                                id: apt_result.user.id,
                                fullname: apt_result.user.fullname,
                                email: apt_result.user.email,
                                generalAbilityTest: generalAbilityTest,
                                verbalTest: verbalTest,
                                mathsTest: mathsTest,
                                test_date: apt_result.createdAt,
                                percentage: ((apt_result.score / total_num_questions) * 100).toFixed(1),
                                rank: apt_scores.indexOf(apt_result.score) + 1,
                                integrity_score: integrityScore,
                                status: apt_result.status
                            });
                            cb();
                        } catch (err) {
                            console.log(err);
                        }
                    });
                }, function(err) {
                    if (err) return reject(err);
                    candidates.num = count; // also return number of candidates that has taken the test
                    return resolve(candidates);
                });
            })
            .catch(err => {
                return reject(err);
            });
        });
    }
}
