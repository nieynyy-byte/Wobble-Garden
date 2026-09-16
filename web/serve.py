#!/usr/bin/env python3
"""Local preview only. Use HTTPS hosting for mobile motion permissions."""
import argparse,http.server,os
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--port',type=int,default=4173);p.add_argument('--host',default='127.0.0.1');a=p.parse_args()
os.chdir(Path(__file__).resolve().parent)
class Handler(http.server.SimpleHTTPRequestHandler):
 def end_headers(self):
  self.send_header('Cache-Control','no-cache');self.send_header('X-Content-Type-Options','nosniff');super().end_headers()
http.server.ThreadingHTTPServer((a.host,a.port),Handler).serve_forever()
