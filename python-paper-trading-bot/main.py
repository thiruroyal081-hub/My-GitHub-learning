"""
Beginner-friendly paper trading simulator.
IMPORTANT: This program uses fictional demo prices and virtual money only.
It does not connect to a broker and cannot place real orders.
"""
import csv
import json
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
PRICES_FILE = BASE_DIR / "sample_prices.csv"
STATE_FILE = BASE_DIR / "portfolio.json"
TRADES_FILE = BASE_DIR / "trades.csv"

STARTING_CASH = 100_000.00
MAX_ORDER_VALUE = 20_000.00
MAX_PORTFOLIO_INVESTED = 80_000.00

def load_prices():
    prices = {}
    with PRICES_FILE.open("r", newline="", encoding="utf-8") as file:
        for row in csv.DictReader(file):
            prices[row["symbol"].upper()] = {"name": row["name"], "price": float(row["price"])}
    return prices

def save_state(state):
    STATE_FILE.write_text(json.dumps(state, indent=2), encoding="utf-8")

def load_state():
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            print("Warning: portfolio file could not be read. Starting a new demo portfolio.")
    return {"cash": STARTING_CASH, "positions": {}}

def ensure_trade_log():
    if not TRADES_FILE.exists():
        with TRADES_FILE.open("w", newline="", encoding="utf-8") as file:
            csv.writer(file).writerow(["timestamp", "side", "symbol", "quantity", "price", "value", "realized_pnl"])

def log_trade(side, symbol, quantity, price, value, realized_pnl=0.0):
    ensure_trade_log()
    with TRADES_FILE.open("a", newline="", encoding="utf-8") as file:
        csv.writer(file).writerow([datetime.now().isoformat(timespec="seconds"), side, symbol, quantity,
                                   f"{price:.2f}", f"{value:.2f}", f"{realized_pnl:.2f}"])

def money(value):
    return f"₹{value:,.2f}"

def invested_value(state, prices):
    return sum(pos["quantity"] * prices[symbol]["price"]
               for symbol, pos in state["positions"].items() if symbol in prices)

def show_prices(prices):
    print("\nDEMO PRICE LIST (fictional sample prices; not live market data)")
    print("-" * 62)
    print(f"{'SYMBOL':<12}{'NAME':<28}{'DEMO PRICE':>18}")
    for symbol, item in prices.items():
        print(f"{symbol:<12}{item['name']:<28}{money(item['price']):>18}")
    print("-" * 62)

def show_portfolio(state, prices):
    print("\nYOUR PAPER PORTFOLIO")
    print("-" * 72)
    print(f"Available virtual cash: {money(state['cash'])}")
    total_cost = market_value = 0.0
    if not state["positions"]:
        print("No open positions yet. Choose Buy to simulate your first order.")
    else:
        print(f"{'SYMBOL':<12}{'QTY':>7}{'AVG COST':>16}{'MARKET VALUE':>18}{'UNREALIZED P/L':>19}")
        for symbol, pos in sorted(state["positions"].items()):
            if pos["quantity"] <= 0:
                continue
            current_price = prices[symbol]["price"]
            cost = pos["quantity"] * pos["average_price"]
            value = pos["quantity"] * current_price
            total_cost += cost
            market_value += value
            print(f"{symbol:<12}{pos['quantity']:>7}{money(pos['average_price']):>16}{money(value):>18}{money(value-cost):>19}")
    total_value = state["cash"] + market_value
    print("-" * 72)
    print(f"Invested cost: {money(total_cost)}")
    print(f"Current demo market value: {money(market_value)}")
    print(f"Unrealized P/L: {money(market_value-total_cost)}")
    print(f"Total portfolio value: {money(total_value)}")
    print(f"Overall P/L vs starting cash: {money(total_value-STARTING_CASH)}")

def get_positive_int(prompt):
    try:
        number = int(input(prompt).strip())
        if number <= 0:
            raise ValueError
        return number
    except ValueError:
        print("Please enter a whole number greater than zero.")
        return None

