/** Canvas recorder for deterministic checks and SVG art review without a browser. */
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const multiply=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
export class RecordingContext {
 constructor(){this.nodes=[];this._state={matrix:[1,0,0,1,0,0],fillStyle:'#000',strokeStyle:'#000',globalAlpha:1,lineWidth:1,font:'10px monospace',textAlign:'start'};this.stack=[];this.path='';this.commands=0;}
 get matrix(){return this._state.matrix;}
 save(){this.stack.push({...this._state,matrix:[...this.matrix]});}
 restore(){if(!this.stack.length)throw new Error('Unbalanced restore');this._state=this.stack.pop();}
 translate(x,y){this.transform(1,0,0,1,x,y);}scale(x,y){this.transform(x,0,0,y,0,0);}rotate(a){this.transform(Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0);}
 transform(...m){this._state.matrix=multiply(this.matrix,m);}setTransform(...m){this._state.matrix=m;}
 beginPath(){this.path='';}closePath(){this.path+=' Z';}moveTo(x,y){this.path+=` M ${x} ${y}`;}lineTo(x,y){this.path+=` L ${x} ${y}`;}
 quadraticCurveTo(a,b,x,y){this.path+=` Q ${a} ${b} ${x} ${y}`;}
 ellipse(x,y,rx,ry,rotation,start,end){this.path+=` M ${x-rx} ${y} a ${rx} ${ry} ${rotation*180/Math.PI} 1 0 ${rx*2} 0 a ${rx} ${ry} ${rotation*180/Math.PI} 1 0 ${-rx*2} 0`;}
 style(fill,stroke){return `fill="${fill?esc(this.fillStyle):'none'}" stroke="${stroke?esc(this.strokeStyle):'none'}" stroke-width="${this.lineWidth}" opacity="${this.globalAlpha}" transform="matrix(${this.matrix.join(' ')})"`;}
 push(node){if(/NaN|Infinity|undefined/.test(node))throw new Error(`Invalid drawing command: ${node}`);this.nodes.push(node);this.commands++;}
 fill(){this.push(`<path d="${this.path}" ${this.style(true,false)}/>`);}stroke(){this.push(`<path d="${this.path}" ${this.style(false,true)}/>`);}
 fillRect(x,y,w,h){this.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" ${this.style(true,false)}/>`);}
 strokeRect(x,y,w,h){this.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" ${this.style(false,true)}/>`);}
 fillText(text,x,y){const size=this.font.match(/([\d.]+)px/)?.[1]||10;this.push(`<text x="${x}" y="${y}" font-size="${size}" font-family="monospace" text-anchor="${this.textAlign==='center'?'middle':this.textAlign==='right'?'end':'start'}" ${this.style(true,false)}>${esc(text)}</text>`);}
 clearRect(){}get imageSmoothingEnabled(){return false;}set imageSmoothingEnabled(v){}
 svg(width,height,bg='#122032'){return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${bg}"/>${this.nodes.join('')}</svg>`;}
}
for(const key of ['fillStyle','strokeStyle','globalAlpha','lineWidth','font','textAlign'])Object.defineProperty(RecordingContext.prototype,key,{get(){return this._state[key];},set(v){this._state[key]=v;}});
