const { log, logColor, colors } = require('./logger')
const Storage = require('node-storage')
const { bot_struct, getBalance, getPriceMarket, getFillsId, getFillsAll } = require('./bot')

const sleep = (timeMs) => new Promise(resolve => setTimeout(resolve, timeMs))

process.stdin.on('data', async function (data) {
    let message = data.toString().trim();

    if (message.includes('start') >= 1 && bot_struct.start_bot_trading == 0) {
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

        while (obj[i][1] != ' ') {
            array.push(obj[i][1])
            i++;
        }
        let symbol_2 = array.join('').toUpperCase()
        i++;
        array = []

        for (; i < obj.length; i++) {
            array.push(obj[i][1])
        }
        let base_quote = array.join('')

        bot_struct.MARKET1 = symbol_1
        bot_struct.MARKET2 = symbol_2
        bot_struct.MARKET = bot_struct.MARKET1 + '-' + bot_struct.MARKET2
        bot_struct.base_quote = parseInt(base_quote)
        let store = new Storage(`./data/${bot_struct.MARKET}.json`)

        store.put('start_price', await getPriceMarket(bot_struct.MARKET))
        store.put('orders', []);
        store.put('profits', 0);
        store.put('percent', 0);
        store.put(`${symbol_1}_balance`, await getBalance(symbol_1));
        store.put(`${symbol_2}_balance`, await getBalance(symbol_2));
        store.put(`initial_${symbol_1}_balance`, store.get(`${symbol_1}_balance`));
        store.put(`initial_${symbol_2}_balance`, store.get(`${symbol_2}_balance`));

        logColor(colors.green, 'BOT ENCENDIDO')
        bot_struct.start_bot_trading = 1;
    }
    if (message.includes('continue') >= 1 && bot_struct.start_bot_trading == 0) {
        let obj = Object.entries(data.toString().trim());
        let array = [];
        let i = 9;

        while (obj[i][1] != ' ') {
            array.push(obj[i][1])
            i++;
        }
        let symbol_1 = array.join('').toUpperCase()
        i++;
        array = []

        while (obj[i][1] != ' ') {
            array.push(obj[i][1])
            i++;
        }
        let symbol_2 = array.join('').toUpperCase()
        i++;
        array = []

        for (; i < obj.length; i++) {
            array.push(obj[i][1])
        }
        let base_quote = array.join('')

        bot_struct.MARKET1 = symbol_1
        bot_struct.MARKET2 = symbol_2
        bot_struct.MARKET = bot_struct.MARKET1 + '-' + bot_struct.MARKET2
        bot_struct.base_quote = parseInt(base_quote)
        logColor(colors.green, 'BOT ENCENDIDO')
        bot_struct.start_bot_trading = 1;
    }
    if (message.includes('fillbuy') >= 1) {
        let res_fill = await getFillsAll(bot_struct.MARKET, 'buy')
        log(res_fill.data.items)
    }
    if (message.includes('fillsell') >= 1) {
        let res_fill = await getFillsAll(bot_struct.MARKET, 'sell')
        log(res_fill.data.items)
    }
    if (message.includes('stop') >= 1) {
        bot_struct.start_bot_trading = 0;
        logColor(colors.red, 'BOT DETENIDO')
        sleep(3000)
        console.clear()
    }
})