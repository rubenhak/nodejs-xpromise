module.exports = function(Promise) {


    Promise.retry = function(promiseAction, number, timeout, canContinueCb) {
        return new Promise(function (fulfill, reject) {
            _promiseRetryLoop(fulfill, reject, promiseAction, number, timeout, canContinueCb);
        });
    }
    
    function _promiseRetryLoop(fulfill, reject, action, count, timeout, canContinueCb) {
        try {
            Promise.resolve(action())
            .then(fulfill)
            .catch(reason => {
                _promiseRetryHandleFailure(reason, fulfill, reject, action, count, timeout, canContinueCb);
            });
        } catch (e) {
            _promiseRetryHandleFailure(e, fulfill, reject, action, count, timeout, canContinueCb);
        }
    }
    
    function _promiseRetryHandleFailure(reason, fulfill, reject, action, count, timeout, canContinueCb)
    {
        try {
            // console.log(`[XPromise::_promiseRetryLoop] failed. ${reason}.`);
            if (count > 0) {
                if (canContinueCb)
                {
                    if (!canContinueCb(reason))
                    {
                        reject(reason);
                        return;
                    }
                }
                setTimeout( () => {
                    _promiseRetryLoop(fulfill, reject, action, count - 1, timeout);
                }, timeout);
            } else {
                reject(reason);
            }
        }
        catch(error) {
            reject(error);
        }
    }
    
}