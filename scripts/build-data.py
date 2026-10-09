from pathlib import Path
import json,re
root=Path(__file__).resolve().parents[1]
refs=json.loads((root/'public/assets/provenance/full-body.json').read_text())
source=json.loads((root/'.work/superheroes.json').read_text())
extra={30,157,213,313,659,697}
source=[c for c in source if (c['biography']['publisher']=='Marvel Comics' or c['id']in extra)and c['name']!='Captain Planet']
normalize=lambda s:re.sub(r'[^a-z0-9]','',s.lower().replace('the ','').replace('jubilation lee','jubilee').replace('thing','thing'))
lookup={normalize(c['name']):c for c in source}
worlds=[
 ('avengers','Avengers Tower','Earth-616 · Avengers','#6dcfe5','Manhattan above the clouds. Armor checks, arc-reactor tests and a little friendly competition.'),
 ('sanctum','Sanctum Sanctorum','Earth-616 · Mystic arts','#eeac67','Ancient volumes, rotating spell circles and one exceptionally opinionated cloak.'),
 ('wakanda','Wakanda','Earth-616 · Wakanda','#b8a0ef','Vibranium resonances echo across the Golden City.'),
 ('asgard','Asgard','Earth-616 · Nine Realms','#e9c47c','Thunder, enchanted blades and Bifrost light on a golden terrace.'),
 ('baxter','Baxter Building','Earth-828 · First Family','#e5a46d','A retro-futuristic laboratory for the Fantastic Four. A fan crossover setting.'),
 ('latveria','Castle Doom','Earth-616 · Latveria','#7acaad','Emerald machines and a throne overlooking Latveria. Doom’s portrait archive is here.'),
 ('xavier','Xavier’s School','Earth-616 · Mutants','#b8a3ed','A courtyard where mutant powers turn an ordinary training day into something extraordinary.'),
 ('knowhere','Knowhere','Earth-616 · Cosmic','#77c7bc','Between missions, the Guardians make their own kind of chaos.'),
 ('hellskitchen','Hell’s Kitchen','Earth-616 · Street heroes','#dd829c','Rain-soaked rooftops. Vigilantes, martial artists and quiet midnight patrols.'),
 ('queens','Queens Rooftops','Earth-616 · New York','#dd6e76','Webs, symbiotes and rooftop routines. One corner of a much bigger multiverse.'),
 ('titan','Titan','Earth-616 · Cosmic archive','#b394ea','A ruined world under an alien sky. Explore Thanos and the cosmic character archive.'),
 ('attilan','Attilan','Earth-616 · Inhumans archive','#95cde3','A crystalline lunar terrace overlooking Earth. Browse the Inhumans archive.')
]
groups={
'avengers':'captain-america iron-man hulk black-widow hawkeye winter-soldier ultron',
'sanctum':'doctor-strange scarlet-witch magik cloak-dagger moon-knight',
'wakanda':'black-panther namor storm',
'asgard':'thor loki hela angela gorr-the-god-butcher',
'baxter':'mister-fantastic invisible-woman human-torch the-thing',
'latveria':'the-hood',
 'titan':'thanos',
'xavier':'wolverine magneto cyclops jubilee rogue gambit emma-frost phoenix psylocke deadpool',
'knowhere':'star-lord rocket-raccoon groot mantis adam-warlock jeff-the-land-shark luna-snow',
'hellskitchen':'daredevil blade iron-fist the-punisher elsa-bloodstone white-fox',
'queens':'spider-man venom peni-parker black-cat squirrel-girl devil-dinosaur'}
assign={k:realm for realm,ids in groups.items()for k in ids.split()}
# Every resident has an authored moment; effects are separate from the illustration puppet frames.
moments={
'thanos':('infinity','Balancing the six Infinity Stones in an orbit around his gauntlet','#bb91e5'),
'captain-america':('shield','Calibrating a rotating shield hologram','#70bfe9'),
'iron-man':('repulsor','Hovering through a repulsor diagnostics cycle','#78dbed'),
'hulk':('shockwave','Charging a ground-shaking power pulse','#91c86b'),
'black-widow':('batons','Cycling electric Widow’s Bite charges','#8ccfee'),
'hawkeye':('target','Tracking a moving holographic archery target','#ba8be4'),
'winter-soldier':('scan','Checking his vibranium arm’s tactical scanner','#a6d6ef'),
'ultron':('drones','Synchronizing a constellation of sentry drones','#e85855'),
'doctor-strange':('runes','Keeping a circular portal spell in balance','#ffb25f'),
'scarlet-witch':('chaos','Weaving two orbiting chaos-magic spheres','#f25b71'),
'magik':('blade','Opening a stepping disc around her Soulsword','#f4cb71'),
'cloak-dagger':('lightdark','Passing luminous daggers through a cloak of darkness','#c8b7ee'),
'moon-knight':('crescent','Orbiting crescent darts under a lunar halo','#dbe5ee'),
'black-panther':('kinetic','Absorbing and releasing violet kinetic energy','#b88cf1'),
'namor':('water','Raising a tidal ring around the terrace','#68cfdf'),
'storm':('weather','Gathering a miniature thundercloud','#abd7ee'),
'thor':('lightning','Recharging Mjolnir with forked lightning','#9edaf6'),
'loki':('illusion','Splitting into an emerald illusion','#92db92'),
'hela':('blades','Summoning a ring of obsidian blades','#86c597'),
'angela':('blade','Tracing golden runes around her celestial blade','#f0c67d'),
'gorr-the-god-butcher':('shadow','Drawing the Necrosword’s shadows inward','#a59bbe'),
'mister-fantastic':('orbit','Solving an orbiting molecular projection','#89c5ed'),
'invisible-woman':('invisible','Fading inside a protective force field','#9fdcf4'),
'human-torch':('fire','Cycling a halo of rising flame','#ffae68'),
'the-thing':('shockwave','Testing the terrace with a rocky power pulse','#e4af6c'),
'wolverine':('claws','Sharpening an adamantium claw glint','#e9d281'),
'magneto':('metal','Levelling a ring of levitating metal fragments','#dd889f'),
'cyclops':('optic','Checking a sweeping optic-beam calibration','#ed7976'),
'jubilee':('fireworks','Sketching fireworks above the courtyard','#e8a2ed'),
'rogue':('aura','Testing the limits of an absorbed-energy aura','#a9d48a'),
'gambit':('cards','Charging a fan of orbiting playing cards','#df93e8'),
'emma-frost':('diamond','Refracting light through a diamond aura','#d3e7f0'),
'phoenix':('phoenix','Fanning the wings of a fiery cosmic halo','#fbc37a'),
'psylocke':('blade','Charging a violet psychic blade','#c28bea'),
'deadpool':('target','Distracting a tracking target with neon mischief','#e8868d'),
'star-lord':('music','Keeping a dance beat between missions','#e5b96c'),
'rocket-raccoon':('scan','Scanning the next improbable gadget','#84ced8'),
'groot':('leaves','Growing a spiral of drifting leaves','#a7cf89'),
'mantis':('aura','Balancing a circle of empathic motes','#b5df9d'),
'adam-warlock':('cosmic','Holding a golden cosmic energy sphere','#efd18a'),
'jeff-the-land-shark':('bubbles','Blowing a very enthusiastic trail of bubbles','#99dce9'),
'luna-snow':('snow','Spinning a miniature snow crystal','#b7dcf4'),
'daredevil':('radar','Listening through expanding radar rings','#e38c8e'),
'blade':('blade','Checking a silver-edged vampire-hunting blade','#b5c9d6'),
'iron-fist':('fist','Gathering golden chi in his iron fist','#e9c267'),
'punisher':('scan','Sweeping a rooftop with a tactical scanner','#a8bfd0'),
'elsa-bloodstone':('cosmic','Charging the Bloodstone’s crimson aura','#ed9589'),
'white-fox':('illusion','Gathering a pale fox-spirit afterimage','#d4e3eb'),
'spider-man':('web','Casting and dissolving a circular web pattern','#cad9e8'),
'venom':('symbiote','Unfurling a writhing symbiote halo','#b6b4cf'),
'peni-parker':('drones','Synchronizing SP//dr sensor lights','#eaa2ae'),
'black-cat':('luck','Watching a shimmer of improbable good luck','#d2dbe8'),
'squirrel-girl':('leaves','Gathering a whirlwind of acorns and leaves','#d5b88f'),
'devil-dinosaur':('shockwave','Making the rooftop tremble with a dinosaur rumble','#e57b70'),
'hood':('shadow','Maintaining a dark-magic circle','#bd91d7')}
residents=[]; catalog=[]; matched=set()
for ref in refs:
 ident=ref['id'];realm=assign.get(ident,'hellskitchen'); c=lookup.get(normalize(ref['name']))
 if ident=='the-punisher':c=lookup.get('punisher')
 if ident=='the-thing':c=lookup.get('thing')
 if ident=='jubilee':c=lookup.get('jubilee')
 if c:matched.add(c['id'])
 name={'jubilee':'Jubilee','the-punisher':'Punisher','the-thing':'The Thing','gorr-the-god-butcher':'Gorr the God Butcher','jeff-the-land-shark':'Jeff the Land Shark','star-lord':'Star-Lord','spider-man':'Spider-Man'}.get(ident,ref['name'])
 key=ident.replace('the-punisher','punisher').replace('the-hood','hood');effect,task,color=moments.get(key,('aura',f'Maintaining {name}’s signature energy field','#afcfe5'))
 record={'id':ident,'name':name,'identity':c['biography']['fullName'] if c and c['biography']['fullName'] else name,'realm':realm,'effect':effect,'task':task,'color':color,'status':'animated','body':ref['bodyPath'],'sheet':ref['spritePath'],'frames':20,'columns':5,'frameWidth':320,'frameHeight':400,'period':3.2+(len(residents)%7)*.31,'phase':len(residents)*.41,'artStyle':('Marvel Rivals illustration' if ref['owner']=='Marvel / NetEase Games' else 'Full-body character render'),'source':ref['sourcePage'],'alignment':c['biography']['alignment'] if c else 'neutral','aliases':c['biography']['aliases'] if c else []}
 if c:record['portrait']=f"assets/portraits/{c['id']}.jpg"
 else:record['portrait']=record['body']
 residents.append(record);catalog.append(record)
