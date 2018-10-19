const _ = require('lodash');

module.exports = function(Promise) {

    Promise.serial = function(arr, action) {
        return new Promise((resolve, reject) => {
            var result = [];
            _processInSerialX(resolve, reject, _.clone(arr), action, result);
        });
    }
    
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

}

