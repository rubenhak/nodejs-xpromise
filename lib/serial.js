module.exports = function(Promise) {

    Promise.serial = function(arr, action) {
        if (!arr) {
            return Promise.resolve([])
        }
        var results = [];
        return Promise.each(arr, x => {
            return Promise.resolve(action(x))
                .then(result => {
                    results.push(result);
                })
        })
        .then(() => results);
    }

}

