/**
 * Application.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

    attributes: {
        job: {
            model: 'job'
        },

        company: {
            model: 'company'
        },

        applicant: {
            model: 'user'
        },

        status: {
            type: 'string',
            defaultsTo: 'Take test' // Under Review, Cancelled (when job is deleted)
        }
    }
};

