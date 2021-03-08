import 'mocha';
import should = require('should');

import { BlockingResolver } from '../src';

describe('blocking-resolver', function () {
    
    it('case-01', function () {

        const resolver = new BlockingResolver(() => {
            return 'abc'
        });

        return resolver.resolve()
            .then(result => {
                should(result).be.equal('abc');
            })

    });

    it('case-02', function () {

        let counter = 1;

        const resolver = new BlockingResolver(() => {
            counter++;
            return counter;
        });

        return Promise.resolve()
            .then(() => resolver.resolve())
            .then(result => {
                should(result).be.equal(2);
            })
            .then(() => resolver.resolve())
            .then(result => {
                should(result).be.equal(2);
            })
            .then(() => resolver.reset())
            .then(() => resolver.resolve())
            .then(result => {
                should(result).be.equal(3);
            })

    });

    it('case-03', function () {

        let counter = 1;

        const resolver = new BlockingResolver(() => {
            counter++;
            return counter;
        });

        return Promise.resolve()
            .then(() => Promise.all([resolver.resolve(), resolver.resolve()]))
            .then(results => {
                should(results[0]).be.equal(2);
                should(results[1]).be.equal(2);
            })

    });

});
