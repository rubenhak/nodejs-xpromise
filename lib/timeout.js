module.exports = function(Promise) {

    Promise.timeout = function(timeout) {
        return new Promise(function (fulfill, reject) {
            setTimeout(() => {
                fulfill();
            }, timeout);
        });
    }
    
}