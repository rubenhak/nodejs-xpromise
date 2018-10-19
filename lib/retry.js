module.exports = function(Promise) {


    Promise.retry = function(action, number, timeout, canContinueCb) {
        return promiseRetryLoop(action, number, timeout, canContinueCb);
    }
    
    function promiseRetryLoop(action, count, timeout, canContinueCb) {
        return Promise.try(action)
            .catch(reason => {
                return promiseRetryHandleFailure(reason, action, count, timeout, canContinueCb);
            });
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