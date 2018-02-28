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
                .then(function() {
                    // use workbook
                    var sheet = workbook.getWorksheet(1);
                    for (i = 14; i < 34; i++) {
                        var row = sheet.getRow(i);
                        var data = {
                            test: test_id,
                            question: row.getCell('B').value,
                            opt_a: row.getCell('C').value,
                            opt_b: row.getCell('D').value,
                            opt_c: row.getCell('E').value,
                            opt_d: row.getCell('F').value,
                            opt_e: row.getCell('G').value,
                            answer: row.getCell('H').value
                        };
                        GQTestQuestions.create(data).exec(function (err, quest) {});
                    }
                });
        });
    },

    addImageToQuestion: function(image, current_img_name) {
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
                        if (current_img_name) {
                            filename = current_img_name;
                        } else {
                            var ext = file.filename.split('.').pop();
                            filename = hr[1] + '.' + ext;
                        }
                        return cb(null, filename);
                    },
                    maxBytes: 100 * 1024 * 1024
                },
                function(err) {
                    if (err) return reject(err);
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
            GQTestResult.find({ candidate: candidate_id, test: [1,2,3] }).sort('id desc').limit(1).exec(function(err, tests) {
                if (tests.length > 0) {
                    if (tests[0].test < 3)
                        return resolve(tests[0].test + 1);
                    else // its 3 return 1
                        return resolve(1);
                } else {
                    return resolve(1);
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
                    result: percentage > 69 ? 'Passed' : 'Failed',
                    no_of_questions: no_of_questions
                };
                return resolve(result);
            });
        });
    }
}