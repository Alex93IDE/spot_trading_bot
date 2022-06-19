const { Router } = require('express');
const ruta = Router();

const { home } = require('./Controllers/app')

ruta.get('/', home)

module.exports = ruta;