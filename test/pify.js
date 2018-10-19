var assert = require('assert');
var should = require('should');

var Promise = require('../index');


function action(name, cb) {
    cb(null, name + " norris");
}

describe('pify.js', function() {
    describe('Promise.pify', function() {
     
        it('normal', function () {
            return Promise.pify(action)("chuck")
            .then(result => {
                should(result).be.exactly("chuck norris")
            })
        });

    });

});