for c in source:
 if c['id']in matched:continue
 name=c['name'];realm='avengers'
 if any(s in name for s in ['Spider','Goblin','Venom','Carnage','Octopus','Sandman','Lizard','Kraven','Vulture','Electro','Mysterio','Silk']):realm='queens'
 elif any(s in name for s in ['Doom','MODOK','Mandarin','Red Skull']):realm='latveria'
 elif any(s in name for s in ['Thanos','Galactus','Surfer','Ego','Nova','Living Tribunal','Beyonder','Watcher','Abraxas']):realm='titan'
 elif any(s in name for s in ['Black Bolt','Medusa','Crystal','Triton','Maximus','Gorgon']):realm='attilan'
 elif any(s in name for s in ['Professor','Nightcrawler','Beast','Iceman','Colossus','Cable','Mystique','Juggernaut','Sabretooth','X-','Shadowcat','Polaris','Sunspot','Bishop','Banshee','Havok','Angel','Blink']):realm='xavier'
 elif any(s in name for s in ['Ghost Rider','Dormammu','Mephisto','Man-Thing']):realm='sanctum'
 elif any(s in name for s in ['Drax','Gamora','Nebula','Warlock','Mantis','Rocket','Groot']):realm='knowhere'
 elif any(s in name for s in ['Odin','Sif','Thor','Loki','Ymir','Destroyer','Beta Ray','Firelord']):realm='asgard'
 elif any(s in name for s in ['Kingpin','Bullseye','Elektra','Shang-Chi','Jessica','Luke Cage','Punisher']):realm='hellskitchen'
 catalog.append({'id':'catalogue-'+str(c['id']),'name':name,'identity':c['biography']['fullName']or name,'realm':realm,'status':'catalogue','portrait':f"assets/portraits/{c['id']}.jpg",'alignment':c['biography']['alignment'],'aliases':c['biography']['aliases'],'firstAppearance':c['biography']['firstAppearance'],'source':'https://github.com/akabab/superhero-api','artStyle':'Comic portrait archive'})
