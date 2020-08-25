import { Promise } from 'bluebird';

type Resolvable<R> = R | XPromise<R>;
type MapperFunction<T, R> = (item: T) => Resolvable<R>;

class XPromise<T> extends Promise<T>
{
    static parallel<T, R>(items: T[] | null, action: MapperFunction<T, R>) : Promise<R[]> {
        if (!items) {
            return Promise.resolve([])
        }
        return Promise.map(items, action);
    }

    static serial<T, R>(items: T[] | null, action: MapperFunction<T, R>) : Promise<R[]> {
        if (!items) {
            return Promise.resolve([])
        }
        let results : R[] = [];
        return Promise.each(items, x => {
            return Promise.resolve(action(x))
                .then(result => {
                    results.push(result);
                })
        })
        .then(() => results);
    }

    // pify(func: (callback: (err: any, result?: T) => void) => void, ctx: any | null) : Promise<T> 
    // pify<A1>(func: (arg1: A1, callback: (err: any, result?: T) => void) => void, ctx: any | null) : Promise<T> 
    // pify<A1, A2>(func: (arg1: A1, arg2: A2, callback: (err: any, result?: T) => void) => void, ctx: any | null) : Promise<T> 
    // pify<A1, A2, A3>(func: (arg1: A1, arg2: A2, arg3: A3, callback: (err: any, result?: T) => void) => void, ctx: any | null) : Promise<T> 
    // pify<A1, A2, A3, A4>(func: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, callback: (err: any, result?: T) => void) => void, ctx: any | null) : Promise<T> 
    // pify<A1, A2, A3, A4, A5>(func: (arg1: A1, arg2: A2, arg3: A3, arg4: A4, arg5: A5, callback: (err: any, result?: T) => void) => void, ctx: any | null) : Promise<T> 
    // {
    //     return Promise.promisify(func, {context: ctx});
    // }
    

    static retry<T>(action: () => Resolvable<T>, count: number, timeoutMs: number, canContinueCb: (reason: any) => boolean): Promise<T> {
        return XPromise._promiseRetryLoop(action, count, timeoutMs, canContinueCb);
    }
    
    static _promiseRetryLoop<T>(action: () => Resolvable<T>, count: number, timeoutMs: number, canContinueCb: (reason: any) => boolean): Promise<T> {
        return Promise.try(action)
            .catch(reason => {
                return XPromise._promiseRetryHandleFailure(reason, action, count, timeoutMs, canContinueCb);
            });
    }
    
    static _promiseRetryHandleFailure<T>(reason: any, action: () => Resolvable<T>, count: number, timeoutMs: number, canContinueCb: (reason: any) => boolean): Promise<T>
    {
        if (count > 0) {
            if (canContinueCb)
            {
                if (!canContinueCb(reason))
                {
                    throw reason;
                }
            }
            return XPromise.timeout(timeoutMs)
                .then(() => XPromise._promiseRetryLoop(action, count - 1, timeoutMs, canContinueCb))
        }

        throw reason;
    }


    static timeout(timeoutMs: number) : Promise<void> {
        return new Promise<void>(function (fulfill, reject) {
            setTimeout(() => {
                fulfill();
            }, timeoutMs);
        });
    }

}

export { XPromise as Promise };
