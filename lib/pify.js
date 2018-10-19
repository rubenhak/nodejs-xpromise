const pify = require('pify');

module.exports = function(Promise) {

    Promise.pify = function(fn, options) {
        options = Object.assign({
            promiseModule: Promise
        }, options);
    
        return pify(fn, options);
    }
    
}