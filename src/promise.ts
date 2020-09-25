import { Promise as BasePromise } from 'bluebird';
import _ from 'the-lodash';
import { Executor } from './executor';


interface PromiseLike<T> {
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): PromiseLike<TResult1 | TResult2>;
}

interface IPromise<T> {
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): IPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): IPromise<T | TResult>;
}


export type Resolvable<R> = R | Promise<R>;
export type MapperFunction<T, R> = (item: T) => Resolvable<R>;

export interface ExecuteOptions {
    concurrency?: number;
    retryCount?: number;
    coolDownOnFailure?: boolean;
    initRetryDelay?: number;
    maxRetryDelay?: number;
    retryDelayCoeff?: number;
    waitCompleteBeforeExit?: boolean;
}

export class CExecuteOptions {
    concurrency = 100;
    retryCount = 0;
    coolDownOnFailure = false;
    initRetryDelay = 500;
    maxRetryDelay = 5000;
    retryDelayCoeff = 2.0;
    waitCompleteBeforeExit = false;
}

export class Promise<T> extends BasePromise<T> {

    /*
     * Processes items in parallel
     */
    static execute<T, R>(items: T[] | null, action: MapperFunction<T, R>, options?: ExecuteOptions): Promise<R[]> {
        if (items == null || !items) {
            return Promise.resolve([]);
        }
        const myOptions = new CExecuteOptions();
        if (options) {
            if (!_.isNullOrUndefined(options.retryCount)) {
                myOptions.retryCount = options.retryCount!;
            }
            if (!_.isNullOrUndefined(options.concurrency)) {
                myOptions.concurrency = options.concurrency!;
            }
            if (!_.isNullOrUndefined(options.coolDownOnFailure)) {
                myOptions.coolDownOnFailure = options.coolDownOnFailure!;
            }
            if (!_.isNullOrUndefined(options.initRetryDelay)) {
                myOptions.initRetryDelay = options.initRetryDelay!;
            }
            if (!_.isNullOrUndefined(options.maxRetryDelay)) {
                myOptions.maxRetryDelay = options.maxRetryDelay!;
            }
            if (!_.isNullOrUndefined(options.retryDelayCoeff)) {
                myOptions.retryDelayCoeff = options.retryDelayCoeff!;
            }
            if (!_.isNullOrUndefined(options.waitCompleteBeforeExit)) {
                myOptions.waitCompleteBeforeExit = options.waitCompleteBeforeExit!;
            }
        }
        const executor = new Executor<T, R>(items, action, myOptions);
        return executor.execute();
    }

    /*
     * Processes items in parallel
     */
    static parallel<T, R>(items: T[] | null, action: MapperFunction<T, R>): Promise<R[]> {
        if (!items) {
            return Promise.resolve([]);
        }
        return Promise.map(items, action);
    }

    /*
     * Processes items in sequence
     */
    static serial<T, R>(items: T[] | null, action: MapperFunction<T, R>): Promise<R[]> {
        if (!items) {
            return Promise.resolve([]);
        }
        const results: R[] = [];
        return Promise.each(items, (x) => {
            return Promise.resolve(action(x)).then((result) => {
                results.push(result);
            });
        }).then(() => results);
    }

    /*
     * Simple retry logic
     */
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

    private static _promiseRetryLoop<T>(
        action: () => Resolvable<T>,
        count: number,
        timeoutMs: number,
        canContinueCb?: (reason: any) => boolean,
    ): Promise<T> {
        return Promise.try(action).catch((reason) => {
            return Promise._promiseRetryHandleFailure(reason, action, count, timeoutMs, canContinueCb);
        });
    }

    private static _promiseRetryHandleFailure<T>(
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

    /*
     * Returns a promise which resolves in specified time delay
     */
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

    /*
     * Creates a new Promise
     */
    static construct<T>(callback: (resolve: (thenableOrResult?: Resolvable<T>) => void, reject: (error?: any) => void) => void) : Promise<T> {
        return new BasePromise<T>(callback)
            .then((res: T) => Promise.resolve(res));
    }

    /*
     * Convert
     */
    static convert<T>(another: IPromise<T>) : Promise<T> {
        return Promise.construct<T>((resolve, reject) => {
            another.then(result => resolve(result))
                .catch(reason => reject(reason));
        });
    }
}