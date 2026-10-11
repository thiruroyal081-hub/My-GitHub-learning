"""Local Flask backend for the ThiruTrade demo dashboard.

Read-only market data only. This application deliberately contains no order routes.
Set GROWW_ACCESS_TOKEN, or GROWW_API_KEY and GROWW_API_SECRET, in the environment; never commit credentials.
"""
import os
from flask import Flask, jsonify, send_from_directory
from growwapi import GrowwAPI

ROOT = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, static_folder=ROOT, static_url_path="")

# Only instruments shown on the Explore page are queried.
STOCK_SYMBOLS = {
    "RELIANCE": "NSE_RELIANCE",
    "HDFCBANK": "NSE_HDFCBANK",
    "TCS": "NSE_TCS",
    "INFY": "NSE_INFY",
    "ICICIBANK": "NSE_ICICIBANK",
    "BHARTIARTL": "NSE_BHARTIARTL",
    "TATAMOTORS": "NSE_TATAMOTORS",
    "SBIN": "NSE_SBIN",
    "ITC": "NSE_ITC",
    "LT": "NSE_LT",
    "MARUTI": "NSE_MARUTI",
    "ONGC": "NSE_ONGC",
}


@app.get("/")
def home():
    return send_from_directory(ROOT, "index.html")


def get_groww_client():
    """Create a Groww client using an access token or official API key/secret flow."""
    token = os.getenv("GROWW_ACCESS_TOKEN", "").strip()
    if token:
        return GrowwAPI(token)

    api_key = os.getenv("GROWW_API_KEY", "").strip()
    api_secret = os.getenv("GROWW_API_SECRET", "").strip()
    if api_key and api_secret:
        token_response = GrowwAPI.get_access_token(api_key=api_key, secret=api_secret)
        if isinstance(token_response, dict):
            token = token_response.get("access_token") or token_response.get("token")
        elif isinstance(token_response, str):
            token = token_response
        if token:
            return GrowwAPI(token)
    return None


@app.get("/api/health")
def health():
    configured = bool(os.getenv("GROWW_ACCESS_TOKEN")) or (
        bool(os.getenv("GROWW_API_KEY")) and bool(os.getenv("GROWW_API_SECRET"))
    )
    return jsonify({"ok": True, "mode": "configured" if configured else "demo"})


@app.get("/api/market")
def market():
    try:
        groww = get_groww_client()
        if groww is None:
            return jsonify({
                "mode": "demo",
                "message": "Configure GROWW_ACCESS_TOKEN or GROWW_API_KEY and GROWW_API_SECRET in the backend environment.",
                "prices": {},
                "changes": {},
                "indices": {},
            })
        request_symbols = tuple(STOCK_SYMBOLS.values()) + ("NSE_NIFTY", "BSE_SENSEX")
        response = groww.get_ltp(
            segment=GrowwAPI.SEGMENT_CASH,
            exchange_trading_symbols=request_symbols,
        )
        # SDK examples show a direct symbol-to-price mapping. Accept a nested
        # {"ltp": {...}} response as well for SDK-version compatibility.
        raw = response.get("ltp", response) if isinstance(response, dict) else {}
        if not isinstance(raw, dict):
            raw = {}

        prices = {}
        changes = {}
        indices = {}
        index_changes = {}

        for symbol, exchange_symbol in STOCK_SYMBOLS.items():
            value = raw.get(exchange_symbol)
            if isinstance(value, dict):
                value = value.get("ltp") or value.get("value")
            try:
                price = float(value)
                if price > 0:
                    prices[symbol] = price
            except (TypeError, ValueError):
                continue

            # Fetch quote metadata so the daily change is also real, not the
            # static illustrative percentage used in demo mode.
            try:
                quote = groww.get_quote(
                    exchange=GrowwAPI.EXCHANGE_NSE,
                    segment=GrowwAPI.SEGMENT_CASH,
                    trading_symbol=symbol,
                )
                if isinstance(quote, dict):
                    day_change = quote.get("day_change_perc")
                    if day_change is not None:
                        changes[symbol] = float(day_change)
            except Exception:
                # A missing quote detail should not invalidate a valid LTP.
                continue

        for key, label, exchange, trading_symbol in (
            ("NSE_NIFTY", "NIFTY", GrowwAPI.EXCHANGE_NSE, "NIFTY"),
            ("BSE_SENSEX", "SENSEX", GrowwAPI.EXCHANGE_BSE, "SENSEX"),
        ):
            value = raw.get(key)
            if isinstance(value, dict):
                value = value.get("ltp") or value.get("value")
            try:
                index_price = float(value)
                if index_price > 0:
                    indices[label] = index_price
            except (TypeError, ValueError):
                continue
            try:
                quote = groww.get_quote(
                    exchange=exchange,
                    segment=GrowwAPI.SEGMENT_CASH,
                    trading_symbol=trading_symbol,
                )
                if isinstance(quote, dict) and quote.get("day_change_perc") is not None:
                    index_changes[label] = float(quote["day_change_perc"])
            except Exception:
                continue

        if not prices and not indices:
            return jsonify({
                "mode": "demo",
                "message": "No supported quotes were returned. Check API access and symbol names.",
                "prices": {}, "changes": {}, "indices": {},
            })
        return jsonify({
            "mode": "live",
            "prices": prices,
            "changes": changes,
            "indices": indices,
            "index_changes": index_changes,
        })
    except Exception as exc:
        app.logger.warning("Groww market-data request failed: %s", type(exc).__name__)
        return jsonify({
            "mode": "demo",
            "message": "Groww market data is unavailable. The page is showing sample prices.",
            "prices": {}, "changes": {}, "indices": {},
        })


