# Spot_trading_bot

Trading bot in the spot market on Kucoin with market orders.
It is initialized and configured through the HTTP(GET and POST) methods.

# Bot methods

1.  ## Start Bot:

         GET('/bot?status=start&symbol=BTC-USDT&fund=10')

    - status: 'start', start the bot from scratch.
    - symbol: real pairs on kucoin(example: ETH-USDT).
    - fund: amount in usd per operation.

2.  ## Continue Bot:

         GET('/bot?status=continue&symbol=BTC-USDT&fund=10')

    - start the bot if you already have trades done with the chosen symbol.

3.  ## Stop Bot:

         GET('/bot?status=stop&symbol=BTC-USDT')

    - stop the bot.

4.  ## Change Percent Bot:

         POST('/bot/percent',{
            "buy": 1,
            "sell": 1,
         })

    - Change the buy and sell percentage

5.  ## Change Funds Bot:
        POST('/bot/funds',{
            "fund": 15
        })
    - Change the funds by operation

# Configuration

Go to **./sevices**, create a **_config.json_** file, and add:

    {
        "baseUrl": "https://api.kucoin.com",
        "apiAuth": {
            "key": "key_api",
            "secret": "secret_key_api",
            "passphrase": "passphrase_api"
        },
        "authVersion": 2
    }

## .evn

    {
        NOTIFY_TELEGRAM=1
        NOTIFY_TELEGRAM_ON=sell,buy,withdraw
        TELEGRAM_BOT_ID="token"
        TELEGRAM_CHAT_ID="id_chat"
    }

# Frontend


![Texto alternativo](/docu/1.png)

![Texto alternativo](/docu/2.png)

![Texto alternativo](/docu/3.png)

***The current version of the frontend provides a more convenient way to visualize data. In future versions, it will offer additional functionality to configure the bot directly from the frontend.***