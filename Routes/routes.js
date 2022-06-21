const { Router } = require('express');
const ruta = Router();

const { home, restart, process_bot } = require('./Controllers/app')

ruta.get('/', home)
ruta.get('/restart', restart)
ruta.get('/bot', process_bot)

module.exports = ruta;