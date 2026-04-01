# Spot Trading Bot

Automated grid-style trading bot for the KuCoin spot market. It places **market orders** when the price drops by a configurable percentage (buy) and sells when the price recovers by another percentage (sell), accumulating profits over time.

Controlled entirely through HTTP endpoints (GET/POST). Includes a built-in web frontend and optional Telegram notifications.

---

## How it works

1. The bot polls the market price every **30 seconds**.
2. If the price drops ≥ `buy%` from the last reference price, it places a market buy order using the configured fund amount.
3. Each open order has a target sell price (`buy_price + sell%`). When the market price reaches or exceeds that target, all qualifying orders are sold in a single market sell.
4. Profits are calculated per order (net of exchange fees) and accumulated.
5. Price history is recorded every **4 hours** for charting in the frontend.

Default thresholds: **buy at −1.5%**, **sell at +1%**.

---

## Requirements

- Node.js >= 14
- A KuCoin account with API credentials (key, secret, passphrase)

---

## Installation

```bash
git clone <repo-url>
cd spot_trading_bot
npm install
```

Or use the included script:

```bash
bash startscript
```

---

## Configuration

### 1. KuCoin API — `./services/config.json`

Create the file `services/config.json` (it is git-ignored):

```json
{
    "baseUrl": "https://api.kucoin.com",
    "apiAuth": {
        "key": "your_api_key",
        "secret": "your_secret_key",
        "passphrase": "your_passphrase"
    },
    "authVersion": 2
}
```

### 2. Environment variables — `.env`

Create a `.env` file in the project root (it is git-ignored):

```env
NOTIFY_TELEGRAM=1
NOTIFY_TELEGRAM_ON=sell,buy,withdraw
TELEGRAM_BOT_ID=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

Set `NOTIFY_TELEGRAM=0` to disable notifications. `NOTIFY_TELEGRAM_ON` accepts a comma-separated list of events: `buy`, `sell`, `withdraw`.

---

## Running

```bash
npm start
```

The server starts on port **8080**. The frontend is accessible at `http://localhost:8080`.

---

## API Reference

### Bot control

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bot?status=start&symbol=BTC-USDT&fund=10` | Start the bot from scratch (resets all data for the symbol) |
| GET | `/bot?status=continue&symbol=BTC-USDT&fund=10` | Resume the bot keeping existing trade history |
| GET | `/bot?status=stop&symbol=BTC-USDT` | Stop the bot |
| POST | `/bot/percent` | Change buy/sell percentages |
| POST | `/bot/funds` | Change fund amount per operation |
| POST | `/bot/order/create` | Place a manual market order |
| GET | `/bot/balance/:coin` | Get available balance for a coin (e.g. `/bot/balance/BTC`) |

**Query parameters for start/continue:**
- `symbol` — KuCoin trading pair (e.g. `ETH-USDT`)
- `fund` — Amount in quote currency (USDT) per buy operation

**POST `/bot/percent` body:**
```json
{
    "buy": 1.5,
    "sell": 1
}
```

**POST `/bot/funds` body:**
```json
{
    "fund": 15
}
```

**POST `/bot/order/create` body:**
```json
{
    "side": "buy",
    "symbol": "BTC-USDT",
    "size": 10
}
```

---

### Status & data

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api` | Full bot status: price, balances, open orders, profits, uptime |
| GET | `/order/:id` | Get a single order by its clientOid |
| GET | `/order/fillAll/:symbol` | Get all fills for a symbol (e.g. `/order/fillAll/BTC-USDT`) |

---

### Maintenance

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/restart/data` | Delete all stored data files (`./data/` folder) |
| GET | `/restart/bot` | Restart the bot process |

---

## Data storage

Trade data is persisted locally in JSON files under `./data/` (git-ignored):

- `./data/<SYMBOL>.json` — open orders, sold orders, balances, profits, price history for the active symbol
- `./data/general.json` — total elapsed running time

---

## Frontend

The built frontend (`./dist/`) is served automatically at the root URL and provides a real-time dashboard to monitor the bot.

![Dashboard overview](/docu/1.png)

![Orders and trades](/docu/2.png)

![Price history chart](/docu/3.png)

> The current version of the frontend provides a convenient way to visualize data. Future versions will allow configuring the bot directly from the interface.

---

## Project structure

```
spot_trading_bot/
├── app.js                      # Main server + trading loop
├── Routes/
│   ├── routes.js               # Express route definitions
│   └── Controllers/
│       ├── app.js              # Bot control handlers
│       └── kucoin.js           # Order and balance handlers
├── services/
│   ├── kucoin.js               # KuCoin SDK initialization
│   ├── telegram.js             # Telegram notification sender
│   └── config.json             # (git-ignored) API credentials
├── utils/
│   ├── bot.js                  # Bot state struct + KuCoin API wrappers
│   └── logger.js               # Colored console logger
├── dist/                       # Built frontend (static files)
├── docu/                       # Screenshots for documentation
├── startscript                 # Pull + install + start script
└── .env                        # (git-ignored) Environment variables
```
