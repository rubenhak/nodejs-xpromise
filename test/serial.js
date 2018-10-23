var assert = require('assert');
var should = require('should');

var Promise = require('../index');

describe('serial.js', function() {
    describe('Promise.serial', function() {
        it('normal', function () {
            var processed = {};
            return Promise.serial(["aa", "bb", "cc"], x => {
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
            return Promise.serial(null, x => {
                return "X" + x;
            })
            .then(result => {
                should(result).be.deepEqual([])
            });
        });
    });

});