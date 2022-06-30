const API = require('../services/kucoin')
const { log, logColor, colors } = require('./logger')

var bot_struct = {
    MARKET: '',
    MARKET1: '',
    MARKET2: '',
    start_bot_trading: 0,
    base_quote: 0,
    time: 0,
}

async function getBalance(coin) {
    var res = await API.rest.User.Account.getAccountsList({
        type: 'trade',
        currency: coin
    })
    let value = -1
    if (res.data[0] == null) {
        value = 0;
    } else {
        value = +res.data[0].available
    }
    return value
}

async function getBaseSize(coin, cant) {  //Devuelve la cantidad exacta de monedas segun su base
    let r = await API.rest.Market.Symbols.getSymbolsList()
    let base = 0;
    let valor_de_operacion = 0;
    for (let index = 0; index < r.data.length; index++) {
        if (r.data[index].symbol == coin + '-USDT')
            base = +r.data[index].baseIncrement;
    }
    if (base != 0) {
        let contador = 0;
        let valor = 0;
        while (base != 1) {
            base = base * 10;
            contador++;
        }
        valor = Math.pow(10, contador);
        valor_de_operacion = Math.floor(cant * valor);
        valor_de_operacion = valor_de_operacion / valor;
        return valor_de_operacion;
    }
}

async function getPriceMarket(symbol) {
    var res = await API.rest.Market.Symbols.get24hrStats(symbol)
    return parseFloat(res.data.last)
}

async function _buy(baseParams = {}, orderParams = {}) {
    var res = await API.rest.Trade.Orders.postOrder(baseParams, orderParams)
    log(res)
    return res
}

async function _sell(baseParams = {}, orderParams = {}) {
    var res = await API.rest.Trade.Orders.postOrder(baseParams, orderParams)
    log(res)
    return res
}

async function getFillsId(symbol, side, orderId) {
    var res = await API.rest.Trade.Fills.getFillsList('TRADE', {
        orderId: orderId,
        symbol: symbol,
        side: side
    })
    return res
}

async function getFillsAll(symbol, side) {
    var res = await API.rest.Trade.Fills.getFillsList('TRADE', {
        symbol: symbol,
        side: side
    })
    return res
}

module.exports = {
    bot_struct,
    getBalance,
    getPriceMarket,
    _buy,
    _sell,
    getFillsId,
    getBaseSize,
    getFillsAll
}
