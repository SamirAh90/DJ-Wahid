"""Vendor the existing Google Fonts files without changing families or weights."""
from pathlib import Path
from urllib.request import Request, urlopen
from hashlib import sha256
import re

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'fonts'
URL = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Montserrat:wght@600;700;800;900&display=swap'
HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'}

def download(url):
    with urlopen(Request(url, headers=HEADERS), timeout=40) as response:
        return response.read()

OUT.mkdir(parents=True, exist_ok=True)
css = download(URL).decode('utf-8')
for url in sorted(set(re.findall(r'https://fonts.gstatic.com/[^)\s]+', css))):
    data = download(url)
    filename = sha256(data).hexdigest()[:20] + '.woff2'
    (OUT / filename).write_bytes(data)
    css = css.replace(url, '/fonts/' + filename)
(OUT / 'fonts.css').write_text(css, encoding='utf-8')
for name, url in {
    'DM-Sans-OFL.txt': 'https://raw.githubusercontent.com/google/fonts/main/ofl/dmsans/OFL.txt',
    'Montserrat-OFL.txt': 'https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/OFL.txt',
}.items():
    (OUT / name).write_bytes(download(url))
print('Vendored', len(list(OUT.glob('*.woff2'))), 'font files and their licenses.')
