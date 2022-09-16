const { Router } = require('express');
const ruta = Router();

const { home, restart, process_bot, percent, commandTerminal, commandTerminalDeleteData } = require('./Controllers/app');
const { placeOrder } = require('./Controllers/kucoin');

ruta.get('/', home)
ruta.get('/restart', restart)
ruta.get('/bot', process_bot)
ruta.post('/percent', percent)
ruta.get('/restart/data', commandTerminalDeleteData)

ruta.post('/bot/order/create', placeOrder)

ruta.get('/restart/bot', (req, res) => {
    setTimeout(() => {
        process.exit()
    }, 1000);
    res.json('done')
})

module.exports = ruta;