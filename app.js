const API = require('./services/kucoin')
const Storage = require('node-storage')
const { log, logColor, colors } = require('./utils/logger')
const { pares } = require('./services/websocket')

const sleep = (timeMs) => new Promise(resolve => setTimeout(resolve, timeMs))

var MARKET1 = ''
var MARKET2 = ''
var MARKET = ''
var store = null
var flags_general = {
    start_bot_trading: 0
}


process.stdin.on('data', function (data) {
    let message = data.toString().trim();
   
    if (message.includes('start') >= 0 && flags_general.start_bot_trading == 0) {
        let obj = Object.entries(data.toString().trim());
        let array = [];
        let i = 6;
      
        while (obj[i][1] != ' ') {
            array.push(obj[i][1])
            i++;
        }
        let symbol_1 = array.join('').toUpperCase()
        i++;
        array = []

        for (; i < obj.length; i++) {
            array.push(obj[i][1])
        }
        let symbol_2 = array.join('').toUpperCase()

        MARKET1 = symbol_1
        MARKET2 = symbol_2
        MARKET = MARKET1 + '-' + MARKET2
        store = new Storage(`./data/${MARKET}.json`)

        log(MARKET)

        for (let i = 0; i < pares.length; i++) {
            if (pares[i]['coin'] == MARKET) {
                store.put('start_price', parseFloat(pares[i]['price']))
            }
        }
        flags_general = 1;
    }
})


async function loop() {
    while (true) {
        try {
            if(flags_general == 1){

            }

        } catch (error) {
            logColor(colors.red, error)
        }
        await sleep(5000);
    }
}

async function setup() {

    loop();
}

setup();