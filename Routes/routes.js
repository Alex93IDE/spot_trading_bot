const { Router } = require('express');
const ruta = Router();

const { home, process_bot, percent, commandTerminalDeleteData, funds } = require('./Controllers/app');
const { placeOrder, getOrder, getFillsAll } = require('./Controllers/kucoin');

ruta.get('/api', home)

//Bot
ruta.get('/bot', process_bot)
ruta.post('/bot/percent', percent)
ruta.post('/bot/funds', funds)
ruta.post('/bot/order/create', placeOrder)

//Kucoin
ruta.get('/order/:id', getOrder)
ruta.get('/order/fillAll/:symbol', getFillsAll)

//Reset
ruta.get('/restart/data', commandTerminalDeleteData)
ruta.get('/restart/bot', (req, res) => {
    setTimeout(() => {
        process.exit()
    }, 1000);
    res.json('done')
})

module.exports = ruta;