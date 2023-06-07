const { _buy, _sell, bot_struct, getBaseSize, getOrder, getFillsAll, getBalance } = require('../../utils/bot')
const { v4: uuidv4 } = require('uuid')

exports.placeOrder = async (req, res) => {
    let data = req.body
    if (data.side === 'buy') {
        const result = await _buy(
            {
                clientOid: uuidv4(),
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
                clientOid: uuidv4(),
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

exports.getOrder = async (req, res) => {
    let data = req.params.id;
    const result = await getOrder(data);
    res.json(result)
}

exports.getFillsAll = async (req, res) => {
    let data = req.params.symbol;
    const result = await getFillsAll(data);
    res.json(result)
}

exports.getOneBalance = async (req, res) => { 
    const data = req.params.coin;
    const result = await getBalance(data);
    res.json(result)
}