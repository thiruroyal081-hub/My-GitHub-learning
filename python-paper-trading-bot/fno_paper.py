"""
Groww-compatible F&O PAPER simulator.
Uses only virtual money. This file never calls any order-placement API.
Optional Groww API access is READ-ONLY and used only to read expiries/option-chain LTP.
"""
import csv, json, os
from datetime import datetime
from pathlib import Path

BASE = Path(__file__).resolve().parent
STATE_FILE = BASE / "fno_portfolio.json"
TRADES_FILE = BASE / "fno_trades.csv"
START_CASH = 100_000.0
MAX_NEW_RISK = 20_000.0
TOKEN_ENV = "GROWW_ACCESS_TOKEN"

def money(x):
    return f"₹{x:,.2f}"

def load_state():
    if STATE_FILE.exists():
        try:
            s = json.loads(STATE_FILE.read_text(encoding="utf-8"))
            if "cash" in s and "positions" in s:
                return s
        except (OSError, json.JSONDecodeError):
            print("Could not read saved portfolio; starting a fresh one.")
    return {"cash": START_CASH, "positions": {}}

def save_state(s):
    STATE_FILE.write_text(json.dumps(s, indent=2), encoding="utf-8")

def ensure_log():
    if not TRADES_FILE.exists():
        with TRADES_FILE.open("w", newline="", encoding="utf-8") as f:
            csv.writer(f).writerow(["time","action","contract","lots","lot_size","price","cash_change","realized_pnl","source"])

def log(action, p, lots, price, cash_change, pnl=0.0, source="MANUAL"):
    ensure_log()
    with TRADES_FILE.open("a", newline="", encoding="utf-8") as f:
        csv.writer(f).writerow([datetime.now().isoformat(timespec="seconds"), action, p["symbol"], lots,
                                p["lot_size"], f"{price:.2f}", f"{cash_change:.2f}", f"{pnl:.2f}", source])

def read_int(prompt, minimum=1):
    try:
        n = int(input(prompt).strip())
        if n < minimum:
            raise ValueError
        return n
    except ValueError:
        print(f"Enter a whole number of at least {minimum}.")
        return None

def read_float(prompt, minimum=0.01):
    try:
        n = float(input(prompt).strip())
        if n < minimum:
            raise ValueError
        return n
    except ValueError:
        print(f"Enter a number greater than or equal to {minimum}.")
        return None

def live_groww_chain(exchange, underlying, expiry):
    token = os.getenv(TOKEN_ENV, "").strip()
    if not token:
        raise RuntimeError(f"No {TOKEN_ENV} environment variable found.")
    try:
        from growwapi import GrowwAPI
    except ImportError:
        raise RuntimeError("Groww SDK not installed. Run: python3 -m pip install -r requirements.txt")
    api = GrowwAPI(token)
    exchange_code = api.EXCHANGE_NSE if exchange == "NSE" else api.EXCHANGE_BSE
    return api.get_option_chain(exchange=exchange_code, underlying=underlying, expiry_date=expiry)

def get_live_expiries(exchange, underlying):
    token = os.getenv(TOKEN_ENV, "").strip()
    if not token:
        raise RuntimeError(f"No {TOKEN_ENV} environment variable found.")
    try:
        from growwapi import GrowwAPI
    except ImportError:
        raise RuntimeError("Groww SDK not installed. Run: python3 -m pip install -r requirements.txt")
    api = GrowwAPI(token)
    exchange_code = api.EXCHANGE_NSE if exchange == "NSE" else api.EXCHANGE_BSE
    return api.get_expiries(exchange=exchange_code, underlying_symbol=underlying)

