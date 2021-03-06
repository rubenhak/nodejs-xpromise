import 'mocha';
import should = require('should');

import { Promise } from '../src';

describe('Promise.serial', () => {
    it('normal', function () {
        const processed: Record<string, boolean> = {};
        return Promise.serial(['aa', 'bb', 'cc'], (x) => {
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

    it('null', function () {
        return Promise.serial(null, (x) => {
            return 'X' + x;
        }).then((result) => {
            should(result).be.deepEqual([]);
        });
    });
});
