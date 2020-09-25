import 'mocha';
import should = require('should');
import _ from 'the-lodash';

import { Promise } from '../src';

describe('Promise.execute', () => {
    it('case-small', () => {
        const processed: Record<string, boolean> = {};
        return Promise.execute(['aa', 'bb', 'cc'], (x) => {
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

    it('case-big-all-pass', () => {
        const processed: Record<number, boolean> = {};

        interface Item {
            id: number;
        }

        const items: Item[] = [];
        const expectedResult: Record<string, boolean> = {};
        for (let i = 0; i < 100; i++) {
            items.push({
                id: i,
            });
            const key = 'X' + i;
            expectedResult[key] = true;
        }

        return Promise.execute(items, (x) => {
            processed[x.id] = true;
            return 'X' + x.id;
        }).then((result) => {
            const expectedProcessedMap = _.makeDict(
                items,
                (x) => x.id,
                (x) => true,
            );
            should(processed).be.eql(expectedProcessedMap);

            const resultAsMap = _.makeDict(
                result,
                (x) => x,
                (x) => true,
            );
            should(resultAsMap).be.eql(expectedResult);
        });
    });

    it('case-big-some-fail-no-retry', () => {
        const processed: Record<number, boolean> = {};

        interface Item {
            id: number;
            canFail: boolean;
        }

        const items: Item[] = [];
        const expectedResult: Record<string, boolean> = {};
        for (let i = 0; i < 500; i++) {
            items.push({
                id: i,
                canFail: i % 5 == 0,
            });
            const key = 'X' + i;
            expectedResult[key] = true;
        }

        let thereWasError = false;

        return Promise.execute(items, (x) => {
            if (x.canFail) {
                x.canFail = false;
                throw new Error('I can fail once');
            }
            processed[x.id] = true;
            return 'X' + x.id;
        })
            .catch((reason) => {
                thereWasError = true;
            })
            .then(() => {
                should(thereWasError).be.true();
            });
    });

    it('case-small-fail-fast', () => {
        const processed: Record<number, boolean> = {};

        interface Item {
            id: number;
            canFail: boolean;
            message?: string;
        }

        const items: Item[] = [
            { id: 1, canFail: true, message: 'Error 1' },
            { id: 2, canFail: false },
            { id: 3, canFail: true, message: 'Error 3' },
        ];

        let thereWasError = false;

        return Promise.execute(items, (x) => {
            return Promise.resolve().then(() => {
                if (x.canFail) {
                    throw new Error(x.message!);
                }
                return `Processed: ${x.id}`;
            });
        })
            .catch((reason) => {
                thereWasError = true;
                should(reason).be.an.Array();
                should(reason.length).be.equal(1);
            })
            .then((result) => {
                should(thereWasError).be.true();
            });
    });

    it('case-small-fail-and-wait', () => {
        const processed: Record<number, boolean> = {};

        interface Item {
            id: number;
            canFail: boolean;
            message?: string;
        }

        const items: Item[] = [
            { id: 1, canFail: true, message: 'Error 1' },
            { id: 2, canFail: false },
            { id: 3, canFail: true, message: 'Error 3' },
        ];

        let thereWasError = false;

        return Promise.execute(
            items,
            (x) => {
                return Promise.resolve().then(() => {
                    if (x.canFail) {
                        throw new Error(x.message!);
                    }
                    return `Processed: ${x.id}`;
                });
            },
            {
                waitCompleteBeforeExit: true,
            },
        )
            .catch((reason) => {
                thereWasError = true;
                should(reason).be.an.Array();
                should(reason.length).be.equal(2);
            })
            .then((result) => {
                should(thereWasError).be.true();
            });
    });

    it('case-big-some-fail-allow-retry', () => {
        const processed: Record<number, boolean> = {};

        interface Item {
            id: number;
            canFail: boolean;
        }

        const items: Item[] = [];
        const expectedResult: Record<string, boolean> = {};
        for (let i = 0; i < 500; i++) {
            items.push({
                id: i,
                canFail: i % 5 == 0,
            });
            const key = 'X' + i;
            expectedResult[key] = true;
        }

        return Promise.execute(
            items,
            (x) => {
                if (x.canFail) {
                    x.canFail = false;
                    throw new Error('I can fail once');
                }
                processed[x.id] = true;
                return 'X' + x.id;
            },
            { retryCount: 1 },
        ).then((result) => {
            const expectedProcessedMap = _.makeDict(
                items,
                (x) => x.id,
                (x) => true,
            );
            should(processed).be.eql(expectedProcessedMap);

            const resultAsMap = _.makeDict(
                result,
                (x) => x,
                (x) => true,
            );
            should(resultAsMap).be.eql(expectedResult);
        });
    });

    it('case-big-some-fail-several-times', () => {
        const processed: Record<number, boolean> = {};

        interface Item {
            id: number;
            failCount: number;
        }

        const items: Item[] = [];
        const expectedResult: Record<string, boolean> = {};
        for (let i = 0; i < 500; i++) {
            items.push({
                id: i,
                failCount: i % 20 == 0 ? 3 : 0,
            });
            const key = 'X' + i;
            expectedResult[key] = true;
        }

        return Promise.execute(
            items,
            (x) => {
                if (x.failCount) {
                    x.failCount--;
                    throw new Error('I can fail');
                }
                processed[x.id] = true;
                return 'X' + x.id;
            },
            { retryCount: 3 },
        ).then((result) => {
            const expectedProcessedMap = _.makeDict(
                items,
                (x) => x.id,
                (x) => true,
            );
            should(processed).be.eql(expectedProcessedMap);

            const resultAsMap = _.makeDict(
                result,
                (x) => x,
                (x) => true,
            );
            should(resultAsMap).be.eql(expectedResult);
        });
    }).timeout(10000);

    it('case-big-some-fail-too-many-times', () => {
        const processed: Record<number, boolean> = {};

        interface Item {
            id: number;
            failCount: number;
        }

        const items: Item[] = [];
        const expectedResult: Record<string, boolean> = {};
        for (let i = 0; i < 500; i++) {
            items.push({
                id: i,
                failCount: i % 250 == 0 ? 4 : 0,
            });
            const key = 'X' + i;
            expectedResult[key] = true;
        }

        let thereWasError = false;

        return Promise.execute(
            items,
            (x) => {
                if (x.failCount) {
                    x.failCount--;
                    throw new Error('I can fail');
                }
                processed[x.id] = true;
                return 'X' + x.id;
            },
            { retryCount: 3 },
        )
            .catch((reason) => {
                thereWasError = true;
            })
            .then(() => {
                should(thereWasError).be.true();
            });
    }).timeout(10000);

    it('case-big-some-fail-several-times', () => {
        const processed: Record<number, boolean> = {};

        interface Item {
            id: number;
            failCount: number;
        }

        const items: Item[] = [];
        const expectedResult: Record<string, boolean> = {};
        for (let i = 0; i < 500; i++) {
            items.push({
                id: i,
                failCount: i % 20 == 0 ? 3 : 0,
            });
            const key = 'X' + i;
            expectedResult[key] = true;
        }

        return Promise.execute(
            items,
            (x) => {
                if (x.failCount) {
                    x.failCount--;
                    throw new Error('I can fail');
                }
                processed[x.id] = true;
                return 'X' + x.id;
            },
            { retryCount: 3, coolDownOnFailure: true },
        ).then((result) => {
            const expectedProcessedMap = _.makeDict(
                items,
                (x) => x.id,
                (x) => true,
            );
            should(processed).be.eql(expectedProcessedMap);

            const resultAsMap = _.makeDict(
                result,
                (x) => x,
                (x) => true,
            );
            should(resultAsMap).be.eql(expectedResult);
        });
    }).timeout(10000);

    it('case-big-failures-short-delay', () => {
        const processed: Record<number, boolean> = {};

        interface Item {
            id: number;
            failCount: number;
        }

        const items: Item[] = [];
        const expectedResult: Record<string, boolean> = {};
        for (let i = 0; i < 500; i++) {
            items.push({
                id: i,
                failCount: i % 9 == 0 ? i % 5 : 0,
            });
            const key = 'X' + i;
            expectedResult[key] = true;
        }

        return Promise.execute(
            items,
            (x) => {
                if (x.failCount) {
                    x.failCount--;
                    throw new Error('I can fail');
                }
                processed[x.id] = true;
                return 'X' + x.id;
            },
            {
                retryCount: 5,
                coolDownOnFailure: true,
                initRetryDelay: 10,
                maxRetryDelay: 50,
                retryDelayCoeff: 2,
            },
        ).then((result) => {
            const expectedProcessedMap = _.makeDict(
                items,
                (x) => x.id,
                (x) => true,
            );
            should(processed).be.eql(expectedProcessedMap);

            const resultAsMap = _.makeDict(
                result,
                (x) => x,
                (x) => true,
            );
            should(resultAsMap).be.eql(expectedResult);
        });
    });

    it('case-performance', () => {
        const processed: Record<number, boolean> = {};

        interface Item {
            id: number;
        }

        const items: Item[] = [];
        const expectedResult: Record<string, boolean> = {};
        for (let i = 0; i < 10 * 1000; i++) {
            items.push({
                id: i,
            });
            const key = 'X' + i;
            expectedResult[key] = true;
        }

        return Promise.execute(
            items,
            (x) => {
                processed[x.id] = true;
                return 'X' + x.id;
            },
            {},
        ).then((result) => {
            const expectedProcessedMap = _.makeDict(
                items,
                (x) => x.id,
                (x) => true,
            );
            should(processed).be.eql(expectedProcessedMap);

            const resultAsMap = _.makeDict(
                result,
                (x) => x,
                (x) => true,
            );
            should(resultAsMap).be.eql(expectedResult);
        });
    }).timeout(10 * 1000);
});
