import 'mocha';
import should = require('should');

import { Promise } from '../src';

describe('Promise.retry', function () {
    it('noError', function () {
        let counter = 0;
        return Promise.retry(() => {
            counter += 1;
        }).then(() => {
            should(counter).be.exactly(1);
        });
    });

    it('oneTimeError', function () {
        let counter = 0;
        return Promise.retry(
            () => {
                counter += 1;
                if (counter == 1) {
                    throw new Error('Error Number ' + counter);
                }
            },
            {
                retryCount: 3,
                initRetryDelay: 100,
            },
        ).then(() => {
            should(counter).be.exactly(2);
        });
    });

    it('twoTimesError', function () {
        let counter = 0;
        return Promise.retry(
            () => {
                counter += 1;
                if (counter <= 2) {
                    throw new Error('Error Number ' + counter);
                }
            },
            {
                retryCount: 3,
                initRetryDelay: 100,
            },
        ).then(() => {
            should(counter).be.exactly(3);
        });
    });

    it('keepsFailing', function () {
        let counter = 0;
        let isThenCalled = false;
        let isCatchCalled = false;
        return Promise.retry(
            () => {
                counter += 1;
                throw new Error('Error Number ' + counter);
            },
            {
                retryCount: 3,
                initRetryDelay: 100,
            },
        )
            .then(() => {
                isThenCalled = true;
            })
            .catch((reason) => {
                isCatchCalled = true;
            })
            .then(() => {
                should(isThenCalled).be.exactly(false);
                should(isCatchCalled).be.exactly(true);
                should(counter).be.exactly(4);
            });
    });

    it('canContinue', function () {
        let counter = 0;
        let isThenCalled = false;
        let isCatchCalled = false;
        return Promise.retry(
            () => {
                counter += 1;
                throw new Error('Error Number ' + counter);
            },
            {
                retryCount: 3,
                initRetryDelay: 100,
                canContinueCb: () => false,
            },
        )
            .then(() => {
                isThenCalled = true;
            })
            .catch((reason) => {
                isCatchCalled = true;
            })
            .then(() => {
                should(isThenCalled).be.exactly(false);
                should(isCatchCalled).be.exactly(true);
                should(counter).be.exactly(1);
            });
    });

    it('successWithCanContinuePromise', function () {
        let counter = 0;
        return Promise.retry(
            () => {
                counter += 1;
                if (counter <= 2) {
                    throw new Error('Error Number ' + counter);
                }
            },
            {
                retryCount: 3,
                initRetryDelay: 100,
                canContinueCb: () => {
                    return Promise.timeout(100).then(() => true);
                },
            },
        ).then(() => {
            should(counter).be.exactly(3);
        });
    });
});
