
module.exports = function(Promise) {

    Promise.pify = function(fn, ctx) {
        return Promise.pify(fn, {context: ctx});
    }
    
}