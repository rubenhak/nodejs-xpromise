var assert = require('assert');
var should = require('should');

var Promise = require('../index');


function action(name, cb) {
    cb(null, name + " norris");
}

class Processor
{
    constructor(suffix)
    {
        this._suffix = suffix;
    }

    action(name, cb)
    {
        cb(null, name + " norris");
    }
}

describe('pify.js', function() {
    describe('Promise.pify', function() {
     
        it('normal-func', function () {
            return Promise.promisify(action)("chuck")
            .then(result => {
                should(result).be.exactly("chuck norris")
            })
        });

        it('class-func-bind', function () {
            var processor = new Processor("norris");
            return Promise.promisify(processor.action.bind(processor))("chuck")
            .then(result => {
                should(result).be.exactly("chuck norris")
            })
        });

        it('class-func-ctx', function () {
            var processor = new Processor("norris");
            return Promise.promisify(processor.action, processor)("chuck")
            .then(result => {
                should(result).be.exactly("chuck norris")
            })
        });

    });

});