if __name__ == "__main__":
    # Local development only. Do not expose this development server to the internet.
    app.run(host="127.0.0.1", port=int(os.getenv("PORT", "5000")), debug=False)

# Read-only F&O data endpoints. No order-placement routes are exposed.
from datetime import datetime, timezone
from flask import request

FNO_UNDERLYINGS = {
    "NIFTY": ("NSE", GrowwAPI.EXCHANGE_NSE),
    "BANKNIFTY": ("NSE", GrowwAPI.EXCHANGE_NSE),
    "FINNIFTY": ("NSE", GrowwAPI.EXCHANGE_NSE),
    "SENSEX": ("BSE", GrowwAPI.EXCHANGE_BSE),
}

def _fno_client():
    client = get_groww_client()
    if client is None:
        return None
    return client

@app.get("/api/fno/market")
def fno_market():
    try:
        client = _fno_client()
        if client is None:
            return jsonify({"mode": "demo", "message": "Backend API credentials are not configured."}), 503
        indices = {}
        for symbol, exchange in (("NIFTY", GrowwAPI.EXCHANGE_NSE), ("SENSEX", GrowwAPI.EXCHANGE_BSE)):
            try:
                quote = client.get_quote(exchange=exchange, segment=GrowwAPI.SEGMENT_CASH, trading_symbol=symbol)
                value = quote.get("ltp") if isinstance(quote, dict) else None
                if value is not None:
                    indices[symbol] = float(value)
            except Exception:
                app.logger.info("Index quote unavailable for %s", symbol)
        if not indices:
            return jsonify({"mode": "demo", "message": "No live index quotes returned."}), 502
        return jsonify({"mode": "live", "indices": indices, "timestamp": datetime.now(timezone.utc).isoformat()})
    except Exception:
        return jsonify({"mode": "demo", "message": "Market-data request failed; no sample values are presented as live."}), 502

@app.get("/api/fno/expiries")
def fno_expiries():
    underlying = request.args.get("underlying", "NIFTY").upper()
    if underlying not in FNO_UNDERLYINGS:
        return jsonify({"message": "Unsupported underlying."}), 400
    try:
        client = _fno_client()
        if client is None:
            return jsonify({"message": "Configure authorised Groww API credentials on the backend first."}), 503
        exchange = FNO_UNDERLYINGS[underlying][1]
        result = client.get_expiries(exchange=exchange, underlying_symbol=underlying)
        expiries = result.get("expiries", []) if isinstance(result, dict) else []
        today = datetime.now().date().isoformat()
        expiries = sorted([str(x) for x in expiries if str(x) >= today])
        return jsonify({"expiries": expiries, "timestamp": datetime.now(timezone.utc).isoformat()})
    except Exception as exc:
        app.logger.warning("F&O expiries unavailable: %s", type(exc).__name__)
        return jsonify({"message": "Expiry lookup failed. Check API access and the installed Groww SDK version."}), 502

@app.get("/api/fno/option-chain")
def fno_option_chain():
    underlying = request.args.get("underlying", "NIFTY").upper()
    expiry = request.args.get("expiry", "")
    if underlying not in FNO_UNDERLYINGS:
        return jsonify({"message": "Unsupported underlying."}), 400
    try:
        parsed = datetime.strptime(expiry, "%Y-%m-%d").date()
        if parsed < datetime.now().date():
            return jsonify({"message": "Choose a current or future expiry."}), 400
    except ValueError:
        return jsonify({"message": "Expiry must be YYYY-MM-DD."}), 400
    try:
        client = _fno_client()
        if client is None:
            return jsonify({"message": "Configure authorised Groww API credentials on the backend first."}), 503
        result = client.get_option_chain(
            exchange=FNO_UNDERLYINGS[underlying][1],
            underlying=underlying,
            expiry_date=expiry,
        )
        if not isinstance(result, dict) or not isinstance(result.get("strikes"), dict):
            return jsonify({"message": "The API did not return a supported option-chain payload."}), 502
        return jsonify({
            "underlying_ltp": result.get("underlying_ltp"),
            "strikes": result["strikes"],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
    except Exception as exc:
        app.logger.warning("F&O option chain unavailable: %s", type(exc).__name__)
        return jsonify({"message": "Option-chain lookup failed. Confirm your subscription, API permissions and SDK version."}), 502

