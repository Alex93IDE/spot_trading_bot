const { Router } = require('express');
const ruta = Router();

const { home, restart, process_bot, percent } = require('./Controllers/app')

ruta.get('/', home)
ruta.get('/restart', restart)
ruta.get('/bot', process_bot)
ruta.post('/percent', percent)

module.exports = ruta;