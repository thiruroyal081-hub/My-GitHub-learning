# Python F&O Paper Trading Simulator (Groww-compatible)

Beginner-friendly paper simulator for NIFTY and SENSEX index options (CE/PE) and futures. It uses ₹1,00,000 virtual cash and saves positions/trades locally.

## Safety first
- **Paper trading only. This project never places, modifies or cancels a Groww order.**
- The optional Groww integration is read-only: it fetches expiry dates and the option chain's current LTP.
- Futures are manual-entry only in this version. Verify contract symbol, expiry, lot size and margin in Groww.
- For options, verify the lot size in Groww/exchange contract details. Lot sizes can change.
- The simulator does not model brokerage, taxes, slippage, spread, margin calls, exercise/settlement or realistic fill behavior. Results are educational, not investment advice.
- Do not put API tokens, passwords, API secrets or OTPs in GitHub or source code.

## macOS setup
Open Terminal and run:

```bash
cd ~/My-GitHub-learning/python-paper-trading-bot
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
python3 fno_paper.py
```

If your repository is elsewhere, change to that folder first. If the `.venv` already exists, just run the activate command.

## Menu
1. Paper BUY NIFTY/SENSEX CE/PE (Groww live option chain or manual)
2. Paper BUY NIFTY/SENSEX futures (manual contract, quote and margin)
3. Update the paper mark price for an open position
4. Close a paper position and calculate P/L
5. Portfolio and P/L
6. Recent paper trade history
7. Reset portfolio
0. Exit

## Optional Groww read-only market data
Groww's Trading API requires an active subscription and an access token. Check the current fee and API terms in your Groww account. Tokens can expire and should be kept private.

1. Install dependencies with `python3 -m pip install -r requirements.txt`.
2. In Terminal, set your token for this Terminal session only:

```bash
export GROWW_ACCESS_TOKEN='PASTE_YOUR_ACCESS_TOKEN_HERE'
python3 fno_paper.py
```

3. Choose menu option 1, select NIFTY or SENSEX, then choose Groww live option chain.
4. The app only calls the API to read expiry dates and option-chain prices. It does not call order APIs.

When finished, remove the token from the current shell with `unset GROWW_ACCESS_TOKEN`. Never paste the token into this chat or commit it to GitHub.

## Notes
- Without a token, choose manual mode and use a quote you have checked in Groww. Manual prices are only as accurate as the values you enter.
- Groww option chain may return strikes and LTP but not the lot size in the documented response; the program therefore asks you to verify and enter the current lot size.
- Futures positions require manually entered price and margin per lot. This is not a broker margin calculation.
- Local files `fno_portfolio.json` and `fno_trades.csv` store your paper positions and trade history and should not be uploaded.
