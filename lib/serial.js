module.exports = function(Promise) {

    Promise.serial = function(arr, action) {
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

