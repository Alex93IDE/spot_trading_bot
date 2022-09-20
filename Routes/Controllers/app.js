const Storage = require('node-storage')
const { bot_struct, getPriceMarket, getBalance } = require('../../utils/bot')
const { log, logColor, colors } = require('../../utils/logger')
const { exec } = require('child_process')

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
        percent_buy: bot_struct.PRICE_PERCENT_BUY,
        percent_sell: bot_struct.PRICE_PERCENT_SELL,
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
    let storeGeneral = new Storage('./data/general.json')

    switch (data.status) {
        case 'start':
            bot_struct.MARKET1 = symbol_1.toUpperCase();
            bot_struct.MARKET2 = symbol_2.toUpperCase();
            bot_struct.MARKET = data.symbol.toUpperCase();
            bot_struct.time = 0
            bot_struct.base_quote = parseFloat(data.fund)
            let store = new Storage(`./data/${bot_struct.MARKET}.json`)

            store.put('start_price', await getPriceMarket(bot_struct.MARKET))
            store.put('orders', []);
            store.put('profits', 0);
            store.put('percent', 0);
            store.put(`${bot_struct.MARKET1}_balance`, await getBalance(bot_struct.MARKET1));
            store.put(`${bot_struct.MARKET2}_balance`, await getBalance(bot_struct.MARKET2));
            store.put(`initial_${bot_struct.MARKET1}_balance`, store.get(`${bot_struct.MARKET1}_balance`));
            store.put(`initial_${bot_struct.MARKET2}_balance`, store.get(`${bot_struct.MARKET2}_balance`));
            store.put('orders_sold', []);
            store.put('history_price', []);
            storeGeneral.put('time', bot_struct.time);

            logColor(colors.green, 'BOT ENCENDIDO')
            bot_struct.start_bot_trading = 1;
            res.json('BOT ENCENDIDO START')
            break;
        case 'continue':
            bot_struct.MARKET1 = symbol_1.toUpperCase();
            bot_struct.MARKET2 = symbol_2.toUpperCase();
            bot_struct.MARKET = data.symbol.toUpperCase();
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

exports.percent = async function percent(req, res) {
    let old_percent_buy = bot_struct.PRICE_PERCENT_BUY
    let old_percent_sell = bot_struct.PRICE_PERCENT_SELL

    let new_percent_buy = req.body.buy
    let new_percent_sell = req.body.sell

    bot_struct.PRICE_PERCENT_BUY = new_percent_buy
    bot_struct.PRICE_PERCENT_SELL = new_percent_sell

    res.json('Percent change' + ' buy: ' + old_percent_buy + ' to ' + bot_struct.PRICE_PERCENT_BUY +
        ' Sell: ' + old_percent_sell + ' to ' + bot_struct.PRICE_PERCENT_SELL)
}

exports.funds = async (req, res) => {
    let old_fund = bot_struct.base_quote;
    let new_fund = req.body.fund;
    bot_struct.base_quote = new_fund;

    res.json('Fund change of ' + old_fund + ' to ' + bot_struct.base_quote)
}

exports.commandTerminalDeleteData = async (req, res) => {
    exec('rm -rfv data/', (error, stdout, stderr) => {
        if (error) {
            res.json(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            res.json(`stderr: ${stderr}`);
            return;
        }
        res.json(`stdout: ${stdout}`);
    })
}