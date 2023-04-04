import 'mocha';
import should from 'should';

import { MyPromise } from '../src';

describe('Promise.timeout', () => {
    it('normal', () => {
        return MyPromise.timeout(100).then(() => null);
    });
    it('delay', () => {
        return MyPromise.delay(100).then(() => null);
    });
});
