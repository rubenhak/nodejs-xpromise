var Promise = require('promise');

require('./lib/parallel')(Promise);
require('./lib/pify')(Promise);
require('./lib/retry')(Promise);
require('./lib/serial')(Promise);
require('./lib/timeout')(Promise);

module.exports = Promise;
