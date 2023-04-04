import 'mocha';
import should from 'should';

import { MyPromise } from '../src';

describe('Promise.serial', () => {

    it('Promise.serialnormal', function () {
        const processed: Record<string, boolean> = {};
        return MyPromise.serial(['aa', 'bb', 'cc'], (x) => {
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
        return MyPromise.serial(null, (x) => {
            return 'X' + x;
        }).then((result) => {
            should(result).be.deepEqual([]);
        });
    });

});
