var assert = require('assert');
var should = require('should');

var Promise = require('../index');

describe('parallel.js', function() {
    describe('Promise.parallel', function() {
        it('normal', function () {
            var processed = {};
            return Promise.parallel(["aa", "bb", "cc"], x => {
                processed[x] = true;
                return "X" + x;
            })
            .then(result => {
                should(processed).be.deepEqual({"aa": true, "bb": true, "cc": true})

                var resultAsMap = {};
                for(var x of result) {
                    resultAsMap[x] = true;
                }
                should(resultAsMap).be.deepEqual({"Xaa": true, "Xbb": true, "Xcc": true})
            });
        });

        it('null', function () {
            return Promise.parallel(null, x => {
                return "X" + x;
            })
            .then(result => {
                should(result).be.deepEqual([])
            });
        });
    });

});