export const TILE=1536, GAP=96, COLS=4;
const definitions=[
['avengers','Avengers Tower','Armor checks, target practice, and a very heavy workout.','#dfad7d'],
['sanctum','Sanctum Sanctorum','A little magic in Greenwich Village.','#c695d2'],
['xavier','Xavier’s School','An extraordinary afternoon in Westchester.','#a4be79'],
['baxter','Baxter Building','Science, family, and the occasional unstable portal.','#73bccb'],
['queens','New York Rooftops','Your friendly neighborhood, above street level.','#e58573'],
['wakanda','Wakanda','Vibranium at the heart of the Golden City.','#b6a0d8'],
['asgard','Asgard','A golden home at the end of the Bifrost.','#e2c07e'],
['latveria','Castle Doom','A kingdom built around one formidable ambition.','#85bd90'],
['attilan','Attilan','The Inhuman city, under an alien sky.','#8ebfc8'],
['knowhere','Knowhere','A home for the galaxy’s most unlikely family.','#d29a72'],
['titan','Titan','Six stones. One quiet moment among the ruins.','#b297d3'],
['kamar','Kamar-Taj','Practice makes a master of the mystic arts.','#d5a97a'],
['madripoor','Madripoor','Late-night favors at the edge of the harbor.','#8ca6db']
];
export const PLACES=definitions.map(([id,name,note,color],i)=>({id,name,note,color,x:(i%COLS)*(TILE+GAP),y:Math.floor(i/COLS)*(TILE+GAP),background:`assets/${id}.webp`,ambient:['sanctum','kamar'].includes(id)?'magic':id==='asgard'?'bifrost':id==='wakanda'?'water':id==='queens'||id==='madripoor'?'rain':id==='knowhere'?'sparks':'dust'}));
export const placeById=id=>PLACES.find(p=>p.id===id);
export const WORLD_WIDTH=COLS*TILE+(COLS-1)*GAP,WORLD_HEIGHT=Math.ceil(PLACES.length/COLS)*TILE+(Math.ceil(PLACES.length/COLS)-1)*GAP;
// The sprite manifest is produced from inspected generation outputs, never inferred from the catalogue.
export async function loadData(){const [manifest,catalogue]=await Promise.all(['sprites.json','catalogue.json'].map(async f=>{const response=await fetch(f);if(!response.ok)throw new Error(`${f}: ${response.status}`);return response.json();}));return {actors:manifest.actors,catalogue};}
export function frameAt(actor,time){const count=actor.frames.length;if(count===1)return 0;const step=Math.floor((((time+(actor.phase||0))%(actor.period||2))+(actor.period||2))%(actor.period||2)/(actor.period||2)*actor.sequence.length);return actor.sequence[step];}
export function actorBounds(a){const p=placeById(a.place),h=a.height||170,w=h*a.widthRatio;return {x:p.x+a.x-w/2,y:p.y+a.y-h,width:w,height:h};}
export function filterCharacters(actors,catalogue,{query='',place='all',art='scene'}={}){const q=query.trim().toLowerCase();const animatedNames=new Set(actors.map(a=>a.name.toLowerCase()));const refs=art==='all'?catalogue.filter(c=>!animatedNames.has(c.name.toLowerCase())).map(c=>({...c,reference:true,place:c.realm==='hellskitchen'?'queens':c.realm})):[];return [...actors,...refs].filter(c=>(place==='all'||c.place===place)&&[c.name,c.identity,placeById(c.place)?.name,...(c.aliases||[])].join(' ').toLowerCase().includes(q));}