def choose_contract():
    print("\nUnderlying: 1) NIFTY (NSE)  2) SENSEX (BSE)")
    u = input("Choose 1 or 2: ").strip()
    if u not in ("1", "2"):
        print("Cancelled.")
        return None
    exchange, underlying = ("NSE", "NIFTY") if u == "1" else ("BSE", "SENSEX")
    print("Data source: 1) Groww live option chain (read-only API)  2) Enter contract manually")
    mode = input("Choose 1 or 2: ").strip()
    if mode == "1":
        try:
            ex = get_live_expiries(exchange, underlying)
            expiries = ex.get("expiries", [])
            if not expiries:
                print("Groww returned no expiries. Try manual entry or check API access.")
                return None
            print("\nAvailable expiries:")
            for i, expiry in enumerate(expiries[:30], 1):
                print(f"{i}. {expiry}")
            idx = read_int("Select expiry number: ")
            if idx is None or idx > len(expiries[:30]):
                print("Invalid expiry.")
                return None
            expiry = expiries[idx-1]
            chain = live_groww_chain(exchange, underlying, expiry)
            strikes = chain.get("strikes", {})
            rows = []
            for strike, sides in strikes.items():
                for opt_type in ("CE", "PE"):
                    item = sides.get(opt_type)
                    if item and float(item.get("ltp") or 0) > 0:
                        rows.append((float(strike), opt_type, item.get("trading_symbol", ""), float(item["ltp"])))
            if not rows:
                print("No option prices returned. Try manual entry.")
                return None
            rows.sort(key=lambda r: r[0])
            print(f"\nGroww option chain — {underlying}, expiry {expiry} (prices may change):")
            print(f"{'#':<4}{'STRIKE':>12}  {'TYPE':<5}{'LTP':>12}  CONTRACT")
            for i, row in enumerate(rows, 1):
                print(f"{i:<4}{row[0]:>12g}  {row[1]:<5}{money(row[3]):>12}  {row[2]}")
            idx = read_int("Select contract number: ")
            if idx is None or idx > len(rows):
                print("Invalid contract.")
                return None
            strike, opt_type, symbol, ltp = rows[idx-1]
            lot_size = read_int("Enter current lot size shown in Groww/exchange contract details: ")
            if lot_size is None:
                return None
            print("Verify lot size in Groww before continuing; the API chain response may not include it.")
            return {"symbol": symbol, "underlying": underlying, "exchange": exchange, "expiry": expiry,
                    "kind": "OPTION", "option_type": opt_type, "strike": strike, "lot_size": lot_size,
                    "price": ltp, "source": "GROWW_LIVE"}
        except Exception as e:
            print(f"Could not read Groww data: {e}")
            print("No orders were sent. Try manual entry or check token/subscription.")
            return None
    elif mode == "2":
        expiry = input("Expiry date (YYYY-MM-DD, verify in Groww): ").strip()
        strike = read_float("Strike price: ")
        if strike is None: return None
        opt_type = input("Option type CE or PE: ").strip().upper()
        if opt_type not in ("CE", "PE"):
            print("Enter CE or PE."); return None
        symbol = f"{exchange}-{underlying}-{expiry}-{strike:g}-{opt_type}"
        price = read_float("Option premium per unit (use a current quote or demo value): ")
        lot_size = read_int("Lot size (verify current contract details): ")
        if price is None or lot_size is None: return None
        return {"symbol": symbol, "underlying": underlying, "exchange": exchange, "expiry": expiry,
                "kind": "OPTION", "option_type": opt_type, "strike": strike, "lot_size": lot_size,
                "price": price, "source": "MANUAL"}
    print("Cancelled.")
    return None

def buy_option(state):
    p = choose_contract()
    if not p: return
    lots = read_int("Number of lots to paper BUY: ")
    if lots is None: return
    cost = p["price"] * p["lot_size"] * lots
    if cost > MAX_NEW_RISK:
        print(f"Risk check: order premium {money(cost)} exceeds ₹20,000 per new trade.")
        return
    if cost > state["cash"]:
        print(f"Not enough virtual cash. Available {money(state['cash'])}.")
        return
    p["lots"] = lots
    p["avg_price"] = p["price"]
    p["last_price"] = p["price"]
    p["margin_per_lot"] = 0
    existing = state["positions"].get(p["symbol"])
    if existing:
        total_lots = existing["lots"] + lots
        p["avg_price"] = (existing["avg_price"]*existing["lots"] + p["price"]*lots)/total_lots
        p["lots"] = total_lots
    state["positions"][p["symbol"]] = p
    state["cash"] -= cost
    save_state(state); log("PAPER_BUY", p, lots, p["price"], -cost, source=p["source"])
    print(f"Paper BUY saved: {lots} lot(s), {p['symbol']} at {money(p['price'])}. Premium used: {money(cost)}.")
    print("Simulation only: no Groww order was placed.")

def buy_future(state):
    print("\nMANUAL FUTURES PAPER TRADE (no live quote integration here)")
    print("Use only a verified current Groww contract, expiry, lot size and estimated margin.")
    underlying = input("Underlying (NIFTY/SENSEX): ").strip().upper()
    if underlying not in ("NIFTY", "SENSEX"):
        print("Enter NIFTY or SENSEX."); return
    exchange = "NSE" if underlying == "NIFTY" else "BSE"
    expiry = input("Expiry date (YYYY-MM-DD): ").strip()
    symbol = input("Exact futures contract symbol from Groww: ").strip().upper()
    price = read_float("Current futures price per unit: ")
    lot_size = read_int("Current lot size (verify in Groww): ")
    lots = read_int("Number of lots: ")
    margin = read_float("Estimated margin required per lot (verify with Groww): ")
    if not all([price, lot_size, lots, margin]): return
    total_margin = margin * lots
    if total_margin > MAX_NEW_RISK:
        print(f"Risk check: margin {money(total_margin)} exceeds ₹20,000 per new trade."); return
    if total_margin > state["cash"]:
        print("Not enough virtual cash for this simulated margin."); return
    p = {"symbol": symbol, "underlying": underlying, "exchange": exchange, "expiry": expiry,
         "kind": "FUTURE", "option_type": "FUT", "strike": 0, "lot_size": lot_size,
         "price": price, "lots": lots, "avg_price": price, "last_price": price,
         "margin_per_lot": margin, "source": "MANUAL"}
    if symbol in state["positions"]:
        print("That contract is already open. Use the mark-price menu or close it first."); return
    state["positions"][symbol] = p
    state["cash"] -= total_margin
    save_state(state); log("PAPER_BUY_FUTURE", p, lots, price, -total_margin, source="MANUAL")
    print(f"Paper futures position opened. Virtual margin reserved: {money(total_margin)}.")
    print("Simulation only: no Groww order was placed.")

