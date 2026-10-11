# Python Paper Trading Bot

A beginner-friendly **paper trading simulator** for learning Python and basic trading workflow.

## Safety notice

- This is a local simulation only. It does **not** connect to Upstox or any broker.
- It does **not** use live market prices and cannot place real orders.
- `sample_prices.csv` contains fictional demo prices for learning only.
- Results are simulated and are not investment advice or evidence of a profitable strategy.

## Features

- Starts with ₹1,00,000 virtual cash.
- Simulated BUY and SELL orders.
- Checks available virtual cash.
- Limits each order to ₹20,000.
- Limits each symbol's position value to ₹20,000.
- Limits total invested market value to ₹80,000.
- Disables short selling.
- Tracks average purchase price, realized P/L and unrealized P/L.
- Saves the demo portfolio locally in `portfolio.json`.
- Records simulated orders in `trades.csv`.
- Uses only Python's standard library; no package installation is required.

## Run on macOS

Open Terminal and run:

```bash
mkdir -p ~/paper-trading-bot
cd ~/paper-trading-bot
python3 -m venv .venv
source .venv/bin/activate
python3 main.py
```

If the files are in a different folder, first change directory to that folder.

## Menu

1. View demo prices
2. Paper BUY
3. Paper SELL
4. View portfolio and P/L
5. View recent trade history
6. Reset demo portfolio
0. Exit

Choose `1` to view fictional symbols. Choose `2` to simulate a purchase. Choose `4` to see your portfolio and P/L.

## Change demo prices

Edit `sample_prices.csv` in a text editor. These prices are intentionally fictional. Restart the program after changing them.

## Files created while running

- `portfolio.json`: local virtual cash and open positions.
- `trades.csv`: local simulation trade log.

These files are excluded from Git by `.gitignore` so your demo activity is not uploaded by accident.

## Risk-control limitations

This is a learning example, not a production trading engine. Limits are simple fixed rules. It does not implement stop-loss orders, real-time quotes, market hours, exchange lot sizes, brokerage/taxes, slippage, or broker order handling. Do not connect it to a live account or use it for real-money trading.
