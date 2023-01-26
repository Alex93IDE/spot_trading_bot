const axios = require('axios').default
const urlencode = require('urlencode')
const { log } = require('../utils/logger')

const NotifyTelegram = async (data) => {
    const b = "`"
    const content = urlencode(`
    ${b + b + b}
    ${data.from === 'buy' ? '🟢' : data.from === 'sell' ? '🔴' : '🔵'} ${data.start}
    ${b + b + b}
__Duración:__ ${data.runningTime}\\
__Mercado:__ ${data.market}\\
__Precio ${data.market1}:__ ${data.price}\\
__Saldo ${data.market1}:__ ${data.balance1}\\
__Saldo ${data.market2}:__ ${parseFloat(data.balance2).toFixed(2)}\\
__Profits:__ ${parseFloat(data.gridProfits).toFixed(2)} ${data.market2}\\
__Total:__ ${data.current} ${data.market2}`).replace(/\./g, '\\.')

    try {
        await axios.get(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_ID}/sendMessage?chat_id=${process.env.TELEGRAM_CHAT_ID}&parse_mode=MarkdownV2&text=${content}`)
    } catch (err) {
        log(err)
    }
}

module.exports = {
    NotifyTelegram
}