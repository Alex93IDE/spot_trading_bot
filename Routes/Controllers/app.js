const Storage = require('node-storage')
const { bot_struct, getPriceMarket, getBalance } = require('../../utils/bot')
const { log, logColor, colors } = require('../../utils/logger')

exports.home = async function home(req, res) {
    let store = new Storage(`./data/${bot_struct.MARKET}.json`)
    let storeGeneral = new Storage('./data/general.json')
    let system = (bot_struct.start_bot_trading) ? 'ENCENDIDO' : 'DETENIDO'
    let price = (bot_struct.start_bot_trading) ? await getPriceMarket(bot_struct.MARKET) : 0
    let current = (bot_struct.start_bot_trading) ? (price * store.get(`${bot_struct.MARKET1}_balance`)) + store.get(`${bot_struct.MARKET2}_balance`) : 0
    let timeTotal = (bot_struct.start_bot_trading) ? storeGeneral.get('time') : 0

    let days = Math.floor(timeTotal / 86400)
    let hours = Math.floor((timeTotal % 86400) / 3600)
    hours = (hours < 10) ? '0' + hours : hours
    let minutes = Math.floor(((timeTotal % 86400) % 3600) / 60)
    minutes = (minutes < 10) ? '0' + minutes : minutes;
    let seconds = ((timeTotal % 86400) % 3600) % 60;
    seconds = (seconds < 10) ? '0' + seconds : seconds;

    res.json({
        system: system,
        time: days + 'd ' + hours + ':' + minutes + ':' + seconds,
        symbol: bot_struct.MARKET,
        funds: bot_struct.base_quote,
        percent_buy: bot_struct.PRICE_PERCENT_BUY + '%',
        percent_sell: bot_struct.PRICE_PERCENT_SELL + '%',
        marketPrice: price,
        current: current,
        store: store.store,
    })
}

exports.restart = function restart(req, res) {
    setTimeout(() => {
        process.exit()
    }, 1000);
    res.json("done")
}

exports.process_bot = async function a(req, res) {
    let data = req.query;
    const words = data.symbol.split('-')
    let symbol_1 = words[0]
    let symbol_2 = words[1]

    switch (data.status) {
        case 'start':
            bot_struct.MARKET1 = symbol_1
            bot_struct.MARKET2 = symbol_2
            bot_struct.MARKET = data.symbol
            bot_struct.time = 0
            bot_struct.base_quote = parseInt(data.fund)
            let store = new Storage(`./data/${bot_struct.MARKET}.json`)

            store.put('start_price', await getPriceMarket(bot_struct.MARKET))
            store.put('orders', []);
            store.put('profits', 0);
            store.put('percent', 0);
            store.put(`${symbol_1}_balance`, await getBalance(symbol_1));
            store.put(`${symbol_2}_balance`, await getBalance(symbol_2));
            store.put(`initial_${symbol_1}_balance`, store.get(`${symbol_1}_balance`));
            store.put(`initial_${symbol_2}_balance`, store.get(`${symbol_2}_balance`));
            store.put('orders_sold', []);

            logColor(colors.green, 'BOT ENCENDIDO')
            bot_struct.start_bot_trading = 1;
            res.json('BOT ENCENDIDO START')
            break;
        case 'continue':
            let storeGeneral = new Storage('./data/general.json')
            bot_struct.MARKET1 = symbol_1
            bot_struct.MARKET2 = symbol_2
            bot_struct.MARKET = data.symbol
            bot_struct.base_quote = parseFloat(data.fund)
            bot_struct.time = storeGeneral.get('time')
            if (bot_struct.time == null)
                bot_struct.time = 0

            logColor(colors.green, 'BOT ENCENDIDO')
            bot_struct.start_bot_trading = 1;
            res.json('BOT ENCENDIDO CONTINUE')
            break;
        case 'stop':
            bot_struct.start_bot_trading = 0;
            res.json('BOT DETENIDO')
            break;
        default:
            res.json('status fall')
            break;
    }
}