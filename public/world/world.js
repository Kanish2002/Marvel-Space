import {PLACES,TILE,WORLD_WIDTH,WORLD_HEIGHT,placeById,actorBounds,frameAt} from './data.js';
import {drawEffect} from '../js/world.js';
export const IMAGE_TIMEOUT_MS=15000;
export const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export const screenToWorld=(camera,x,y,width,height)=>({x:(x-width/2)/camera.zoom+camera.x,y:(y-height/2)/camera.zoom+camera.y});
export function zoomAt(camera,factor,x,y,width,height){
  const before=screenToWorld(camera,x,y,width,height),zoom=clamp(camera.zoom*factor,.075,3);
  return {x:before.x-(x-width/2)/zoom,y:before.y-(y-height/2)/zoom,zoom};
}
export class PixelWorld{
  constructor(canvas,actors,{onPlace,onSelect,onError,onZoom}={}){
    Object.assign(this,{canvas,actors,onPlace,onSelect,onError,onZoom,ctx:canvas.getContext('2d'),camera:{x:TILE/2,y:TILE/2,zoom:.6},time:0,last:0,active:null,hover:null,place:'avengers',images:new Map(),inflight:new Map(),pointers:new Map(),overview:false,labels:true,paused:matchMedia('(prefers-reduced-motion: reduce)').matches,generation:0,queue:[],running:0,destroyed:false,failed:new Set(),pendingImages:new Set(),dirty:true});
    this.ordered=[...actors].sort((a,b)=>(placeById(a.place).y+a.y)-(placeById(b.place).y+b.y));
    this.handlers=[];
    const listen=(type,fn,opts)=>{canvas.addEventListener(type,fn,opts);this.handlers.push([type,fn,opts]);};
    this.resize=()=>{
      const r=canvas.getBoundingClientRect();this.width=r.width;this.height=r.height;this.dpr=Math.min(globalThis.devicePixelRatio||1,2);
      canvas.width=Math.round(r.width*this.dpr);canvas.height=Math.round(r.height*this.dpr);
      this.dirty=true;if(!this.sized){this.sized=true;this.focusPlace(this.place);}else this.constrain();this.draw();
    };
    this.observer=new ResizeObserver(this.resize);this.observer.observe(canvas);this.resize();
    listen('wheel',e=>{e.preventDefault();const r=canvas.getBoundingClientRect();this.zoom(Math.exp(-e.deltaY*.001),e.clientX-r.left,e.clientY-r.top);},{passive:false});
    listen('pointerdown',e=>this.down(e));listen('pointermove',e=>this.move(e));
    for(const type of ['pointerup','pointercancel','lostpointercapture'])listen(type,e=>this.up(e,type!=='pointerup'));
    this.frame=t=>{
      if(this.destroyed)return;
      const delta=this.last?Math.min(.1,Math.max(0,(t-this.last)/1000)):0;this.last=t;
      if(!document.hidden){if(!this.paused){this.time+=delta;this.dirty=true;}if(this.dirty){this.dirty=false;this.draw();}}this.raf=requestAnimationFrame(this.frame);
    };
    this.raf=requestAnimationFrame(this.frame);
  }
  invalidate(){this.dirty=true;}
  load(url){
    if(this.destroyed)return Promise.reject(new Error('World closed'));
    if(this.images.has(url)){const im=this.images.get(url);this.images.delete(url);this.images.set(url,im);return Promise.resolve(im);}
    if(this.inflight.has(url))return this.inflight.get(url);
    const promise=new Promise((resolve,reject)=>{this.queue.push({url,resolve,reject});}).finally(()=>this.inflight.delete(url));
    this.inflight.set(url,promise);this.drain();return promise;
  }
  drain(){
    while(this.running<4&&this.queue.length&&!this.destroyed){
      const {url,resolve,reject}=this.queue.shift();this.running++;
      const im=new Image();let settled=false;
      const finish=error=>{
        if(settled)return;settled=true;clearTimeout(timer);im.onload=im.onerror=null;this.pendingImages.delete(cancel);this.running--;
        if(error)reject(error);else{this.images.set(url,im);this.failed.delete(url);this.trim();this.invalidate();resolve(im);}
        this.drain();
      };
      const cancel=()=>finish(new Error('World closed'));
      const timer=setTimeout(()=>finish(new Error('Artwork took too long to load. Reopen the location to retry.')),IMAGE_TIMEOUT_MS);
      this.pendingImages.add(cancel);
      im.onload=()=>finish();
      im.onerror=()=>finish(new Error('Some artwork could not load. Reopen the location to retry.'));
      im.src=new URL(url,import.meta.url).href;
    }
  }
  trim(){
    const keep=new Set(PLACES.filter(p=>this.visiblePlace(p)).flatMap(p=>[p.background,...this.actors.filter(a=>a.place===p.id).map(a=>a.sheet)]));
    for(const key of this.images.keys())if(this.images.size>32&&!keep.has(key))this.images.delete(key);
  }
  async loadPlace(id,includeActors=this.camera.zoom>=.28){
    const p=placeById(id);if(!p)return;
    const urls=[p.background,...(includeActors?[...new Set(this.actors.filter(a=>a.place===id).map(a=>a.sheet))]:[])];
    const results=await Promise.allSettled(urls.map(u=>this.load(u)));
    results.forEach((r,i)=>{if(!this.destroyed&&r.status==='rejected'&&!this.failed.has(urls[i])){this.failed.add(urls[i]);this.onError?.(r.reason.message);}});
  }
  focusPlace(id){
    const p=placeById(id);if(!p)return Promise.resolve();this.generation++;this.place=id;this.overview=false;
    this.camera={x:p.x+TILE/2,y:p.y+TILE*.53,zoom:Math.max(.075,Math.min(this.width/TILE,this.height/TILE)*1.02)};
    this.invalidate();this.onPlace?.(id);this.onZoom?.(this.camera.zoom);return this.loadPlace(id,true);
  }
  async fitWorld(){
    this.generation++;this.overview=true;
    this.camera={x:WORLD_WIDTH/2,y:WORLD_HEIGHT/2,zoom:Math.max(.075,Math.min(this.width/(WORLD_WIDTH+100),this.height/(WORLD_HEIGHT+100)))};
    this.invalidate();this.onZoom?.(this.camera.zoom);await Promise.all(PLACES.map(p=>this.loadPlace(p.id,false)));this.trim();
  }
  async focusActor(a){
    if(a.reference){if(!placeById(a.place))return false;await this.focusPlace(a.place);return !this.destroyed;}
    const pending=this.focusPlace(a.place),generation=this.generation;await pending;if(this.destroyed||generation!==this.generation||!this.images.has(a.sheet))return false;
    const p=placeById(a.place);this.active=a.id;
    this.camera={x:p.x+a.x,y:p.y+a.y-a.height*.5,zoom:Math.min(1.15,this.height/(a.height+460))};this.invalidate();this.onZoom?.(this.camera.zoom);return true;
  }
  zoom(factor,x=this.width/2,y=this.height/2){this.generation++;this.camera=zoomAt(this.camera,factor,x,y,this.width,this.height);this.constrain();this.invalidate();this.onZoom?.(this.camera.zoom);this.loadVisible();}
  pan(dx,dy){
    this.generation++;this.camera.x+=dx;this.camera.y+=dy;this.constrain();this.overview=true;this.invalidate();this.updateCenteredPlace();this.loadVisible();
  }
  updateCenteredPlace(){
    const point=screenToWorld(this.camera,this.width/2,this.height/2,this.width,this.height),p=PLACES.find(p=>point.x>=p.x&&point.x<=p.x+TILE&&point.y>=p.y&&point.y<=p.y+TILE);
    if(p&&p.id!==this.place){this.place=p.id;this.onPlace?.(p.id);}
  }
  constrain(){this.camera.x=clamp(this.camera.x,-150,WORLD_WIDTH+150);this.camera.y=clamp(this.camera.y,-150,WORLD_HEIGHT+150);}
  visiblePlace(p){if(!p)return false;const z=this.camera.zoom,x=(p.x-this.camera.x)*z+this.width/2,y=(p.y-this.camera.y)*z+this.height/2;return x<this.width&&y<this.height&&x+TILE*z>0&&y+TILE*z>0;}
  async loadVisible(){await Promise.all(PLACES.filter(p=>this.visiblePlace(p)).map(p=>this.loadPlace(p.id)));this.trim();}
  pick(x,y){if(this.camera.zoom<.28)return null;const point=screenToWorld(this.camera,x,y,this.width,this.height);return [...this.ordered].reverse().find(a=>{if(!this.images.has(a.sheet))return false;const r=actorBounds(a);return point.x>=r.x&&point.x<=r.x+r.width&&point.y>=r.y&&point.y<=r.y+r.height;});}
  down(e){const r=this.canvas.getBoundingClientRect();this.canvas.setPointerCapture(e.pointerId);this.pointers.set(e.pointerId,{x:e.clientX-r.left,y:e.clientY-r.top,sx:e.clientX,sy:e.clientY,moved:false});this.distance=this.pinchDistance();this.canvas.style.cursor='grabbing';}
  pinchDistance(){const p=[...this.pointers.values()];return p.length>1?Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y):0;}
  move(e){
    const r=this.canvas.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,p=this.pointers.get(e.pointerId);
    if(!p){const hover=this.pick(x,y)?.id;if(hover!==this.hover){this.hover=hover;this.invalidate();}this.canvas.style.cursor=this.hover?'pointer':'grab';return;}
    this.generation++;const dx=x-p.x,dy=y-p.y;p.moved ||= Math.hypot(e.clientX-p.sx,e.clientY-p.sy)>5;p.x=x;p.y=y;
    if(this.pointers.size>1){for(const q of this.pointers.values())q.moved=true;const ps=[...this.pointers.values()],distance=this.pinchDistance();if(this.distance>0)this.zoom(distance/this.distance,(ps[0].x+ps[1].x)/2,(ps[0].y+ps[1].y)/2);this.distance=distance;}
    else this.pan(-dx/this.camera.zoom,-dy/this.camera.zoom);
    this.overview=true;this.updateCenteredPlace();
  }
  up(e,cancelled){const p=this.pointers.get(e.pointerId);if(p&&!p.moved&&!cancelled){const a=this.pick(p.x,p.y);if(a){this.active=a.id;this.invalidate();this.onSelect?.(a);}}this.pointers.delete(e.pointerId);this.distance=this.pinchDistance();this.canvas.style.cursor='grab';}
  draw(){
    if(!this.width)return;const c=this.ctx,z=this.camera.zoom;
    c.setTransform(this.dpr,0,0,this.dpr,0,0);c.fillStyle='#0a1b23';c.fillRect(0,0,this.width,this.height);
    c.save();c.translate(this.width/2,this.height/2);c.scale(z,z);c.translate(-this.camera.x,-this.camera.y);c.imageSmoothingEnabled=false;
    for(const p of PLACES){
      if(!this.visiblePlace(p))continue;const im=this.images.get(p.background);
      if(im)c.drawImage(im,p.x,p.y,TILE,TILE);else{c.fillStyle='#142a30';c.fillRect(p.x,p.y,TILE,TILE);c.fillStyle='#94aaa0';c.font='25px monospace';c.textAlign='center';c.fillText(p.name,p.x+TILE/2,p.y+TILE/2);}
      drawAmbient(c,p,this.time,z);
      if(z<.3){c.fillStyle='#081a24df';c.fillRect(p.x,p.y+TILE-112,TILE,112);c.font='bold 42px monospace';c.fillStyle='#dce0ca';c.textAlign='center';c.fillText(p.name,p.x+TILE/2,p.y+TILE-43);}
    }
    if(z>=.28)for(const a of this.ordered){if(!this.visiblePlace(placeById(a.place)))continue;const im=this.images.get(a.sheet);if(im)drawActor(c,a,im,this.time,{active:this.active===a.id||this.hover===a.id,labels:this.labels&&z>.36});}
    c.restore();
  }
  destroy(){this.destroyed=true;cancelAnimationFrame(this.raf);this.observer.disconnect();for(const cancel of [...this.pendingImages])cancel();for(const args of this.handlers)this.canvas.removeEventListener(...args);for(const job of this.queue.splice(0))job.reject(new Error('World closed'));this.images.clear();}
}
export function drawActor(c,a,image,time,{active=false,labels=false,local=false}={}){
  const rect=actorBounds(a),f=a.frames[frameAt(a,time)],phase=(time+(a.phase||0))/(a.period||2)*Math.PI*2;
  const hover=['repulsor','water','cosmic','phoenix'].includes(a.effect)?4+Math.sin(phase)*4:0;
  c.save();if(local)c.translate(-rect.x,-rect.y);c.imageSmoothingEnabled=false;
  c.fillStyle='#00000042';c.beginPath();c.ellipse(rect.x+rect.width/2,rect.y+rect.height-3,rect.width*.29,8,0,0,Math.PI*2);c.fill();
  if(active){c.strokeStyle='#efd1a0';c.lineWidth=2;c.beginPath();c.ellipse(rect.x+rect.width/2,rect.y+rect.height,rect.width*.36,12,0,0,Math.PI*2);c.stroke();}
  c.save();if(a.effect==='invisible')c.globalAlpha=.3+.6*(.5+.5*Math.cos(phase));
  if(a.effect==='illusion'){c.globalAlpha=.2;c.drawImage(image,f.x,f.y,f.width,f.height,rect.x+14+Math.sin(phase)*6,rect.y,rect.width,rect.height);c.globalAlpha=1;}
  c.drawImage(image,f.x,f.y,f.width,f.height,rect.x,rect.y-hover,rect.width,rect.height);c.restore();
  drawEffect(c,{...a,x:rect.x+rect.width/2,y:rect.y+rect.height},phase,hover);
  if(labels||active){c.font='bold 13px monospace';c.textAlign='center';const w=c.measureText(a.name).width+16;c.fillStyle='#102223df';c.fillRect(rect.x+rect.width/2-w/2,rect.y+rect.height+10,w,24);c.fillStyle=active?'#f0c99c':'#e1e5cf';c.fillText(a.name,rect.x+rect.width/2,rect.y+rect.height+26);}c.restore();
}
export function drawAmbient(c,p,t,z){
  c.save();c.beginPath();c.rect(p.x,p.y,TILE,TILE);c.clip();c.translate(p.x,p.y);
  if(z>.28&&p.ambient==='rain'){c.fillStyle='#8cb9ca66';for(let i=0;i<45;i++){const x=(i*137)%TILE,y=(i*73+t*170)%TILE;c.fillRect(Math.floor(x),Math.floor(y),1,8);}}
  else if(p.ambient==='magic'){c.fillStyle='#e2ab6255';for(let i=0;i<14;i++){const x=700+Math.cos(i*2+t*.35)*430,y=850+Math.sin(i*3+t*.45)*330;c.fillRect(Math.floor(x),Math.floor(y),3,3);}}
  else if(p.ambient==='bifrost'){c.globalAlpha=.1+.06*Math.sin(t);c.fillStyle='#bb9de3';c.fillRect(850,490,600,5);}
  else if(p.ambient==='water'){c.strokeStyle='#a6d6e844';c.lineWidth=3;for(let i=0;i<8;i++){c.beginPath();const y=(t*45+i*170)%TILE;c.moveTo(60,y);c.lineTo(115,y+60);c.stroke();}}
  else if(p.ambient==='sparks'){c.fillStyle='#f3c89466';for(let i=0;i<10;i++){const x=850+Math.sin(i*7+t)*160,y=1000-(t*55+i*39)%300;c.fillRect(Math.floor(x),Math.floor(y),2,3);}}
  else{c.fillStyle='#f3d7a533';for(let i=0;i<12;i++){const x=(i*139+t*9)%TILE,y=(i*97+t*4)%TILE;c.fillRect(Math.floor(x),Math.floor(y),2,2);}}
  c.restore();
}
