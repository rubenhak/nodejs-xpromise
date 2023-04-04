import _ from 'the-lodash';
import { Executor } from './executor';

export type Resolvable<T> = T | PromiseLike<T>;

export type MapperFunction<T, R> = (item: T) => R | Promise<R>;

export interface ExecuteOptions {
    concurrency?: number;
    unlimitedRetries?: boolean;
    retryCount?: number;
    coolDownOnFailure?: boolean;
    initRetryDelay?: number;
    maxRetryDelay?: number;
    retryDelayCoeff?: number;
    waitCompleteBeforeExit?: boolean;
}

export class CExecuteOptions {
    concurrency: number = 100;
    unlimitedRetries: boolean = false;
    retryCount: number = 0;
    coolDownOnFailure: boolean = false;
    initRetryDelay: number = 500;
    maxRetryDelay: number = 5000;
    retryDelayCoeff: number = 2.0;
    waitCompleteBeforeExit: boolean = false;
}

export interface RetryOptions {
    unlimitedRetries?: boolean;
    retryCount?: number;
    initRetryDelay?: number;
    maxRetryDelay?: number;
    retryDelayCoeff?: number;
    canContinueCb?: (reason: any) => boolean | Promise<boolean>;
}

export class CRetryOptions {
    unlimitedRetries: boolean = false;
    retryCount: number = 0;
    initRetryDelay: number = 0;
    maxRetryDelay: number = 0;
    retryDelayCoeff: number = 0;
    canContinueCb?: (reason: any) => boolean | Promise<boolean>;

    retryTimeout: number = 0;
    failureCount: number = 0;
}

export class MyPromise
{
    /*
     * Processes items in parallel
     */
    static execute<T, R>(items: T[] | null, action: MapperFunction<T, R>, options?: ExecuteOptions): Promise<R[]> {
        if (items == null || !items) {
            return Promise.resolve([]);
        }
        
        options = options || {};

        const myOptions = new CExecuteOptions();

        myOptions.concurrency = _.isNullOrUndefined(options.concurrency) ? 100 : options.concurrency!;
        myOptions.concurrency = Math.max(1, myOptions.concurrency);

        myOptions.unlimitedRetries = _.isNullOrUndefined(options.unlimitedRetries) ? false : options.unlimitedRetries!;
        myOptions.retryCount = _.isNullOrUndefined(options.retryCount) ? 0 : options.retryCount!;
        myOptions.initRetryDelay = _.isNullOrUndefined(options.initRetryDelay) ? 500 : options.initRetryDelay!;
        myOptions.maxRetryDelay = _.isNullOrUndefined(options.maxRetryDelay) ? 5000 : options.maxRetryDelay!;
        myOptions.retryDelayCoeff = _.isNullOrUndefined(options.retryDelayCoeff) ? 2.0 : options.retryDelayCoeff!;

        if (!_.isNullOrUndefined(options.coolDownOnFailure)) {
            myOptions.coolDownOnFailure = options.coolDownOnFailure!;
        }
        if (!_.isNullOrUndefined(options.waitCompleteBeforeExit)) {
            myOptions.waitCompleteBeforeExit = options.waitCompleteBeforeExit!;
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
        return Promise.all(items.map(x => action(x)));
    }

    /*
     * Processes items in sequence
     */
    static serial<T, R>(items: T[] | null, action: MapperFunction<T, R>): Promise<R[]> {
        return MyPromise.execute(items, action, {
            concurrency: 0,
            unlimitedRetries: false,
            retryCount: 0,
        });
    }

    static async try<T>(action: () => Resolvable<T>): Promise<T>
    {
        try
        {
            const res = await action();
            return res;
        }
        catch(err: any)
        {
            throw err;
        }
    }

    /*
     * Simple retry logic
     */
    static retry<T>(action: () => Resolvable<T>, options?: RetryOptions): Promise<T> {
        options = options || {};

        const myOptions = new CRetryOptions();
        myOptions.unlimitedRetries = _.isNullOrUndefined(options.unlimitedRetries) ? false : options.unlimitedRetries!;
        myOptions.retryCount = _.isNullOrUndefined(options.retryCount) ? 3 : options.retryCount!;
        myOptions.initRetryDelay = _.isNullOrUndefined(options.initRetryDelay) ? 500 : options.initRetryDelay!;
        myOptions.maxRetryDelay = _.isNullOrUndefined(options.maxRetryDelay) ? 5000 : options.maxRetryDelay!;
        myOptions.retryDelayCoeff = _.isNullOrUndefined(options.retryDelayCoeff) ? 2.0 : options.retryDelayCoeff!;
        myOptions.canContinueCb = _.isNullOrUndefined(options.canContinueCb) ? undefined : options.canContinueCb!;

        myOptions.failureCount = 0;
        myOptions.retryTimeout = myOptions.initRetryDelay;

        return MyPromise._promiseRetryLoop(action, myOptions);
    }

    private static _promiseRetryLoop<T>(action: () => Resolvable<T>, options: CRetryOptions): Promise<T> {
        return MyPromise.try(action).catch((reason) => {
            return MyPromise._promiseRetryHandleFailure(reason, action, options);
        });
    }

    private static _promiseRetryHandleFailure<T>(
        reason: any,
        action: () => Resolvable<T>,
        options: CRetryOptions,
    ): Promise<T> {
        options.failureCount++;

        if (options.unlimitedRetries || 
            options.failureCount <= options.retryCount)
        {
            if (options.canContinueCb) {
                return MyPromise.try(() => {
                    return options.canContinueCb!(reason);
                })
                .catch((reason) => {
                    return MyPromise._promiseRetryHandleFailure(reason, action, options);
                })
                .then((result) => {
                    if (result) {
                        return MyPromise._promiseRetryWithTimeout(action, options);
                    } else {
                        throw reason;
                    }
                });
            }

            options.retryTimeout = Math.min(options.retryTimeout * options.retryDelayCoeff, options.maxRetryDelay);
            return MyPromise._promiseRetryWithTimeout(action, options);
        }

        throw reason;
    }

    private static _promiseRetryWithTimeout<T>(action: () => Resolvable<T>, options: CRetryOptions): Promise<T> {
        return MyPromise.timeout(options.retryTimeout).then(() => MyPromise._promiseRetryLoop(action, options));
    }

    /*
     * Returns a promise which resolves in specified time delay
     */
    static delay(timeoutMs: number): Promise<void> {
        if (!timeoutMs) {
            return Promise.resolve();
        }
        return MyPromise.construct<void>(function (fulfill, reject) {
            setTimeout(() => {
                fulfill();
            }, timeoutMs);
        }).then(() => Promise.resolve());
    }

    /*
     * Returns a promise which resolves in specified time delay
     */
    static timeout(timeoutMs: number): Promise<void> {
        return MyPromise.delay(timeoutMs);
    }

    /*
     * Creates a new Promise
     */
    static construct<T = void>(
        callback: (resolve: (thenableOrResult: Resolvable<T>) => void, 
                   reject: (error?: any) => void) => void
    ): Promise<T>
    {
        return new Promise<T>(
            function(resolve, reject)
            {
                return callback(resolve, reject);
            }
        );
    }
}
