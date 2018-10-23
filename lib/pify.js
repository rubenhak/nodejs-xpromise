
module.exports = function(Promise) {

    Promise.pify = function(fn, ctx) {
        return Promise.promisify(fn, {context: ctx});
    }
    
}