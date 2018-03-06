const Promise = require('promise');
const _ = require('lodash');

function _processInSerialX(resolve, reject, arr, action, result) {
    try {
        if (!arr || arr.length === 0) {
            resolve(result);
            return;
        }

        var item = arr.shift();
        var p = action(item);
        if (p) {
            Promise.resolve(p).then(val => {
                result.push(val);
                _processInSerialX(resolve, reject, arr, action, result);
            })
            .catch(reason => {
                // console.log('[XPromise::_processInSerialX] ERROR-1');
                // console.log(reason);
                reject(reason);
            });
            return;
        }

        result.push(null);
        _processInSerialX(resolve, reject, arr, action, result);

    } catch (e) {
        // console.log('[XPromise::_processInSerialX] ERROR-2');
        // console.log(e);
        reject(e);
    }
}

Promise.serial = function(arr, action) {
    return new Promise((resolve, reject) => {
        var result = [];
        _processInSerialX(resolve, reject, _.clone(arr), action, result);
    });
}

Promise.parallel = function(arr, action) {
    return new Promise.all(arr.map(x => {
        return action(x);
    }));
}

Promise.retry = function(promiseAction, number, timeout) {
    return new Promise(function (fulfill, reject) {
        _promiseRetryLoop(fulfill, reject, promiseAction, number, timeout);
    });
}

function _promiseRetryLoop(fulfill, reject, action, count, timeout) {
    Promise.resolve(action())
        .then(fulfill)
        .catch(reason => {
            console.log(`[XPromise::_promiseRetryLoop] failed. ${reason}.`);
            if (count > 0) {
                setTimeout( () => {
                    _promiseRetryLoop(fulfill, reject, action, count - 1, timeout);
                }, timeout);
            } else {
                reject(reason);
            }
        });
}

Promise.timeout = function(timeout) {
    return new Promise(function (fulfill, reject) {
        setTimeout(() => {
            fulfill();
        }, timeout);
    });
}


module.exports = Promise;
