const Storage = require('node-storage')
const { bot_struct } = require('../../utils/bot')

exports.home = function home(req, res) {
    let store = new Storage(`./data/${bot_struct.MARKET}.json`)
    let system = (bot_struct.start_bot_trading) ? 'ENCENDIDO' : 'DETENIDO'
    res.json({
        system: system,
        store: store.store
    })
}

exports.restart = function restart(req, res) {
    setTimeout(() => {
        process.exit()
    }, 1000);
    res.json("done")
}