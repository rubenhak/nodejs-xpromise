var assert = require('assert');
var should = require('should');

var Promise = require('../index');

describe('timeout.js', function() {
    describe('Promise.timeout', function() {
     
        it('normal', function () {
            return Promise.timeout(100)
            .then(() => {

            })
        });

    });

});