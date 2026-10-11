# ThiruTrade market-data backend (local)

This Flask app serves the repository's static stock-explore website and exposes a **read-only** `/api/market` endpoint. It has no order-placement routes.

## Run on your Mac

1. In Terminal, open the repository:

   ```bash
   cd ~/My-GitHub-learning
   ```

2. Install dependencies:

   ```bash
   python3 -m pip install -r requirements.txt
   ```

3. Set your Groww access token in the current Terminal session. Generate it only through Groww's official API settings and documentation:

   ```bash
   export GROWW_ACCESS_TOKEN='PASTE_YOUR_ACCESS_TOKEN_HERE'
   ```

   Do not paste your token into chat, HTML/JavaScript, or a public GitHub file. The environment variable is local to this Terminal session.

4. Start the site:

   ```bash
   python3 app.py
   ```

5. Open [http://127.0.0.1:5000](http://127.0.0.1:5000) in Chrome. Keep Terminal open while using it. Stop the server with `Control + C`.

If you don't set a token, or Groww doesn't return supported quotes, the website stays in demo mode. The official Groww SDK may require an active API subscription and supported instrument permissions. Check the current SDK instructions at https://groww.in/trade-api/docs/python-sdk/live-data.

## GitHub Pages limitation

GitHub Pages hosts static HTML/CSS/JavaScript only; it does not run this Flask/Python backend. The published GitHub Pages site will therefore continue to show sample prices unless you deploy the backend separately to a secure Python host and configure the frontend to use that backend. Keep the token only in backend environment secrets.

## Data and safety

- Market quotes may be delayed, unavailable, or rejected depending on account/API access.
- This is a learning and paper-trading interface, not investment advice.
- No real orders are placed by this backend.