def buy(state, prices):
    show_prices(prices)
    symbol = input("Enter symbol to BUY (e.g. DEMO1), or press Enter to cancel: ").strip().upper()
    if not symbol:
        return
    if symbol not in prices:
        print("Symbol not found in sample_prices.csv.")
        return
    quantity = get_positive_int("Quantity to buy: ")
    if quantity is None:
        return
    price = prices[symbol]["price"]
    order_value = quantity * price
    current_invested = invested_value(state, prices)
    current_position_value = state["positions"].get(symbol, {}).get("quantity", 0) * price
    if order_value > MAX_ORDER_VALUE:
        print(f"Risk check blocked: order value {money(order_value)} exceeds per-order limit {money(MAX_ORDER_VALUE)}.")
        return
    if current_invested + order_value > MAX_PORTFOLIO_INVESTED:
        print(f"Risk check blocked: total invested value would exceed {money(MAX_PORTFOLIO_INVESTED)}.")
        return
    if current_position_value + order_value > MAX_ORDER_VALUE:
        print(f"Risk check blocked: this symbol's position would exceed {money(MAX_ORDER_VALUE)}.")
        return
    if order_value > state["cash"]:
        print(f"Not enough virtual cash. Available: {money(state['cash'])}.")
        return
    old = state["positions"].get(symbol, {"quantity": 0, "average_price": 0.0})
    new_quantity = old["quantity"] + quantity
    new_average = ((old["quantity"] * old["average_price"]) + order_value) / new_quantity
    state["positions"][symbol] = {"quantity": new_quantity, "average_price": round(new_average, 4)}
    state["cash"] -= order_value
    save_state(state)
    log_trade("BUY", symbol, quantity, price, order_value)
    print(f"Paper BUY complete: {quantity} {symbol} at {money(price)}. Order value: {money(order_value)}.")
    print("No real order was sent to any broker.")

def sell(state, prices):
    if not state["positions"]:
        print("You have no positions to sell.")
        return
    print("\nOpen positions:")
    for symbol, pos in sorted(state["positions"].items()):
        if pos["quantity"] > 0:
            print(f"  {symbol}: {pos['quantity']} shares")
    symbol = input("Enter symbol to SELL, or press Enter to cancel: ").strip().upper()
    if not symbol:
        return
    if symbol not in state["positions"] or state["positions"][symbol]["quantity"] <= 0:
        print("You do not own that symbol in this paper portfolio.")
        return
    quantity = get_positive_int("Quantity to sell: ")
    if quantity is None:
        return
    position = state["positions"][symbol]
    if quantity > position["quantity"]:
        print(f"Risk check blocked: you own only {position['quantity']} shares. Short selling is disabled.")
        return
    price = prices[symbol]["price"]
    proceeds = quantity * price
    realized_pnl = quantity * (price - position["average_price"])
    state["cash"] += proceeds
    position["quantity"] -= quantity
    if position["quantity"] == 0:
        del state["positions"][symbol]
    save_state(state)
    log_trade("SELL", symbol, quantity, price, proceeds, realized_pnl)
    print(f"Paper SELL complete: {quantity} {symbol} at {money(price)}.")
    print(f"Simulated realized P/L: {money(realized_pnl)}.")
    print("No real order was sent to any broker.")

def show_trade_history():
    ensure_trade_log()
    print("\nPAPER TRADE HISTORY")
    print("-" * 90)
    with TRADES_FILE.open("r", newline="", encoding="utf-8") as file:
        rows = list(csv.reader(file))
    if len(rows) <= 1:
        print("No simulated trades yet.")
        return
    for row in rows[-11:]:
        print(" | ".join(row))
    print("-" * 90)

def reset_demo():
    answer = input("Reset virtual cash and delete this demo's trade history? Type RESET to confirm: ").strip()
    if answer == "RESET":
        if STATE_FILE.exists():
            STATE_FILE.unlink()
        if TRADES_FILE.exists():
            TRADES_FILE.unlink()
        ensure_trade_log()
        print("Demo portfolio reset to ₹1,00,000. This cannot be undone.")
    else:
        print("Reset cancelled.")

def main():
    prices = load_prices()
    state = load_state()
    ensure_trade_log()
    print("=" * 54)
    print("PYTHON PAPER TRADING BOT")
    print("SIMULATION ONLY — NO LIVE BROKER CONNECTION")
    print(f"Starting virtual balance: {money(STARTING_CASH)}")
    print("=" * 54)
    while True:
        print("\nChoose an action:")
        print("1. View demo prices")
        print("2. Paper BUY")
        print("3. Paper SELL")
        print("4. View portfolio and P/L")
        print("5. View recent trade history")
        print("6. Reset demo portfolio")
        print("0. Exit")
        choice = input("Your choice: ").strip()
        if choice == "1":
            show_prices(prices)
        elif choice == "2":
            buy(state, prices)
        elif choice == "3":
            sell(state, prices)
        elif choice == "4":
            show_portfolio(state, prices)
        elif choice == "5":
            show_trade_history()
        elif choice == "6":
            reset_demo()
            state = load_state()
        elif choice == "0":
            print("Exiting paper trading bot. Your demo portfolio is saved.")
            break
        else:
            print("Please choose one of the listed options.")

if __name__ == "__main__":
    main()
