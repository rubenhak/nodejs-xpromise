import 'mocha';
import should = require('should');

import { Promise } from '../src';

describe('Promise.parallel', () => {
    it('normal', () => {
        const processed: Record<string, boolean> = {};
        return Promise.parallel(['aa', 'bb', 'cc'], (x) => {
            processed[x] = true;
            return 'X' + x;
        }).then((result) => {
            should(processed).be.deepEqual({ aa: true, bb: true, cc: true });

            const resultAsMap: Record<string, boolean> = {};
            for (const x of result) {
                resultAsMap[x] = true;
            }
            should(resultAsMap).be.deepEqual({ Xaa: true, Xbb: true, Xcc: true });
        });
    });

    it('null', () => {
        return Promise.parallel(null, (x) => {
            return 'X' + x;
        }).then((result) => {
            should(result).be.deepEqual([]);
        });
    });
});
