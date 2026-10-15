"""Verify public pages, internal navigation, image/video/download URLs, and HTTPS."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
import json
from pathlib import Path
from urllib.parse import urljoin, urlsplit, unquote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
class Scan(HTMLParser):
    def __init__(self):
        super().__init__(); self.refs=[]; self.ids=set(); self.main=False; self.editor_payload=False
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='main': self.main=True
        if attrs.get('id'): self.ids.add(attrs['id'])
        if attrs.get('id')=='portfolio-content': self.editor_payload=True
        for key in ('href','src','poster'):
            if attrs.get(key): self.refs.append((tag,key,attrs[key]))

def verify(base):
    if not base.endswith('/'): base+='/'
    origin=urlsplit(base); pending=[base]; pages={}; resources=set(); anchors=[]
    while pending:
        url=pending.pop(0)
        if url in pages: continue
        with urlopen(Request(url,headers={'User-Agent':'OwenPortfolioVerification/1.0'}),timeout=30) as response:
            assert response.status==200,(url,response.status)
            if origin.scheme=='https': assert response.url.startswith('https://'),response.url
            text=response.read().decode('utf-8')
        scan=Scan();scan.feed(text)
        assert scan.main and not scan.editor_payload,'Public page missing main content or exposes editor payload: '+url
        pages[url]=scan
        for tag,key,ref in scan.refs:
            target=urljoin(url,ref); parsed=urlsplit(target)
            if parsed.scheme not in ('http','https') or parsed.netloc!=origin.netloc: continue
            clean=parsed._replace(fragment='').geturl()
            if parsed.path.endswith('.html') or parsed.path==origin.path:
                pending.append(clean)
                if parsed.fragment: anchors.append((clean,unquote(parsed.fragment)))
            elif parsed.path: resources.add(clean)
    for url,anchor in anchors: assert anchor in pages[url].ids,(url,anchor)
    def check_resource(url):
        with urlopen(Request(url,method='HEAD',headers={'User-Agent':'OwenPortfolioVerification/1.0'}),timeout=30) as response:
            assert response.status==200,(url,response.status)
            assert int(response.headers.get('Content-Length','1'))>0,url
            content_type=response.headers.get('Content-Type','')
            assert 'text/html' not in content_type,('Asset returned HTML',url)
        return url
    with ThreadPoolExecutor(max_workers=5) as pool:
        checked=list(pool.map(check_resource,sorted(resources)))
    result={'base_url':base,'pages':len(pages),'assets':len(checked),'anchors':len(anchors),'https':origin.scheme=='https','status':'passed'}
    print(json.dumps(result,indent=2));return result

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--url',default='https://chromahud1.github.io/');args=parser.parse_args();verify(args.url)
