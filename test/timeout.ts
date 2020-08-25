import 'mocha';
import should = require('should');

import Promise from '../src';

describe('Promise.timeout', () => {
    it('normal', () => {
        return Promise.timeout(100).then(() => {});
    });
});
