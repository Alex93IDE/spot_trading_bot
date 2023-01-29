const axios = require('axios').default
const urlencode = require('urlencode')
const { log } = require('../utils/logger')

const NotifyTelegram = async (data) => {
    const b = "`"
    const content = urlencode(`
    ${b + b + b}
    ${data.from === 'buy' ? '🟢' : data.from === 'sell' ? '🔴' : '🔵'} ${data.start}
    ${b + b + b}
*${data.market}*\\
*Precio ${data.market1}:* ${data.price}\\
*${data.market1}:* ${data.balance1}\\
*${data.market2}:* ${parseFloat(data.balance2).toFixed(2)}\\
*Profits:* ${parseFloat(data.gridProfits).toFixed(2)} ${data.market2}\\
*Total:* ${data.current} ${data.market2}\\
${b + b + b} ${data.runningTime} ${b + b + b}`).replace(/\./g, '\\.')

    try {
        await axios.get(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_ID}/sendMessage?chat_id=${process.env.TELEGRAM_CHAT_ID}&parse_mode=MarkdownV2&text=${content}`)
    } catch (err) {
        log(err)
    }
}

module.exports = {
    NotifyTelegram
}