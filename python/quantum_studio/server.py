"""Private loopback-only server; no arbitrary file writes, remote APIs or credentials."""
from __future__ import annotations
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
import json
import mimetypes
from pathlib import Path
import threading
from urllib.parse import urlsplit,unquote
from .frontend import generated_assets
from .model import acquire
from .music import music_snapshot

REPO_ROOT=Path(__file__).resolve().parents[2]
DIST=REPO_ROOT/'web'/'dist'


class LocalServer(ThreadingHTTPServer):
    daemon_threads=True
    def __init__(self,port=8765,dist=DIST):
        self.dist=Path(dist).resolve();self.assets=generated_assets(self.dist)
        self.model_lock=threading.Lock()
        super().__init__(('127.0.0.1',port),Handler)


class Handler(BaseHTTPRequestHandler):
    server_version='QuantumStudioLocal/1.0'
    def log_message(self,fmt,*args): pass
    def allowed(self):
        port=self.server.server_address[1]
        hosts={f'127.0.0.1:{port}',f'localhost:{port}'}
        origin=self.headers.get('Origin')
        return self.headers.get('Host') in hosts and (not origin or origin in {f'http://{h}' for h in hosts})
    def send(self,status,body,kind='application/json; charset=utf-8'):
        self.send_response(status);self.send_header('Content-Type',kind);self.send_header('Content-Length',str(len(body)))
        self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.end_headers();self.wfile.write(body)
    def json(self,status,value):
        self.send(status,json.dumps(value,ensure_ascii=False,allow_nan=False).encode('utf-8'))
    def do_GET(self):
        if not self.allowed(): self.json(403,{'error':'This service accepts only local same-origin requests.'});return
        path=unquote(urlsplit(self.path).path)
        if path=='/api/health':
            import qiskit
            self.json(200,dict(status='ok',backend='Python / Qiskit',qiskit=qiskit.__version__,basis='q0 q1; studio q0 = Qiskit wire 1'));return
        if path=='/': path='/index.html'
        if path in self.server.assets:
            kind='text/html' if path.endswith('.html') else 'text/javascript'
            self.send(200,self.server.assets[path].encode(),kind+'; charset=utf-8');return
        if path=='/studio-model-original.js': path='/studio-model.js'
        candidate=(self.server.dist/path.lstrip('/')).resolve()
        if not candidate.is_relative_to(self.server.dist) or not candidate.is_file(): self.json(404,{'error':'Not found.'});return
        self.send(200,candidate.read_bytes(),mimetypes.guess_type(str(candidate))[0] or 'application/octet-stream')
    def do_POST(self):
        if not self.allowed(): self.json(403,{'error':'This service accepts only local same-origin requests.'});return
        if self.path not in ('/api/acquire','/api/music'): self.json(404,{'error':'Not found.'});return
        try:
            length=int(self.headers.get('Content-Length','0'))
            if not 0<length<=2000000: raise ValueError('Request must contain at most 2 MB of JSON.')
            if self.headers.get_content_type()!='application/json': raise ValueError('Send application/json.')
            payload=json.loads(self.rfile.read(length))
            if not isinstance(payload,dict): raise ValueError('JSON object required.')
            c=payload['configuration']
            with self.server.model_lock:
                if self.path=='/api/music': result=music_snapshot(c)
                else:
                    options=payload.get('options',{})
                    if not isinstance(options,dict): raise ValueError('Options must be an object.')
                    result=acquire(c,samples=options.get('samples'),force_echo=options.get('forceEcho')).browser_data()
            self.json(200,result)
        except (ValueError,KeyError,TypeError) as error:
            self.json(400,{'error':str(error)})
        except Exception:
            self.json(500,{'error':'Model calculation failed. Check the session parameters.'})


def serve(port=8765):
    with LocalServer(port) as server:
        url=f'http://127.0.0.1:{server.server_address[1]}'
        print(f'Quantum Music Studio — Python / Qiskit\nOpen {url}\nLocal access only. Keep this terminal running; Ctrl+C to stop.',flush=True)
        try: server.serve_forever()
        except KeyboardInterrupt: print('\nStopped.')
