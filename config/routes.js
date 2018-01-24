
module.exports.routes = {

    '/': {
        view: 'index'
    },

    '/candidates': 'ApplicantController.showLanding',

    '/signup': { view: 'signup' },

    '/login': { view: 'login' },

    '/login/:return_url': 'UserController.specialLoginPage',

    '/admin': { view: 'admin/login' },

    'GET /user/activate/:email/:hash': 'UserController.activateAccount',

    'POST /user/login': 'UserController.signin',

    'POST /user/signup': 'UserController.signup',

    'POST /user/update': 'UserController.updateProfile',

    'GET /applicant/profile': 'UserController.profile',

    'GET /signout': 'UserController.signout',

    'GET /applicant/resume-page': 'ResumeController.editView',

    'POST /resume/update': 'ResumeController.save',

    'GET /applicant/dashboard': 'ApplicantController.dashboard',

    'GET /applicant/view-applications': 'ApplicationController.viewApplications',

    'GET /applicant/video': 'ApplicantController.videoPage',

    'POST /applicant/add-video': 'ApplicantController.uploadVideo',

    'POST /applicant/add-passport': 'ApplicantController.uploadPassport',

    'GET /applicant/resume/:resume_id': 'ResumeController.viewResume',

    'GET /applicant/resume-user/:user_id': 'ResumeController.viewResumeByUser',

    'POST /applicant/select-candidate': 'SelectedCandidateController.selectCandidate',

    'POST /applicant/unselect-candidate': 'SelectedCandidateController.unSelectCandidate',

    'GET /admin/setup': 'AdminController.setup',

    'GET /admin/create': { view: 'admin/create' },

    'POST /admin/create': 'AdminController.addAdmin',

    'POST /admin/login': 'AdminController.login',

    'GET /admin/signout': 'AdminController.signout',

    'GET /admin/dashboard': 'AdminController.dashboard',

    'GET /admin/manage-test': 'JobTestController.manageJobTests',

    'GET /admin/manage-courses': 'CourseController.getCourses',

    'GET /admin/applicants': 'ApplicantController.fetchApplicants',

    'GET /admin/gq-test': 'GQTestController.manageTest',

    'GET /admin/view-companies': 'CompanyController.viewCompanies',

    'GET /admin/coy-jobs/:coy_id': 'CompanyController.viewCompanyJobs',

    'GET /gqtest/createnew': 'GQTestController.createTestPage',

    'POST /gqtest/savetest': 'GQTestController.saveTest',

    'POST /gqtest/savequestion': 'GQTestController.saveQuestion',

    'GET /gqtest/edittest/:test_id': 'GQTestController.editTest',

    'GET /gqtest/getquestion/:question_id': 'GQTestController.getQuestion',

    'GET /gqtest/load-test-instruction/:test_id': 'GQTestController.loadTestInstruction',

    //'GET /gqtest/load-default': 'GQTestController.loadGQDefaultTest',
    'GET /gqtest/load-test/:test_id': 'GQTestController.loadTest',

    'POST /gqtest/return-answer': 'GQTestController.returnAnswer',

    'GET /gqtest/marktest/:test_id/:no_of_questions': 'GQTestController.markTest',

    'GET /gqtest/viewresults/:test_id': 'GQTestController.viewResults',

    'GET /gqtest/remove': 'GQTestController.deleteTest',

    'GET /gqtest/gettest/:test_id': 'GQTestController.getTest',

    'GET /courses': 'CourseController.listCourses',

    'GET /course/addnew': 'CourseController.addNew',

    'POST /course/save': 'CourseController.saveCourse',

    'POST /course/subscribe': 'CourseController.subscribe',

    'GET /courses/list': 'CourseController.getCourses',

    'POST /sector/addsector': 'SectorController.addSector',

    'POST /company-request/send-request': 'CompanyRequestController.submitRequest',

    'GET /company-request/view-requests': 'CompanyRequestController.viewPendingRequests',

    'POST /company-request/approve': 'CompanyRequestController.approve',

    'POST /company/update-details': 'CompanyController.updateDetails',

    'GET /company/dashboard': 'CompanyController.dashboard',

    'GET /company/profile': 'CompanyController.profile',

    'POST /company/upload-csv': 'JobController.readApplicationCSV',

    'GET /company/users': 'CompanyController.getUsers',

    'POST /company/adduser': 'CompanyController.addUser',

    'GET /company/activate-user/:hash/:email': 'CompanyController.activateUser',

    'GET /company/user-profile': 'CompanyController.userProfile',

    'POST /company/update-user': 'CompanyController.updateUser',

    'POST /company/remove-user': 'CompanyController.removeUser',

    'GET /coy/setup/:hash/:email': 'CompanyController.initialSetup',

    'GET /job/manage': 'JobController.viewJobs',

    'GET /job/addjob': 'JobController.newJobForm',

    'POST /job/save': 'JobController.saveJob',

    'GET /job/editjob/:job_id': 'JobController.editJob',

    'GET /job/remove': 'JobController.deleteJob',

    'GET /jobs': 'JobController.listJobs',

    'GET /job/apply/:id': 'JobController.apply',

    'GET /job/view-candidate-results/:job_id': 'JobCandidateController.getJobCandidates',

    'POST /job/add-test': 'JobTestController.assignTest',

    'POST /jobtest/remove-job': 'JobTestController.removeTest',

    'POST /job/set-test-rating': 'JobTestController.setJobTestRating',

    'GET /job/view-applicants/:job_id': 'JobController.viewApplicants',

    'GET /job/candidates/:job_id': 'JobController.getApplicantsResults',

    'GET /job/:id/:title': 'JobController.showJob',

    'GET /jobcategory/:id/*': 'JobController.findJobsByCategory',

    'GET /getJobTest/:category/:job_level': 'JobTestController.getJobTest',

    'POST /jobcategory/addcategory': 'JobCategoryController.addCategory',

    'GET /test': 'TestController.testApi',

    'GET /gettest/:test_id/:job_id': 'TestController.getLandingPage',

    'POST /test/result': 'TestController.receiveAndSaveResult',

    'GET /test/show-result/:test_id': 'CBTTestController.showCandidateResult',

    'GET /result/getVideo': 'ResumeController.getVideo',

    'GET /assessments': 'CBTTestController.getTestResult',

    'GET /get-schools': 'SchoolsController.getSchools',

    //'GET /loadschools': 'BatchController.loadSchools',

    //'GET /savetest': 'TestController.saveTest',

    //'GET /countries': 'BatchController.countries',

    //'/states': 'BatchController.loadStates'
};
