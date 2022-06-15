const API = require('./kucoin')

const datafeed = new API.websocket.Datafeed(privateBullet = true);  //privateBullet = true, used endpoint private

var pares = [];

// close callback
datafeed.onClose(() => {
    console.log('ws closed, status ', datafeed.trustConnected);
});

// connect
datafeed.connectSocket();

// subscribe
const topic = `/market/ticker:all`;

const callbackId = datafeed.subscribe(topic, (message) => {
    if (message.topic === topic) {
        if (message.subject.search('-USDT') > 1) {
            if (!pares.find(el => el.coin === message.subject)) {
                pares.push({ 'coin': message.subject, 'price': message.data.price })
            } else {
                for (let i = 0; i < pares.length; i++) {
                    if (pares[i]['coin'] === message.subject) {
                        pares[i]['price'] = message.data.price
                    }
                }
            }
        }

    }
}, false);

console.log(`subscribe id: ${callbackId}`);

module.exports = {
    pares
}
