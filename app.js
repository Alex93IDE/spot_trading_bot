require('dotenv').config()
const express = require('express')
const { log, logColor, colors } = require('./utils/logger')
const { bot_struct, getBalance, getPriceMarket, _buy, getFillsId, _sell, getBaseSize } = require('./utils/bot')
const my_process = require('./utils/process')
const Storage = require('node-storage')
const server = express();
const port = 8080;

//Settings
server.set('json spaces', 2);

//Middlewares
server.use(express.json());  //entiende los formatos json y los convierte a objetos
server.use(express.urlencoded({ extended: false }));  //entiende los formulario
server.use(require('./Routes/routes'))

const sleep = (timeMs) => new Promise(resolve => setTimeout(resolve, timeMs))

var flag_store = 0
var store = ''

function _newPriceReset(_market, balance, price) {

    const market = _market == 1 ? bot_struct.MARKET1 : bot_struct.MARKET2
    if (!(parseFloat(store.get(`${market}_balance`)) > balance))
        store.put('start_price', price)
}

async function _calculateProfits() {
    const orders = store.get('orders')
    const sold = orders.filter(order => {
        return order.status === 'sold'
    })

    const totalSoldProfits = sold.length > 0 ?
        sold.map(order => order.profit).reduce((prev, next) =>
            parseFloat(prev) + parseFloat(next)) : 0

    store.put('profits', totalSoldProfits + parseFloat(store.get('profits')))
}

function _logProfits(price) {
    const profits = parseFloat(store.get('profits'))
    var isGainerProfit = profits > 0 ?
        1 : profits < 0 ? 2 : 0

    logColor(isGainerProfit == 1 ?
        colors.green : isGainerProfit == 2 ?
            colors.red : colors.gray,
        `Global Profits: ${parseFloat(store.get('profits')).toFixed(3)} ${bot_struct.MARKET2}`)

    const m1Balance = store.get(`${bot_struct.MARKET1}_balance`)
    const m2Balance = store.get(`${bot_struct.MARKET2}_balance`)

    const initialBalance = store.get(`initial_${bot_struct.MARKET2}_balance`)
    logColor(colors.gray,
        `Balance: ${m1Balance} ${bot_struct.MARKET1}, ${m2Balance.toFixed(2)} ${bot_struct.MARKET2}, Current: ${parseFloat(m1Balance * price + m2Balance)} ${bot_struct.MARKET2}, Initial: ${initialBalance.toFixed(2)} ${bot_struct.MARKET2}`)
}

async function _buy_kucoin(price) {
    if (store.get(`${bot_struct.MARKET2}_balance`) > bot_struct.base_quote) {
        var orders = store.get('orders')
        var factor = 0;
        var order = {
            id: '',
            buy_price: 0,
            amount: 0,
            sell_price: 0,
            sold_price: 0,
            status: 'pending',
            profit: 0,
        }
        log(`
            Buying ${bot_struct.MARKET1}
            ==================
            amountIn: ${bot_struct.base_quote} ${bot_struct.MARKET2}
            amountOut: ${bot_struct.base_quote / price} ${bot_struct.MARKET1}
        `)

        let res = await _buy({
            clientOid: Date.now(),
            side: 'buy',
            symbol: bot_struct.MARKET,
            type: 'market',
            tradeType: 'TRADE'
        }, { funds: bot_struct.base_quote })

        if (res.code == '200000') {
            let idFillorder = ''
            let res_fill
            while (res.data.orderId != idFillorder) {
                try {
                    res_fill = await getFillsId(bot_struct.MARKET, 'buy', res.data.orderId)
                    if (res_fill.data.items[0] != null)
                        idFillorder = res_fill.data.items[0].orderId
                    sleep(3000)
                } catch (error) {
                    logColor(colors.red, error)
                }
            }
            order.id = res.data.orderId
            if (res_fill.code == "200000") {
                factor = process.env.PRICE_PERCENT * res_fill.data.items[0].price / 100

                order.status = 'bought'
                order.buy_price = parseFloat(res_fill.data.items[0].price)
                order.amount = parseFloat(res_fill.data.items[0].size)
                order.sell_price = parseFloat(order.buy_price + factor)

                store.put('start_price', order.buy_price)
                store.put(`${bot_struct.MARKET1}_balance`, await getBalance(bot_struct.MARKET1));
                store.put(`${bot_struct.MARKET2}_balance`, await getBalance(bot_struct.MARKET2));

                orders.push(order)

                logColor(colors.green, '=============================')
                logColor(colors.green, `Bought ${bot_struct.base_quote / price} ${bot_struct.MARKET1} for ${parseFloat(bot_struct.base_quote).toFixed(2)} ${bot_struct.MARKET2}, Price: ${order.buy_price}\n`)
                logColor(colors.green, '=============================')

                await _calculateProfits()
            }
        } else _newPriceReset(2, bot_struct.base_quote, price)
    } else _newPriceReset(2, bot_struct.base_quote, price)
}

