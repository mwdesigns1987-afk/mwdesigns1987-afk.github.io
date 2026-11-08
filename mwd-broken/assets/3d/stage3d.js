import * as THREE from 'three';
import { GLTFLoader } from './GLTFLoader.js';
import { OrbitControls } from './OrbitControls.js';
const loader = new GLTFLoader();
let R, scene, cam, ctl, clock = new THREE.Clock(), mixer = null, model = null, root, layers = {}, spin = false, host = null, lights = {}, platform, bLogo;
function bTexture(){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle='#111';g.fillRect(0,0,256,256);const gr=g.createLinearGradient(0,40,0,220);gr.addColorStop(0,'#fff');gr.addColorStop(.5,'#888');gr.addColorStop(.55,'#eee');gr.addColorStop(1,'#666');g.fillStyle=gr;g.font='900 170px Georgia';g.textAlign='center';g.textBaseline='middle';g.fillText('B',128,145);g.fillStyle='#e0141e';g.font='60px serif';g.fillText('\u265B',128,40);return new THREE.CanvasTexture(c);}
function metalTexture(){const c=document.createElement('canvas');c.width=c.height=512;const g=c.getContext('2d');const gr=g.createLinearGradient(0,0,0,512);gr.addColorStop(0,'#2a2a2d');gr.addColorStop(1,'#0e0e10');g.fillStyle=gr;g.fillRect(0,0,512,512);g.strokeStyle='rgba(0,0,0,.8)';g.lineWidth=3;for(let i=0;i<=512;i+=128){g.beginPath();g.moveTo(i,0);g.lineTo(i,512);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(512,i);g.stroke();}for(let x=10;x<512;x+=128)for(let y=10;y<512;y+=128)for(const[dx,dy]of[[0,0],[108,0],[0,108],[108,108]]){const rg=g.createRadialGradient(x+dx+3,y+dy+3,0,x+dx+4,y+dy+4,6);rg.addColorStop(0,'#ddd');rg.addColorStop(1,'#222');g.fillStyle=rg;g.beginPath();g.arc(x+dx+4,y+dy+4,5,0,7);g.fill();}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,2);return t;}
function build(el){host=el;R=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});R.setPixelRatio(Math.min(devicePixelRatio,2));R.outputColorSpace=THREE.SRGBColorSpace;R.shadowMap.enabled=true;el.appendChild(R.domElement);
scene=new THREE.Scene();cam=new THREE.PerspectiveCamera(35,1,0.1,100);cam.position.set(0,1.4,4.6);
ctl=new OrbitControls(cam,R.domElement);ctl.target.set(0,1,0);ctl.enableDamping=true;ctl.minDistance=1.5;ctl.maxDistance=9;ctl.maxPolarAngle=Math.PI*0.55;ctl.enablePan=false;
const wall=new THREE.Mesh(new THREE.PlaneGeometry(12,7),new THREE.MeshStandardMaterial({map:metalTexture(),metalness:.7,roughness:.45}));wall.position.set(0,3,-3);scene.add(wall);lights.wall=wall;
const plate=new THREE.Mesh(new THREE.PlaneGeometry(1.1,1.1),new THREE.MeshStandardMaterial({map:bTexture(),metalness:.6,roughness:.3,emissive:0x220000}));plate.position.set(0,3.4,-2.95);scene.add(plate);
for(const x of[-2.6,2.6]){const n=new THREE.Mesh(new THREE.BoxGeometry(.06,4.5,.06),new THREE.MeshBasicMaterial({color:0xff1a2a}));n.position.set(x,2.3,-2.9);scene.add(n);const pl=new THREE.PointLight(0xff1a2a,6,5);pl.position.set(x,2,-2.4);scene.add(pl);}
const floor=new THREE.Mesh(new THREE.CircleGeometry(8,64),new THREE.MeshStandardMaterial({color:0x0b0b0c,metalness:.8,roughness:.35}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
platform=new THREE.Group();const chrome=new THREE.MeshStandardMaterial({color:0xcfcfd4,metalness:1,roughness:.18});const base=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.2,.18,64),chrome);base.position.y=.09;base.receiveShadow=true;platform.add(base);
const ring=new THREE.Mesh(new THREE.TorusGeometry(1.15,.035,16,96),new THREE.MeshBasicMaterial({color:0xff1a2a}));ring.rotation.x=Math.PI/2;ring.position.y=.18;platform.add(ring);lights.ring=ring;
bLogo=new THREE.Mesh(new THREE.CircleGeometry(.55,48),new THREE.MeshStandardMaterial({map:bTexture(),metalness:.5,roughness:.3,transparent:true,opacity:.85}));bLogo.rotation.x=-Math.PI/2;bLogo.position.y=.185;platform.add(bLogo);scene.add(platform);
root=new THREE.Group();root.position.y=.18;scene.add(root);
lights.hemi=new THREE.HemisphereLight(0xffffff,0x220000,1.2);scene.add(lights.hemi);lights.key=new THREE.SpotLight(0xfff2e6,60,12,Math.PI/7,.5);lights.key.position.set(0,6,3);lights.key.target=root;lights.key.castShadow=true;scene.add(lights.key);lights.rim=new THREE.DirectionalLight(0xff2030,1.5);lights.rim.position.set(-3,3,-2);scene.add(lights.rim);
new ResizeObserver(fit).observe(el);fit();loop();}
function fit(){if(!host)return;const w=host.clientWidth,h=host.clientHeight;R.setSize(w,h);cam.aspect=w/h;cam.updateProjectionMatrix();}
function loop(){requestAnimationFrame(loop);const d=clock.getDelta();if(mixer)mixer.update(d);if(spin)root.rotation.y+=d*.6;ctl.update();R.render(scene,cam);}
function srcOf(x){return x instanceof Blob?URL.createObjectURL(x):x;}
async function loadModel(src){const g=await loader.loadAsync(srcOf(src));if(model)root.remove(model);model=g.scene;model.traverse(o=>{if(o.isMesh){o.castShadow=true;}});
const bb=()=>{model.updateMatrixWorld(true);const b=new THREE.Box3();model.traverse(m=>{if(m.isMesh){if(m.isSkinnedMesh){m.skeleton&&m.skeleton.update();m.computeBoundingBox();}else if(!m.geometry.boundingBox)m.geometry.computeBoundingBox();const g=(m.isSkinnedMesh?m.boundingBox:m.geometry.boundingBox).clone().applyMatrix4(m.matrixWorld);b.union(g);}});return b;};const box=bb(),h=box.max.y-box.min.y||1;const s=1.75/h;model.scale.multiplyScalar(s);const b2=bb();model.position.y-=b2.min.y;model.position.x-=(b2.min.x+b2.max.x)/2;model.position.z-=(b2.min.z+b2.max.z)/2;root.add(model);
mixer=null;if(g.animations&&g.animations.length){mixer=new THREE.AnimationMixer(model);const idle=g.animations.find(a=>/idle/i.test(a.name))||g.animations[0];mixer.clipAction(idle).play();}
const keep=layers;layers={};for(const[k,v]of Object.entries(keep))if(v&&v.src)await setLayer(k,v.src,v.visible);return{animations:(g.animations||[]).map(a=>a.name)};}
function bonesOf(o){const m={};o.traverse(n=>{if(n.isBone)m[n.name]=n;});return m;}
async function setLayer(name,src,visible=true){if(layers[name]&&layers[name].obj)layers[name].obj.parent&&layers[name].obj.parent.remove(layers[name].obj);if(!src){delete layers[name];return;}
const g=await loader.loadAsync(srcOf(src));const obj=g.scene;let rigged=false;if(model){const mb=bonesOf(model);obj.traverse(o=>{if(o.isSkinnedMesh&&o.skeleton){const nb=o.skeleton.bones.map(b=>mb[b.name]);if(nb.every(Boolean)){o.bind(new THREE.Skeleton(nb,o.skeleton.boneInverses),o.bindMatrix);rigged=true;}}});}
if(rigged){const holder=new THREE.Group();obj.traverse(o=>{});const meshes=[];obj.traverse(o=>{if(o.isSkinnedMesh)meshes.push(o);});meshes.forEach(m=>holder.add(m));model.add(holder);layers[name]={obj:holder,src,visible};}else{(model||root).add(obj);if(model){obj.scale.setScalar(1/model.scale.x);}layers[name]={obj,src,visible};}
layers[name].obj.visible=visible;return{rigged};}
function show(name,v){if(layers[name]){layers[name].visible=v;layers[name].obj.visible=v;}}
const LIGHTS={Studio:()=>{lights.hemi.intensity=1.2;lights.key.intensity=60;lights.key.color.set(0xfff2e6);lights.rim.intensity=1.5;},'Red Neon':()=>{lights.hemi.intensity=.4;lights.key.intensity=25;lights.key.color.set(0xff4050);lights.rim.intensity=3;},Spotlight:()=>{lights.hemi.intensity=.15;lights.key.intensity=110;lights.key.color.set(0xffffff);lights.rim.intensity=.6;},Showroom:()=>{lights.hemi.intensity=2;lights.key.intensity=40;lights.key.color.set(0xffffff);lights.rim.intensity=1;}};
const BGS={'Riveted Metal':()=>{lights.wall.visible=true;scene.background=null;},'Black':()=>{lights.wall.visible=false;scene.background=new THREE.Color(0x000000);},'Deep Red':()=>{lights.wall.visible=false;scene.background=new THREE.Color(0x2a0003);},'Showroom':()=>{lights.wall.visible=false;new THREE.TextureLoader().load('assets/showroom.webp',t=>{t.colorSpace=THREE.SRGBColorSpace;scene.background=t;});}};
window.Stage3D={build,loadModel,setLayer,show,layers:()=>layers,
 spin:v=>spin=v===undefined?!spin:v,
 pan:v=>{ctl.enablePan=v;ctl.screenSpacePanning=true;},
 zoom:f=>{const d=cam.position.clone().sub(ctl.target).multiplyScalar(f);cam.position.copy(ctl.target).add(d);},
 scale:f=>{root.scale.multiplyScalar(f);},
 reset:()=>{root.scale.setScalar(1);root.rotation.y=0;root.position.set(0,.18,0);cam.position.set(0,1.4,4.6);ctl.target.set(0,1,0);},
 lighting:n=>LIGHTS[n]&&LIGHTS[n](),background:n=>BGS[n]&&BGS[n](),LIGHTS:Object.keys(LIGHTS),BGS:Object.keys(BGS),
 snapshot:()=>R.domElement.toDataURL('image/jpeg',.85)};
window.dispatchEvent(new Event('stage3d-ready'));
