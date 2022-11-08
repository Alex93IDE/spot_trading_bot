require('dotenv').config()
const express = require('express')
const { log, logColor, colors } = require('./utils/logger')
const { bot_struct, getBalance, getPriceMarket, _buy, getFillsId, _sell, getBaseSize, getFillsAll, getOrder } = require('./utils/bot')
const Storage = require('node-storage')
const cors = require('cors')
const { v4: uuidv4 } = require('uuid')

const server = express();
const port = 8080;
var corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200
}

//Settings
server.set('json spaces', 2);
server.use(cors(corsOptions));

//Middlewares
server.use(express.json());  //entiende los formatos json y los convierte a objetos
server.use(express.urlencoded({ extended: false }));  //entiende los formulario
server.use(require('./Routes/routes'))

const sleep = (timeMs) => new Promise(resolve => setTimeout(resolve, timeMs))

var flag_store = 0
var store = ''
var storeGeneral = ''
var counterTime = 0
var counterTimeHistory = 0
var history_price = []
var market_price = 0;

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

async function _buy_kucoin(price) {
    if (store.get(`${bot_struct.MARKET2}_balance`) > bot_struct.base_quote) {
        var orders = store.get('orders')
        var factor = 0;
        var order = {
            date_buy: Date.now(),
            date_sell: '',
            id: uuidv4(),
            buy_price: 0,
            amount: 0,
            sell_price: 0,
            sold_price: 0,
            status: 'pending',
            profit: 0,
            fee_buy: 0,
            fee_sell: 0,
        }
        log(`
            Buying ${bot_struct.MARKET1}
            ==================
            amountIn: ${bot_struct.base_quote} ${bot_struct.MARKET2}
            amountOut: ${bot_struct.base_quote / price} ${bot_struct.MARKET1}
        `)

        const res = await _buy({
            clientOid: order.id,
            side: 'buy',
            symbol: bot_struct.MARKET,
            type: 'market',
            tradeType: 'TRADE'
        }, { funds: bot_struct.base_quote })

        if (res && res.code == '200000') {
            order.status = 'bought'

            const orderRes = await getOrder(res.data.orderId)

            order.buy_price = parseFloat(orderRes.data.dealFunds) / parseFloat(orderRes.data.dealSize)
            order.amount = parseFloat(orderRes.data.dealSize)
            factor = bot_struct.PRICE_PERCENT_SELL * order.buy_price / 100
            order.sell_price = parseFloat(order.buy_price + factor)
            order.fee_buy = parseFloat(orderRes.data.fee)

            store.put('start_price', order.buy_price)
            store.put(`${bot_struct.MARKET1}_balance`, await getBalance(bot_struct.MARKET1));
            store.put(`${bot_struct.MARKET2}_balance`, await getBalance(bot_struct.MARKET2));

            orders.push(order)

            log('================================================================')
            log(`Bought ${bot_struct.base_quote / price} ${bot_struct.MARKET1} for ${parseFloat(bot_struct.base_quote).toFixed(2)} ${bot_struct.MARKET2}, Price: ${order.buy_price}\n`)
            log('================================================================')

            await _calculateProfits()

        } else _newPriceReset(2, bot_struct.base_quote, price)
    } else _newPriceReset(2, bot_struct.base_quote, price)
}

