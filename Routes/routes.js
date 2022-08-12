const { Router } = require('express');
const ruta = Router();

const { home, restart, process_bot, percent, commandTerminal, commandTerminalDeleteData } = require('./Controllers/app')

ruta.get('/', home)
ruta.get('/restart', restart)
ruta.get('/bot', process_bot)
ruta.post('/percent', percent)
ruta.post('/restart/data', commandTerminalDeleteData)

ruta.get('/restart/bot', (req, res) => {
    setTimeout(() => {
        process.exit()
    }, 1000);
    res.json('done')
})

module.exports = ruta;