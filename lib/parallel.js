module.exports = function(Promise) {

    Promise.parallel = function(arr, action) {
        if (!arr) {
            return Promise.resolve([])
        }
        return Promise.map(arr, action);
    }
    
}

