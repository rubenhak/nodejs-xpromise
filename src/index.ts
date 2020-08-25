import { Promise as BasePromise } from 'bluebird';

type Resolvable<R> = R | Promise<R>;
type MapperFunction<T, R> = (item: T) => Resolvable<R>;

class Promise<T> extends BasePromise<T> {
    static parallel<T, R>(items: T[] | null, action: MapperFunction<T, R>): Promise<R[]> {
        if (!items) {
            return Promise.resolve([]);
        }
        return Promise.map(items, action);
    }

    static serial<T, R>(items: T[] | null, action: MapperFunction<T, R>): Promise<R[]> {
        if (!items) {
            return Promise.resolve([]);
        }
        let results: R[] = [];
        return Promise.each(items, (x) => {
            return Promise.resolve(action(x)).then((result) => {
                results.push(result);
            });
        }).then(() => results);
    }

    static retry<T>(
        action: () => Resolvable<T>,
        count?: number,
        timeoutMs?: number,
        canContinueCb?: (reason: any) => boolean,
    ): Promise<T> {
        if (!count) {
            count = 0;
        }
        if (!timeoutMs) {
            timeoutMs = 0;
        }
        return Promise._promiseRetryLoop(action, count, timeoutMs, canContinueCb);
    }

    static _promiseRetryLoop<T>(
        action: () => Resolvable<T>,
        count: number,
        timeoutMs: number,
        canContinueCb?: (reason: any) => boolean,
    ): Promise<T> {
        return Promise.try(action).catch((reason) => {
            return Promise._promiseRetryHandleFailure(reason, action, count, timeoutMs, canContinueCb);
        });
    }

    static _promiseRetryHandleFailure<T>(
        reason: any,
        action: () => Resolvable<T>,
        count: number,
        timeoutMs: number,
        canContinueCb?: (reason: any) => boolean,
    ): Promise<T> {
        if (count > 0) {
            if (canContinueCb) {
                if (!canContinueCb(reason)) {
                    throw reason;
                }
            }
            return Promise.timeout(timeoutMs).then(() =>
                Promise._promiseRetryLoop(action, count - 1, timeoutMs, canContinueCb),
            );
        }

        throw reason;
    }

    static timeout(timeoutMs: number): Promise<void> {
        if (!timeoutMs) {
            return Promise.resolve();
        }
        return new BasePromise<void>(function(fulfill, reject) {
            setTimeout(() => {
                fulfill();
            }, timeoutMs);
        })
        .then(() => Promise.resolve());
    }
}

export default Promise;
export { Promise };
