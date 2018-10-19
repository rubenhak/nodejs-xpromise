module.exports = function(Promise) {


    Promise.retry = function(action, number, timeout, canContinueCb) {
        return Promise.resolve()
            .then(() => promiseRetryLoop(action, number, timeout, canContinueCb));
    }
    
    function promiseRetryLoop(action, count, timeout, canContinueCb) {
        try {
            return Promise.resolve(action())
                .catch(reason => {
                    return promiseRetryHandleFailure(reason, action, count, timeout, canContinueCb);
                });
        } catch (e) {
            return promiseRetryHandleFailure(e, action, count, timeout, canContinueCb);
        }
    }
    
    function promiseRetryHandleFailure(reason, action, count, timeout, canContinueCb)
    {
        if (count > 0) {
            if (canContinueCb)
            {
                if (!canContinueCb(reason))
                {
                    throw reason;
                }
            }
            return Promise.timeout(timeout)
                .then(() => promiseRetryLoop(action, count - 1, timeout, canContinueCb))
        }

        throw reason;
    }
    
}