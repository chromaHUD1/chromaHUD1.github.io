"""Build a public static copy of dist, publishing only reachable pages and assets."""
import argparse
import base64
import hashlib
import html
from html.parser import HTMLParser
import json
import mimetypes
from pathlib import Path
import re
import shutil
import subprocess
import struct
import tempfile
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'dist'
OUTPUT = ROOT / '.pages-build'
CACHE = ROOT / '.pages-cache'
URL = 'https://chromahud1.github.io/'
EDITOR_FILES = ['editor.html', 'editor.js', 'editor-extras.js', 'editor-template.js', 'portfolio-layout.js', 'portfolio-pages.js', 'portfolio-zip.js', 'Edit Website.cmd']
ATTR = re.compile(r'\b(src|href|poster)=("|\')(.*?)\2', re.I | re.S)
PAYLOAD = re.compile(r'<script\b(?=[^>]*\bid=["\']portfolio-content["\'])[^>]*>.*?</script\s*>', re.I | re.S)


class Scan(HTMLParser):
    def __init__(self):
        super().__init__(); self.refs = []; self.ids = set()
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'): self.ids.add(attrs['id'])
        for key in ('src', 'href', 'poster'):
            if attrs.get(key): self.refs.append((tag, key, attrs[key]))


def within(path, directory):
    resolved = path.resolve()
    if not resolved.is_relative_to(directory.resolve()):
        raise ValueError(f'Asset leaves the website folder: {path.name}')
    return resolved


def clean_jpeg(data):
    """Drop EXIF/XMP location metadata without recompressing photo pixels."""
    if not data.startswith(b'\xff\xd8'): return data
    parts = [data[:2]]; offset = 2
    while offset + 4 <= len(data):
        if data[offset] != 255: return data
        marker = data[offset + 1]
        if marker in (0xDA, 0xD9):
            parts.append(data[offset:]); return b''.join(parts)
        length = int.from_bytes(data[offset + 2:offset + 4], 'big')
        if length < 2 or offset + 2 + length > len(data): return data
        segment = data[offset:offset + 2 + length]
        if marker != 0xE1:
            parts.append(segment)
        elif segment[4:10] == b'Exif\0\0':
            # Retain display orientation while dropping GPS and other camera metadata.
            tiff = segment[10:]
            try:
                endian = '<' if tiff[:2] == b'II' else '>'
                directory = struct.unpack_from(endian + 'I', tiff, 4)[0]
                count = struct.unpack_from(endian + 'H', tiff, directory)[0]
                for index in range(count):
                    entry = directory + 2 + 12 * index
                    tag, kind, size = struct.unpack_from(endian + 'HHI', tiff, entry)
                    if tag == 274 and kind == 3 and size == 1:
                        orientation = struct.unpack_from(endian + 'H', tiff, entry + 8)[0]
                        if 1 <= orientation <= 8:
                            minimal = b'Exif\0\0II*\0' + struct.pack('<IH', 8, 1) + struct.pack('<HHIHHI', 274, 3, 1, orientation, 0, 0)
                            parts.append(b'\xff\xe1' + struct.pack('>H', len(minimal) + 2) + minimal)
                        break
            except (struct.error, IndexError):
                pass
        offset += 2 + length
    return data


