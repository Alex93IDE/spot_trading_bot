const { _buy, _sell, bot_struct, getBaseSize } = require('../../utils/bot')

exports.placeOrder = async (req, res) => {
    let data = req.body
    if (data.side === 'buy') {
        const result = await _buy(
            {
                clientOid: Date.now(),
                side: 'buy',
                symbol: data.symbol,
                type: 'market',
                tradeType: 'TRADE',
            },
            { funds: data.size }
        )
        res.json(result)
    } else if (data.side === 'sell') {
        let amountToSell = await getBaseSize(data.symbol, data.size)
        const result = await _sell(
            {
                clientOid: Date.now(),
                side: 'sell',
                symbol: data.symbol,
                type: 'market',
                tradeType: 'TRADE'
            },
            { size: amountToSell }
        )
        res.json(result);
    }
}