async function _sell_kucoin(price) {
    const orders = store.get('orders')
    var toSold = []

    for (var i = 0; i < orders.length; i++) {
        var order = orders[i]
        if (price >= order.sell_price) {
            order.sold_price = price
            order.status = 'selling'
            toSold.push(order)
        }
    }

    if (toSold.length > 0) {
        const totalAmount = parseFloat(toSold.map(order => order.amount).reduce((prev, next) => parseFloat(prev) + parseFloat(next)))

        if (totalAmount > 0 && parseFloat(store.get(`${bot_struct.MARKET1}_balance`)) >= totalAmount) {
            log(`
                Selling ${bot_struct.MARKET1}
                =================
                amountIn: ${totalAmount.toFixed(2)} ${bot_struct.MARKET1}
                amountOut: ${parseFloat(totalAmount * price).toFixed(2)} ${bot_struct.MARKET2}
            `)
            let amountToSell = await getBaseSize(bot_struct.MARKET1, totalAmount)
            let res = await _sell({
                clientOid: Date.now(),
                side: 'sell',
                symbol: bot_struct.MARKET,
                type: 'market',
                tradeType: 'TRADE'
            }, { size: amountToSell })
            if (res.code == "200000") {
                let idFillorder = ''
                let res_fill
                while (res.data.orderId != idFillorder) {
                    try {
                        res_fill = await getFillsId(bot_struct.MARKET, 'sell', res.data.orderId)
                        if (res_fill.data.items[0] != null)
                            idFillorder = res_fill.data.items[0].orderId
                        sleep(3000)
                    } catch (error) {
                        logColor(colors.red, error)
                    }
                }
                if (res_fill.code == "200000") {
                    const _price = parseFloat(res_fill.data.items[0].price)
                    for (var i = 0; i < orders.length; i++) {
                        var order = orders[i]
                        for (var j = 0; j < toSold.length; j++) {
                            if (order.id == toSold[j].id) {
                                toSold[j].profit = (parseFloat(toSold[j].amount) * _price)
                                    - (parseFloat(toSold[j].amount) * parseFloat(toSold[j].buy_price))
                                toSold[j].status = 'sold'
                                orders[i] = toSold[j]
                            }
                        }
                    }

                    store.put('start_price', _price)
                    store.put(`${bot_struct.MARKET1}_balance`, await getBalance(bot_struct.MARKET1));
                    store.put(`${bot_struct.MARKET2}_balance`, await getBalance(bot_struct.MARKET2));

                    logColor(colors.red, '=============================')
                    logColor(colors.red,
                        `Sold ${totalAmount} ${bot_struct.MARKET1} for ${parseFloat(totalAmount * _price).toFixed(2)} ${bot_struct.MARKET2}, Price: ${_price}\n`)
                    logColor(colors.red, '=============================')

                    await _calculateProfits()
                    var i = orders.length
                    while (i--)
                        if (orders[i].status === 'sold')
                            orders.splice(i, 1)
                }
            } else store.put('start_price', price)
        } else store.put('start_price', price)
    } else store.put('start_price', price)
}

async function loop() {
    let market_price = 0;
    let start_price = 0;
    while (true) {
        try {
            if (bot_struct.start_bot_trading == 1) {
                market_price = await getPriceMarket(bot_struct.MARKET);
                if (flag_store == 0) {
                    store = new Storage(`./data/${bot_struct.MARKET}.json`)
                    flag_store = 1
                }
                if (market_price != 0) {
                    start_price = store.get('start_price');
                    //console.clear()
                    //log('=====================================================================')
                    //_logProfits(market_price)
                    //log('=====================================================================')

                    //log(`Prev price: ${start_price}`)
                    //log(`New price: ${market_price}`)
                    if (market_price < start_price) {
                        const factor = (start_price - market_price)
                        const percent = parseFloat(100 * factor / start_price).toFixed(2)
                        //logColor(colors.red, `Losers: -${parseFloat(percent).toFixed(3)}% ==> -$${parseFloat(factor).toFixed(4)}`)
                        store.put('percent', `-${parseFloat(percent).toFixed(3)}`)
                        if (percent >= process.env.PRICE_PERCENT)
                            await _buy_kucoin(market_price);

                    } else {
                        const factor = (market_price - start_price)
                        const percent = 100 * factor / market_price
                        //logColor(colors.green, `Gainers: +${parseFloat(percent).toFixed(3)}% ==> +$${parseFloat(factor).toFixed(4)}`)
                        store.put('percent', `+${parseFloat(percent).toFixed(3)}`)
                        await _sell_kucoin(market_price)
                    }
                    const orders = store.get('orders')
                    //if (orders.length > 0)
                    //console.log(orders[orders.length - 1])
                }
            }
        } catch (error) {
            logColor(colors.red, error)
        }
        await sleep(20000);
    }
}

async function setup() {
    server.listen(process.env.PORT || process.env.ALWAYSDATA_HTTPD_PORT || port, process.env.ALWAYSDATA_HTTPD_IP || process.env.IP || '127.0.0.1', () => {
        console.log(`Servidor corriendo por el puerto ${port}`);
    });
    loop();
}

setup();