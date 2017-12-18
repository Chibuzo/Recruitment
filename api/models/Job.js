    /**
     * Job.js
     *
     * @description :: TODO: You might write a short summary of how this model works and what it represents here.
     * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
     */
module.exports = {

    attributes: {
        job_title: {
            type: 'string'
        },

        job_description: {
            type: 'string'
        },

        job_requirements: {
            type: 'string'
        },

        job_level: {
            type: 'string'
        },

        contract_type: {
            type: 'string'
        },

        category: {
            model: 'jobcategory'
        },

        country: {
            type: 'string'
        },

        location: {
            type: 'string'
        },

        nice_to_have: {
            type: 'string'
        },

        num_of_hires: {
            type: 'integer'
        },

        applications: {
            collection: 'application',
            via: 'job'
        },

        view_count: {
            type: 'integer',
            defaultsTo: 0
        },

        //job_tests: {
        //    collection: 'jobtest',
        //    via: 'test'
        //},
        job_test: {
            model: 'cbttest'
        },

        gq_grade: {
            type: 'integer',
            defaultsTo: 50
        },

        jobtest_grade: {
            type: 'integer',
            defaultsTo: 50
        },

        published: {
            type: 'boolean',
            defaultsTo: false
        },

        date_published: {
            type: 'datetime'
        },

        closing_date: {
            type: 'date'
        },

        company: {
            model: 'company'
        },

        status: {
            type: 'string', // Active, Expired
            defaultsTo: 'Active'
        }
    }
};

