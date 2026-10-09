from pathlib import Path
import urllib.request,json,concurrent.futures,time
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'.work/superheroes.json').read_text())
data=[x for x in data if x['biography']['publisher']=='Marvel Comics' and x['name']!='Captain Planet']
out=root/'public/assets/portraits';out.mkdir(exist_ok=True)
def fetch(c):
 target=out/f"{c['id']}.jpg"
 try:
  if not target.exists():target.write_bytes(urllib.request.urlopen(c['images']['sm'],timeout=20).read())
  return c['id']
 except Exception as e:print('Missing portrait',c['name'],str(e)[:50],flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=10)as ex:ready=[i for i in ex.map(fetch,data)if i]
(root/'.work/catalogue-ready.json').write_text(json.dumps(ready))
print('Saved catalogue portraits:',len(ready),'of',len(data),flush=True)
