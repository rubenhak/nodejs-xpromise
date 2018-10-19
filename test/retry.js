var assert = require('assert');
var should = require('should');

var Promise = require('../index');

describe('retry.js', function() {
    describe('Promise.retry', function() {
     
        it('noError', function () {
            var counter = 0;
            return Promise.retry(() => {
                counter += 1;
            })
            .then(() => {
                should(counter).be.exactly(1);
            })
        });

        it('oneTimeError', function () {
            var counter = 0;
            return Promise.retry(() => {
                counter += 1;
                if (counter == 1) {
                    throw new Error("Error Number " + counter);
                }
            }, 3, 100)
            .then(() => {
                should(counter).be.exactly(2);
            })
        });

        it('keepsFailing', function () {
            var counter = 0;
            var isThenCalled = false;
            var isCatchCalled = false;
            return Promise.retry(() => {
                counter += 1;
                throw new Error("Error Number " + counter);
            }, 3, 100)
            .then(() => {
                isThenCalled = true;
            })
            .catch(reason => {
                isCatchCalled = true;
            })
            .then(() => {
                should(isThenCalled).be.exactly(false);
                should(isCatchCalled).be.exactly(true);
                should(counter).be.exactly(4);
            })
        });

    });

});