module.exports = function(Promise) {

    Promise.parallel = function(arr, action) {
        return new Promise.all(arr.map(x => {
            return action(x);
        }));
    }
    
}

