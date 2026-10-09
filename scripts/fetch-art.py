"""Import public character artwork and retain source provenance. Not needed for building the saved app."""
from pathlib import Path
import urllib.request, re, json, concurrent.futures, html, time
root=Path(__file__).resolve().parents[1]
out=root/'public/assets/characters';out.mkdir(parents=True,exist_ok=True)
page=(root/'.work/rivals.html').read_text()
heroes=[]
for m in re.finditer(r'<a[^>]+data-url="([^"]+)"[^>]+data-name="([^"]+)"[^>]*title="([^"]+)"[^>]*>(.*?)</a>',page,re.S):
 url,name,title,body=m.groups()
 imgs=re.findall(r"<img[^>]+src=['\"]([^'\"]+)",body)
 if len(imgs)<3:continue
 ident=re.sub(r'[^a-z0-9]+','-',html.unescape(name).lower()).strip('-')
 heroes.append({'id':ident,'name':html.unescape(title).title(),'sourcePage':url,'portraitUrl':imgs[2]})
print('Official character references:',len(heroes),flush=True)
def fetch(hero):
 try:
  cache=root/'.work'/f"{hero['id']}.html"
  if cache.exists():s=cache.read_text()
  else:
   s=urllib.request.urlopen(hero['sourcePage'],timeout=25).read().decode();cache.write_text(s)
  m=re.search(r'<[^>]*class="tableImg"[^>]*>(.*?)</(?:table|div)>',s,re.S)
  urls=re.findall(r'<img[^>]+src=["\x27]([^"\x27]+)',m[1]) if m else []
  if len(urls)<5:raise ValueError('Missing full-body illustration')
  u=urls[4];target=out/f"{hero['id']}-source.png"
  if not target.exists():target.write_bytes(urllib.request.urlopen(u,timeout=25).read())
  hero.update({'bodyUrl':u,'bodyPath':f'assets/characters/{target.name}','owner':'Marvel / NetEase Games','artKind':'official full-body game illustration'})
  print('Artwork:',hero['name'],target.stat().st_size,flush=True)
  return hero
 except Exception as e:
  print('Unavailable:',hero['name'],str(e)[:100],flush=True);return None
with concurrent.futures.ThreadPoolExecutor(max_workers=6)as ex:records=[r for r in ex.map(fetch,heroes)if r]
(root/'public/assets/provenance/full-body.json').write_text(json.dumps(records,indent=2))
print('Ready full-body illustrations:',len(records),flush=True)
