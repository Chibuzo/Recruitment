/**
 * JobTest.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

  attributes: {
      test: {
          model: 'cbttest'
      },

      gq_test: {
          model: 'gqtest'
      },

      test_source: {
          type: 'string' // gq or expertrating
      },

      test_title: {
          type: 'string'
      },

      job_level: {
          type: 'string'
      },

      job_category: {
          type: 'string'
      },

      job_category_id: {
          type: 'integer'
      }
  }
};

