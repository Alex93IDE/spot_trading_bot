const API = require('kucoin-node-sdk');

API.init(require('./config'));

module.exports = API;