def scan_secrets(text, name):
    patterns = [r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----', r'gh[pousr]_[A-Za-z0-9]{30,}', r'github_pat_[A-Za-z0-9_]{35,}', r'AKIA[0-9A-Z]{16}', r'sk-(?:proj-)?[A-Za-z0-9_-]{35,}']
    if any(re.search(pattern, text) for pattern in patterns):
        raise ValueError(f'Possible credential in {name}; publication stopped without printing it.')


def build():
    CACHE.mkdir(exist_ok=True)
    inputs = set(); videos = {}; processed = {}; source_pages = set()
    with tempfile.TemporaryDirectory(prefix='.pages-stage-', dir=ROOT) as stage_name:
        stage = Path(stage_name)
        def store(data, suffix):
            data = clean_jpeg(data)
            digest = hashlib.sha256(data).hexdigest()[:24]
            relative = Path('assets') / 'published' / (digest + suffix)
            target = stage / relative; target.parent.mkdir(parents=True, exist_ok=True); target.write_bytes(data)
            return relative.as_posix()

        def asset(relative):
            src = within(SOURCE / relative, SOURCE)
            if not src.is_file(): raise FileNotFoundError(f'Missing portfolio asset: {relative}')
            inputs.add(src.relative_to(ROOT).as_posix())
            if src.suffix.lower() == '.mov':
                import imageio_ffmpeg
                digest = hashlib.sha256(src.read_bytes()).hexdigest()[:24]
                cached = CACHE / (digest + '-web.mp4')
                if not cached.exists():
                    command = [imageio_ffmpeg.get_ffmpeg_exe(), '-hide_banner', '-loglevel', 'error', '-i', str(src), '-map', '0:v:0', '-map', '0:a?', '-vf', "scale=w='min(1920,iw)':h=-2", '-c:v', 'libx264', '-preset', 'fast', '-crf', '21', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-map_metadata', '-1', '-y', str(cached)]
                    subprocess.run(command, check=True)
                result = store(cached.read_bytes(), '.mp4'); videos[relative] = result; return result
            data = src.read_bytes()
            if len(data) > 95 * 1024 * 1024: raise ValueError(f'{relative} exceeds the GitHub source-file size limit.')
            target = stage / relative; target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(clean_jpeg(data)); return relative

        pending = ['index.html']
        while pending:
            name = pending.pop(0)
            if name in processed: continue
            src = within(SOURCE / name, SOURCE)
            if not src.is_file(): raise FileNotFoundError(f'Missing page: {name}')
            if src.name.startswith(('editor', '__')): raise ValueError('The public navigation references an editor or test page.')
            inputs.add(src.relative_to(ROOT).as_posix()); source_pages.add(name)
            text = src.read_text(encoding='utf-8'); text = PAYLOAD.sub('', text)
            text = text.replace('\u00e2\u2020\u2014', '\u2197')
            text = re.sub(r'<base\b[^>]*>', '', text, flags=re.I)
            scan_secrets(text, name)
            def replace(match):
                key, quote, raw = match.groups(); value = html.unescape(raw).strip()
                if key.lower() == 'href':
                    if value.startswith('www.'): value = 'https://' + value
                    elif not urlsplit(value).scheme and re.fullmatch(r'[^\s/@]+@[^\s/]+\.[^\s/]+', value): value = 'mailto:' + value
                if value.startswith('data:'):
                    header, encoded = value.split(',', 1)
                    if ';base64' not in header: raise ValueError(f'Unsupported embedded asset in {name}')
                    mime = header[5:].split(';', 1)[0].lower()
                    suffix = {'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/svg+xml': '.svg', 'video/mp4': '.mp4', 'application/zip': '.zip', 'application/x-zip-compressed': '.zip', 'application/octet-stream': '.bin', 'application/pdf': '.pdf'}.get(mime)
                    if not suffix: raise ValueError(f'Unsupported public asset type {mime}')
                    data = base64.b64decode(encoded, validate=True)
                    if suffix == '.zip':
                        import io, zipfile
                        with zipfile.ZipFile(io.BytesIO(data)) as archive:
                            for entry in archive.infolist():
                                if Path(entry.filename).suffix.lower() in {'.ino','.cpp','.h','.py','.m','.txt','.json','.env'} and entry.file_size < 5 * 1024 * 1024:
                                    scan_secrets(archive.read(entry).decode('utf-8', errors='replace'), name + ' embedded archive')
                    value = store(data, suffix)
                else:
                    parsed = urlsplit(value)
                    if not parsed.scheme and not parsed.netloc and parsed.path:
                        relative = unquote(parsed.path)
                        if relative.startswith('/'):
                            relative = relative.lstrip('/')
                        if Path(relative).suffix.lower() == '.html':
                            pending.append(relative)
                        else:
                            value = asset(relative)
                            if parsed.fragment: value += '#' + parsed.fragment
                return key + '=' + quote + html.escape(value, quote=True) + quote
            text = ATTR.sub(replace, text)
            text = text.replace('</head>', '<link rel="icon" type="image/svg+xml" href="favicon.svg"><link rel="canonical" href="' + URL + ('' if name == 'index.html' else name) + '"></head>')
            (stage / name).write_text(text, encoding='utf-8'); processed[name] = text

        (stage / '.nojekyll').write_text('', encoding='utf-8')
        (stage / 'favicon.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="10" fill="#153033"/><text x="32" y="42" text-anchor="middle" font-family="Arial,sans-serif" font-size="30" font-weight="700" fill="#b9ed76">OS</text></svg>', encoding='utf-8')
        for name, text in processed.items():
            scan = Scan(); scan.feed(text)
            for tag, key, ref in scan.refs:
                parsed = urlsplit(ref)
                if parsed.scheme or parsed.netloc: continue
                target = within(stage / unquote(parsed.path or name), stage)
                if not target.is_file(): raise ValueError(f'{name}: broken {key} link to {ref}')
                if parsed.fragment and target.suffix.lower() == '.html':
                    other = Scan(); other.feed(target.read_text(encoding='utf-8'))
                    if unquote(parsed.fragment) not in other.ids: raise ValueError(f'{name}: missing anchor in {ref}')
        if OUTPUT.exists():
            if OUTPUT.resolve().parent != ROOT or not (OUTPUT / '.portfolio-generated').exists():
                raise ValueError('Refusing to overwrite an unrecognized build folder.')
            shutil.rmtree(OUTPUT)
        shutil.copytree(stage, OUTPUT)
        (OUTPUT / '.portfolio-generated').write_text('Generated by tools/prepare_pages.py; safe to rebuild.\n')
    inputs.update('dist/' + name for name in EDITOR_FILES)
    for name in inputs:
        path = ROOT / name
        if path.suffix.lower() in {'.html','.js','.json','.txt','.py','.ps1','.md','.yml'}:
            scan_secrets(path.read_text(encoding='utf-8'), name)
    manifest = {'url': URL, 'pages': sorted(source_pages), 'source_files': sorted(inputs), 'video_copies': videos, 'public_bytes': sum(path.stat().st_size for path in OUTPUT.rglob('*') if path.is_file())}
    (ROOT / '.pages-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'output': str(OUTPUT), 'pages': len(source_pages), 'source_files': len(inputs), 'public_megabytes': round(manifest['public_bytes'] / 1048576, 2), 'converted_videos': len(videos)}))
    return manifest


if __name__ == '__main__':
    build()