def mark_price(state):
    if not state["positions"]:
        print("No open positions."); return
    items = list(state["positions"].items())
    for i, (symbol, p) in enumerate(items, 1):
        print(f"{i}. {symbol} | {p['kind']} | {p['lots']} lot(s) | last mark {money(p['last_price'])}")
    idx = read_int("Choose position number to update mark price: ")
    if idx is None or idx > len(items): print("Invalid selection."); return
    symbol, p = items[idx-1]
    print("Enter a fresh quote from Groww. For manual mode this updates paper valuation only.")
    price = read_float("New price per unit: ")
    if price is None: return
    p["last_price"] = price
    save_state(state)
    print(f"Updated paper mark for {symbol} to {money(price)}. No order was sent.")

def close_position(state):
    if not state["positions"]:
        print("No open positions."); return
    items = list(state["positions"].items())
    for i, (symbol, p) in enumerate(items, 1):
        print(f"{i}. {symbol} | {p['kind']} | {p['lots']} lot(s) | mark {money(p['last_price'])}")
    idx = read_int("Choose position to close: ")
    if idx is None or idx > len(items): print("Invalid selection."); return
    symbol, p = items[idx-1]
    price = read_float(f"Exit price per unit (defaults not automatic; enter your assumed fill): ")
    if price is None: return
    units = p["lots"] * p["lot_size"]
    pnl = (price - p["avg_price"]) * units
    if p["kind"] == "OPTION":
        cash_change = price * units
    else:
        cash_change = p["margin_per_lot"] * p["lots"] + pnl
    if state["cash"] + cash_change < 0:
        print("Close rejected because it would create negative virtual cash."); return
    state["cash"] += cash_change
    del state["positions"][symbol]
    save_state(state); log("PAPER_CLOSE", p, p["lots"], price, cash_change, pnl, source="MANUAL")
    print(f"Paper position closed. Simulated P/L: {money(pnl)}.")
    print("Simulation only: no Groww order was placed.")

def portfolio(state):
    print("\nPAPER F&O PORTFOLIO")
    print(f"Available virtual cash (includes reserved futures margin deduction): {money(state['cash'])}")
    total_pnl = 0.0
    for symbol, p in state["positions"].items():
        units = p["lots"] * p["lot_size"]
        pnl = (p["last_price"] - p["avg_price"]) * units
        total_pnl += pnl
        reserved = p["margin_per_lot"] * p["lots"] if p["kind"] == "FUTURE" else p["avg_price"] * units
        print(f"\n{symbol}\n  {p['kind']} | {p['expiry']} | lots={p['lots']} x lot size {p['lot_size']}")
        print(f"  Entry {money(p['avg_price'])} | Mark {money(p['last_price'])} | P/L {money(pnl)}")
        print(f"  Cash used/reserved at entry: {money(reserved)}")
    print(f"\nUnrealized P/L (before costs/slippage): {money(total_pnl)}")
    print(f"Cash + open-position P/L: {money(state['cash'] + total_pnl)}")
    print("Note: this simplified simulator does not model brokerage, taxes, slippage, option exercise/settlement or exchange margin changes.")

def history():
    ensure_log()
    with TRADES_FILE.open("r", newline="", encoding="utf-8") as f: rows = list(csv.reader(f))
    print("\n".join(" | ".join(r) for r in rows[-15:]))

def reset():
    if input("Type RESET to erase this paper portfolio and trade log: ").strip() == "RESET":
        if STATE_FILE.exists(): STATE_FILE.unlink()
        if TRADES_FILE.exists(): TRADES_FILE.unlink()
        ensure_log()
        print("Paper portfolio reset. Starting balance is ₹1,00,000.")
    else: print("Cancelled.")

def main():
    state = load_state(); ensure_log()
    print("="*60)
    print("NIFTY / SENSEX F&O PAPER TRADING")
    print("₹1,00,000 VIRTUAL CASH — NO LIVE ORDERS")
    print("Groww connection, if configured, is read-only market data.")
    print("="*60)
    while True:
        print("\n1. Paper BUY NIFTY/SENSEX CE or PE (Groww live chain or manual)")
        print("2. Paper BUY NIFTY/SENSEX FUTURE (manual contract/price/margin)")
        print("3. Update mark price for open position")
        print("4. Close paper position and calculate P/L")
        print("5. View portfolio and P/L")
        print("6. View recent paper trade history")
        print("7. Reset paper portfolio")
        print("0. Exit")
        c = input("Choose: ").strip()
        if c == "1": buy_option(state)
        elif c == "2": buy_future(state)
        elif c == "3": mark_price(state)
        elif c == "4": close_position(state)
        elif c == "5": portfolio(state)
        elif c == "6": history()
        elif c == "7": reset(); state = load_state()
        elif c == "0": print("Saved. Exiting paper simulator."); break
        else: print("Choose one of the listed options.")

if __name__ == "__main__":
    main()