async function _sell_kucoin(price) {
    const orders = store.get('orders')
    const orders_sold = store.get('orders_sold')
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
            let amountToSell = await getBaseSize(bot_struct.MARKET, totalAmount)
            const res = await _sell({
                clientOid: uuidv4(),
                side: 'sell',
                symbol: bot_struct.MARKET,
                type: 'market',
                tradeType: 'TRADE'
            }, { size: amountToSell })

            if (res && res.code == "200000") {

                const orderRes = await getOrder(res.data.orderId)

                const _price = parseFloat(orderRes.data.dealFunds) / parseFloat(orderRes.data.dealSize)
                const _fee = parseFloat(orderRes.data.fee)

                for (var i = 0; i < orders.length; i++) {
                    var order = orders[i]
                    for (var j = 0; j < toSold.length; j++) {
                        if (order.id == toSold[j].id) {
                            toSold[j].profit = (parseFloat(toSold[j].amount) * _price)
                                - (parseFloat(toSold[j].amount) * parseFloat(toSold[j].buy_price))
                            order.fee_sell = parseFloat(_fee / toSold.length)
                            toSold[j].profit -= order.fee_buy + order.fee_sell
                            toSold[j].status = 'sold'
                            toSold[j].sold_price = _price
                            toSold[j].date_sell = Date.now()
                            orders[i] = toSold[j]
                        }
                    }
                }
                store.put('start_price', _price)
                store.put(`${bot_struct.MARKET1}_balance`, await getBalance(bot_struct.MARKET1));
                store.put(`${bot_struct.MARKET2}_balance`, await getBalance(bot_struct.MARKET2));

                log('===========================================================')
                log(`Sold ${totalAmount} ${bot_struct.MARKET1} for ${parseFloat(totalAmount * _price).toFixed(2)} ${bot_struct.MARKET2}, Price: ${_price}\n`)
                log('===========================================================')

                await _calculateProfits()
                var i = orders.length
                while (i--)
                    if (orders[i].status === 'sold') {
                        orders_sold.push(orders[i])
                        if (orders_sold.length > 200) orders_sold.shift();
                        orders.splice(i, 1)
                    }

            } else store.put('start_price', price)
        } else store.put('start_price', price)
    } else store.put('start_price', price)
}

async function loop() {
    let start_price = 0;
    while (true) {
        try {
            if (bot_struct.start_bot_trading == 1) {
                market_price = await getPriceMarket(bot_struct.MARKET);
                if (flag_store == 0) {
                    store = new Storage(`./data/${bot_struct.MARKET}.json`)
                    storeGeneral = new Storage('./data/general.json')
                    history_price = store.get('history_price')
                    flag_store = 1
                }
                if (market_price > 0) {
                    start_price = store.get('start_price');
                    if (market_price < start_price) {
                        const factor = (start_price - market_price)
                        const percent = parseFloat(100 * factor / start_price)
                        store.put('percent', `-${parseFloat(percent).toFixed(3)}`)
                        if (percent >= bot_struct.PRICE_PERCENT_BUY)
                            await _buy_kucoin(market_price);
                    } else {
                        const factor = (market_price - start_price)
                        const percent = parseFloat(100 * factor / market_price)
                        store.put('percent', `+${parseFloat(percent).toFixed(3)}`)
                        await _sell_kucoin(market_price)
                    }
                }
            }
        } catch (error) {
            logColor(colors.red, error)
        }
        await sleep(30000);
    }
}

async function setup() {
    server.listen(process.env.PORT || process.env.ALWAYSDATA_HTTPD_PORT || port, process.env.ALWAYSDATA_HTTPD_IP || process.env.IP || '127.0.0.1', () => {
        console.log(`Servidor corriendo por el puerto ${port}`);
    });
    setInterval(() => {
        if (bot_struct.start_bot_trading == 1) {
            counterTime++
            bot_struct.time++
            counterTimeHistory++
            if (counterTime >= 10 && flag_store == 1) {
                storeGeneral.put('time', bot_struct.time)
                counterTime = 0
            }
            if (counterTimeHistory >= 14400 && flag_store == 1) {
                console.log('testing');
                counterTimeHistory = 0;
                history_price.push({
                    time: Date.now(),
                    price: parseFloat(market_price),
                    current: (market_price * store.get(`${bot_struct.MARKET1}_balance`)) + store.get(`${bot_struct.MARKET2}_balance`),
                    profit: store.get('profits')
                })
                if (history_price.length > 400) history_price.shift();
            }
        }
    }, 1000);
    //let rr = await getFillsAll('ETH-USDT', 'sell')
    //console.log(rr.data.items);
    loop();
}

setup();