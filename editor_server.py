"""Serve the local portfolio editor and save its generated pages to dist."""
import argparse
import json
import os
from pathlib import Path
import re
import secrets
import shutil
import tempfile
import threading
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit, quote

PROJECT = Path(__file__).resolve().parent
SITE = (PROJECT / 'dist').resolve()
ALLOWED_FILE = re.compile(r'(?:index|projects|project-[a-z0-9-]+)\.html|editor-template\.js')
SAVE_LOCK = threading.Lock()
TOKEN = secrets.token_urlsafe(32)
MAX_BODY = 256 * 1024 * 1024


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SITE), **kwargs)

    def valid_host(self):
        return self.headers.get('Host') == f'127.0.0.1:{self.server.server_port}'

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()

    def respond(self, status, value):
        content = json.dumps(value).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def do_GET(self):
        if not self.valid_host():
            self.respond(403, {'error': 'Open this editor through its local launcher.'})
            return
        if urlsplit(self.path).path == '/__portfolio/session':
            self.respond(200, {'app': 'owen-portfolio-editor', 'folder': str(SITE), 'token': TOKEN})
            return
        if urlsplit(self.path).path == '/__portfolio/media':
            media = []
            extensions = {'.jpg': 'image', '.jpeg': 'image', '.png': 'image', '.gif': 'image', '.webp': 'image', '.svg': 'image', '.mp4': 'video', '.mov': 'video', '.webm': 'video', '.ogg': 'video'}
            for folder in SITE.iterdir():
                if folder.name.lower() != 'media' or not folder.is_dir() or folder.is_symlink():
                    continue
                for path in sorted(folder.rglob('*')):
                    kind = extensions.get(path.suffix.lower())
                    if kind and path.is_file() and not path.is_symlink() and path.resolve().is_relative_to(SITE):
                        relative = path.relative_to(SITE).as_posix()
                        media.append({'name': path.relative_to(folder).as_posix(), 'src': quote(relative), 'kind': kind})
            self.respond(200, {'files': media})
            return
        super().do_GET()

    def do_POST(self):
        origin = f'http://127.0.0.1:{self.server.server_port}'
        if (not self.valid_host() or self.headers.get('Origin') != origin
                or self.headers.get('X-Portfolio-Token') != TOKEN):
            self.respond(403, {'error': 'Save must come from this local editor.'})
            return
        if urlsplit(self.path).path != '/__portfolio/save':
            self.respond(404, {'error': 'Unknown endpoint.'})
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if length <= 0 or length > MAX_BODY:
                self.respond(413, {'error': 'The saved pages are too large. Use smaller videos or external media links.'})
                return
            body = json.loads(self.rfile.read(length))
            files = body.get('files')
            if not isinstance(files, dict) or not {'index.html', 'projects.html', 'editor-template.js'}.issubset(files):
                raise ValueError('The save must include the homepage, Projects page, and editing content.')
            for name, content in files.items():
                if not isinstance(name, str) or not ALLOWED_FILE.fullmatch(name) or not isinstance(content, str):
                    raise ValueError('The save contains an unsupported filename or file content.')
                target = SITE / name
                if target.is_symlink() or target.resolve().parent != SITE:
                    raise ValueError('A saved file must stay inside the portfolio folder.')
            with SAVE_LOCK:
                prepared = {}
                previous = {}
                replaced = []
                try:
                    for name, content in files.items():
                        target = SITE / name
                        encoded = content.encode('utf-8')
                        existing = target.read_bytes() if target.exists() else None
                        if existing == encoded:
                            continue
                        previous[name] = existing
                        with tempfile.NamedTemporaryFile(dir=SITE, prefix='.portfolio-save-', suffix='.tmp', delete=False) as staged:
                            prepared[name] = Path(staged.name)
                            staged.write(encoded)
                    if prepared:
                        stamp = datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S-%f')
                        backup = PROJECT / 'save-backups' / stamp
                        backup.mkdir(parents=True)
                        for name, old in previous.items():
                            if old is not None:
                                (backup / name).write_bytes(old)
                        for name, staged in prepared.items():
                            os.replace(staged, SITE / name)
                            replaced.append(name)
                except Exception:
                    for name in replaced:
                        if previous[name] is None:
                            (SITE / name).unlink(missing_ok=True)
                        else:
                            (SITE / name).write_bytes(previous[name])
                    raise
                finally:
                    for staged in prepared.values():
                        staged.unlink(missing_ok=True)
            self.respond(200, {'saved': len(files), 'folder': str(SITE)})
        except (ValueError, json.JSONDecodeError) as error:
            self.respond(400, {'error': str(error)})
        except OSError as error:
            self.respond(500, {'error': f'Could not save the files: {error}'})


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=8765)
    args = parser.parse_args()
    server = ThreadingHTTPServer(('127.0.0.1', args.port), Handler)
    print(f'Portfolio editor: http://127.0.0.1:{args.port}/editor.html', flush=True)
    server.serve_forever()
