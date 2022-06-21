const Storage = require('node-storage')
const { bot_struct, getPriceMarket, getBalance } = require('../../utils/bot')
const { log, logColor, colors } = require('../../utils/logger')

exports.home = async function home(req, res) {
    let store = new Storage(`./data/${bot_struct.MARKET}.json`)
    let system = (bot_struct.start_bot_trading) ? 'ENCENDIDO' : 'DETENIDO'
    let price = (bot_struct.start_bot_trading) ? await getPriceMarket(bot_struct.MARKET) : 0
    res.json({
        system: system,
        marketPrice: price,
        store: store.store
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
    let symbol_1 = words[0].toUpperCase()
    let symbol_2 = words[1].toUpperCase()

    switch (data.status) {
        case 'start':
            bot_struct.MARKET1 = symbol_1
            bot_struct.MARKET2 = symbol_2
            bot_struct.MARKET = data.symbol
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

            logColor(colors.green, 'BOT ENCENDIDO')
            bot_struct.start_bot_trading = 1;
            res.json('BOT ENCENDIDO START')
            break;
        case 'continue':
            bot_struct.MARKET1 = symbol_1
            bot_struct.MARKET2 = symbol_2
            bot_struct.MARKET = data.symbol
            bot_struct.base_quote = parseInt(data.fund)

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