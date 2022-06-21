const { Router } = require('express');
const ruta = Router();

const { home, restart } = require('./Controllers/app')

ruta.get('/', home)
ruta.get('/restart', restart)

module.exports = ruta;