# Explicit screen variants are separate records, and are not silently assigned the Rivals illustration.
for slug,actor,earth in [('tobey','Tobey Maguire','96283'),('andrew','Andrew Garfield','120703'),('tom','Tom Holland','616')]:
 catalog.append({'id':'spider-man-'+slug,'name':'Spider-Man · '+actor,'identity':'Peter Parker','realm':'queens','status':'catalogue','portrait':'assets/portraits/620.jpg','aliases':[actor,'Peter Parker'],'artStyle':'Reference portrait · actor-specific art pending','source':'https://www.marvel.com/characters/spider-man-peter-parker','continuity':'Earth-'+earth+' · Screen'})
for realm in worlds:
 local=[r for r in residents if r['realm']==realm[0]]
 for i,r in enumerate(local):
  columns=min(5,len(local));row=i//columns;col=i%columns;count=min(columns,len(local)-row*columns)
  r['x']=768+(col-(count-1)/2)*(1180/max(3,count));r['y']=740+row*200;r['height']=230 if len(local)<=7 else 210
  if r['id']in ['hulk','groot','the-thing','venom','devil-dinosaur','peni-parker']:r['height']+=35
realmRecords=[{'id':w[0],'name':w[1],'continuity':w[2],'color':w[3],'description':w[4],'background':f'assets/locations/{w[0]}.webp'}for w in worlds]
mapping=json.loads((root/'public/assets/provenance/portrait-atlas.json').read_text())
for c in catalog:
 if c['portrait']in mapping:c['portraitPosition']=mapping[c['portrait']];c['portrait']='assets/portraits/atlas.webp'
js='export const REALMS = '+json.dumps(realmRecords,ensure_ascii=False)+';\nexport const CHARACTERS = '+json.dumps(catalog,ensure_ascii=False)+';\nexport const RESIDENTS = CHARACTERS.filter(c => c.status === "animated");\nexport const assetURL = path => globalThis.MARVEL_ASSETS?.[path] || new URL(path, document.baseURI).href;\n'
(root/'public/js/data.js').write_text(js)
print(len(catalog),'characters,',len(residents),'illustrated residents,',len(worlds),'locations')
