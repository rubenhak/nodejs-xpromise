module.exports = function(Promise) {

    Promise.parallel = function(arr, action) {
        return Promise.map(arr, action);
    }
    
}

