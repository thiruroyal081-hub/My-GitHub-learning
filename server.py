#!/usr/bin/env python3
"""Run the Ganesh Utsav static website locally with no dependencies."""
from __future__ import annotations

import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PORT = int(os.environ.get("PORT", "4173"))

os.chdir(ROOT)
server = ThreadingHTTPServer(("0.0.0.0", PORT), SimpleHTTPRequestHandler)
print(f"Ganesh Utsav website is running at http://127.0.0.1:{PORT}")
print("Press Ctrl+C to stop the server.")
try:
    server.serve_forever()
except KeyboardInterrupt:
    print("\nServer stopped.")
finally:
    server.server_close()
