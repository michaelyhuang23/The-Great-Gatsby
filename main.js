import './style.css';

import * as THREE from 'three';
//import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer, EffectPass, RenderPass, GodRaysEffect } from "postprocessing";


// Setup

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 2000);

let lightdisplace = 0;
const lightdist = 500;
const omegaC = 0.9;
let omega = omegaC;

const dumpGroundLoc = 130;
const myrtleLoc = 330;
const carLoc = 530;

const maxVisible = 100;
const minVisible = 50;



const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
  powerPreference: "high-performance",
  antialias: false,
  stencil: false,
  depth: false
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;


let fog = new THREE.Fog(0x001e0f, 1, 1500);

scene.fog = fog;

renderer.render(scene, camera);


let sun = new THREE.Vector3();

const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );
const water = new Water(
  waterGeometry,
  {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load( 'images/waternormals.jpg', function ( texture ) {

      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

    } ),
    sunDirection: new THREE.Vector3(),
    sunColor: 0xeeeeee,
    waterColor: 0x001e0f,
    distortionScale: 3.7,
    fog: scene.fog !== undefined
  }
);

water.rotation.x = - Math.PI / 2;

scene.add( water );


let texture_loader = new THREE.TextureLoader();
let tower_texture = texture_loader.load("images/tower.mtl");
const mloader = new GLTFLoader();
let tower;
mloader.load( 'images/tower.glb', function ( gltf ) {

  gltf.scene.traverse( function( object ) {

   if ( object.isMesh ) object.material.map = tower_texture;

  });

  gltf.scene.position.set(0,-2,lightdist);
  tower = gltf.scene;
  scene.add( tower );

});



const greenLightGeo = new THREE.SphereGeometry(2, 24, 24);
const greenLightMaterial = new THREE.MeshStandardMaterial({ color: 0x015e18, emissive: 0x015e18, emissiveIntensity:3 });
const greenLight = new THREE.Mesh(greenLightGeo, greenLightMaterial);
greenLight.position.set(0,30,lightdist);

const pointLight = new THREE.PointLight(0x015e18);
pointLight.position.set(0,30,lightdist-10);
scene.add(pointLight);


const sky = new Sky();
sky.scale.setScalar( 10000 );
scene.add( sky );

const skyUniforms = sky.material.uniforms;

skyUniforms[ 'turbidity' ].value = 0.1;
skyUniforms[ 'rayleigh' ].value = 0.005; // 0.005
skyUniforms[ 'mieCoefficient' ].value = 0.0000005; // 0.0000005
skyUniforms[ 'mieDirectionalG' ].value = 0.008;


const pmremGenerator = new THREE.PMREMGenerator( renderer );


sun.setFromSphericalCoords( 1, 1, 190 );

sky.material.uniforms[ 'sunPosition' ].value.copy( sun );
water.material.uniforms[ 'sunDirection' ].value.copy( sun ).normalize();

scene.environment = pmremGenerator.fromScene( sky ).texture;




const ambientLight = new THREE.AmbientLight(0xffffff);
ambientLight.intensity = 1;
scene.add(ambientLight);

// // Helpers

// const gridHelper = new THREE.GridHelper(200, 50);
// scene.add(gridHelper);

let godraysEffect = new GodRaysEffect(camera, greenLight, {
  resolutionScale: 1,
  density: 0.8,
  decay: 0.98,
  weight: 0.9,
  samples: 100
});


let renderPass = new RenderPass(scene, camera);
let effectPass = new EffectPass(camera,godraysEffect);
effectPass.renderToScreen = true;



let composer = new EffectComposer(renderer);
composer.addPass(renderPass);
composer.addPass(effectPass);


const rainCount = 100;
let rainDrops = [];

let loader = new THREE.TextureLoader();
loader.load("images/snow.png", function(texture){
  let rainGeo = new THREE.CircleGeometry(4,4);
  let rainMaterial = new THREE.MeshLambertMaterial({
    map: texture,
    transparent: true,
    opacity: 0.8,
    color: 0xFFFFFF
  });
  for(let i=0;i<rainCount;i++) {
    let rain = new THREE.Mesh(rainGeo,rainMaterial);
    rain.position.set(Math.random() * 200 -100,Math.random() * 200 +100,Math.random() * lightdist);
    rain.rotation.x = Math.PI + Math.random() * Math.PI/3;
    rain.rotation.y = Math.random() * Math.PI/3;
    rain.rotation.z = Math.random() * Math.PI * 2;
    rainDrops.push(rain);
    scene.add(rain);
  }
});


scene.add( greenLight );

//const controls = new OrbitControls(camera, renderer.domElement);

function addStar() {
  const geometry = new THREE.SphereGeometry(2, 24, 24);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const star = new THREE.Mesh(geometry, material);

  let theta = THREE.MathUtils.randFloatSpread(Math.PI);
  let phi = THREE.MathUtils.randFloatSpread(Math.PI*2);
  let r = THREE.MathUtils.randFloatSpread(1000)+1500;
  let y = r*Math.cos(theta);
  let rho = r*Math.sin(theta);
  let x = rho*Math.sin(phi);
  let z = rho*Math.cos(phi);

  star.position.set(x, y, z);
  scene.add(star);
}

Array(2000).fill().forEach(addStar);

// Background

// const spaceTexture = new THREE.TextureLoader().load('images/eckleburg.webp');
// scene.background = spaceTexture;




function makeImage(image, location, right){
  const texture = new THREE.TextureLoader().load('images/'+image);
  const geo = new THREE.PlaneGeometry(50,50);
  const obj = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({map:texture}));
  let x_d = 30; 
  if(right){
    x_d *= -1;
  }
  obj.position.set(x_d,22,location);
  obj.rotation.set(0,Math.PI,0);
  obj.material.transparent = true;
  scene.add(obj);
  return obj;
}


let dumpGround = makeImage('dump-ground.png', dumpGroundLoc, true);
let myrtle = makeImage('myrtle.png', myrtleLoc, false);
let deathCar = makeImage('death-car.jpg', carLoc, true);


camera.position.set(0,20,0);
camera.lookAt( new THREE.Vector3(0,30,200) );




// Scroll Animation

function moveCamera() {
  const t = document.body.getBoundingClientRect().top;
  camera.position.z = -t * 0.1;
  lightdisplace = -t * 0.1;
  greenLight.position.z = lightdisplace + lightdist;
  pointLight.position.z = lightdisplace + lightdist - 10;
  tower.position.z = lightdisplace + lightdist;
}

document.body.onscroll = moveCamera;

// Animation Loop

function fadeIn(obj){
  let dist = Math.abs(obj.position.z - camera.position.z);
  if(dist > maxVisible){
    obj.material.opacity = 0; 
  }else if(dist < minVisible){
    obj.material.opacity = 1;
  }else{
    obj.material.opacity = 1-(dist-minVisible)/(maxVisible-minVisible);
  }
}

let tt = 0;

function animate() {
  requestAnimationFrame(animate);

  fadeIn(dumpGround);
  fadeIn(myrtle);
  fadeIn(deathCar);

  tt += 1/60.0*omega;

  godraysEffect.godRaysMaterial.uniforms.decay.value = Math.abs(Math.sin(tt))/2+0.48;

  if(tt >= 2*Math.PI){
    tt = 0;
    omega = Math.random()*0.5+omegaC;
  }

  water.material.uniforms[ 'time' ].value += 2.0 / 60.0;

  rainDrops.forEach(p => {
    p.position.y -= 1;
    if(p.position.y <= 0){
      p.position.set(Math.random() * 200 -100,Math.random() * 200 +100,lightdisplace + Math.random() * lightdist);
    }
  });

  //controls.update();

  composer.render(0.1);
}

animate();








/*!
// ███   █    ████▄    ▄▄▄▄▀ ▄▄▄▄▀ ▄███▄   █▄▄▄▄
// █  █  █    █   █ ▀▀▀ █ ▀▀▀ █    █▀   ▀  █  ▄▀
// █ ▀ ▄ █    █   █     █     █    ██▄▄    █▀▀▌
// █  ▄▀ ███▄ ▀████    █     █     █▄   ▄▀ █  █
// ███       ▀        ▀     ▀      ▀███▀     █
//                                          ▀
// The MIT License
//
// Copyright © 1986 - ∞, Blotter / Bradley Griffith / http://bradley.computer
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
*/
!function(){var a="object"==typeof self&&self.self===self&&self||"object"==typeof global&&global.global===global&&global||this,b=a._,c=Array.prototype,d=Object.prototype,e="undefined"!=typeof Symbol?Symbol.prototype:null,f=c.push,g=c.slice,h=d.toString,i=d.hasOwnProperty,j=Array.isArray,k=Object.keys,l=Object.create,m=function(){},n=function(a){return a instanceof n?a:this instanceof n?void(this._wrapped=a):new n(a)};"undefined"==typeof exports||exports.nodeType?a._=n:("undefined"!=typeof module&&!module.nodeType&&module.exports&&(exports=module.exports=n),exports._=n),n.VERSION="1.8.3";var o,p=function(a,b,c){if(void 0===b)return a;switch(null==c?3:c){case 1:return function(c){return a.call(b,c)};case 3:return function(c,d,e){return a.call(b,c,d,e)};case 4:return function(c,d,e,f){return a.call(b,c,d,e,f)}}return function(){return a.apply(b,arguments)}},q=function(a,b,c){return n.iteratee!==o?n.iteratee(a,b):null==a?n.identity:n.isFunction(a)?p(a,b,c):n.isObject(a)?n.matcher(a):n.property(a)};n.iteratee=o=function(a,b){return q(a,b,1/0)};var r=function(a,b){return b=null==b?a.length-1:+b,function(){for(var c=Math.max(arguments.length-b,0),d=Array(c),e=0;e<c;e++)d[e]=arguments[e+b];switch(b){case 0:return a.call(this,d);case 1:return a.call(this,arguments[0],d);case 2:return a.call(this,arguments[0],arguments[1],d)}var f=Array(b+1);for(e=0;e<b;e++)f[e]=arguments[e];return f[b]=d,a.apply(this,f)}},s=function(a){if(!n.isObject(a))return{};if(l)return l(a);m.prototype=a;var b=new m;return m.prototype=null,b},t=function(a){return function(b){return null==b?void 0:b[a]}},u=Math.pow(2,53)-1,v=t("length"),w=function(a){var b=v(a);return"number"==typeof b&&b>=0&&b<=u};n.each=n.forEach=function(a,b,c){b=p(b,c);var d,e;if(w(a))for(d=0,e=a.length;d<e;d++)b(a[d],d,a);else{var f=n.keys(a);for(d=0,e=f.length;d<e;d++)b(a[f[d]],f[d],a)}return a},n.map=n.collect=function(a,b,c){b=q(b,c);for(var d=!w(a)&&n.keys(a),e=(d||a).length,f=Array(e),g=0;g<e;g++){var h=d?d[g]:g;f[g]=b(a[h],h,a)}return f};var x=function(a){var b=function(b,c,d,e){var f=!w(b)&&n.keys(b),g=(f||b).length,h=a>0?0:g-1;for(e||(d=b[f?f[h]:h],h+=a);h>=0&&h<g;h+=a){var i=f?f[h]:h;d=c(d,b[i],i,b)}return d};return function(a,c,d,e){var f=arguments.length>=3;return b(a,p(c,e,4),d,f)}};n.reduce=n.foldl=n.inject=x(1),n.reduceRight=n.foldr=x(-1),n.find=n.detect=function(a,b,c){var d=w(a)?n.findIndex:n.findKey,e=d(a,b,c);if(void 0!==e&&-1!==e)return a[e]},n.filter=n.select=function(a,b,c){var d=[];return b=q(b,c),n.each(a,function(a,c,e){b(a,c,e)&&d.push(a)}),d},n.reject=function(a,b,c){return n.filter(a,n.negate(q(b)),c)},n.every=n.all=function(a,b,c){b=q(b,c);for(var d=!w(a)&&n.keys(a),e=(d||a).length,f=0;f<e;f++){var g=d?d[f]:f;if(!b(a[g],g,a))return!1}return!0},n.some=n.any=function(a,b,c){b=q(b,c);for(var d=!w(a)&&n.keys(a),e=(d||a).length,f=0;f<e;f++){var g=d?d[f]:f;if(b(a[g],g,a))return!0}return!1},n.contains=n.includes=n.include=function(a,b,c,d){return w(a)||(a=n.values(a)),("number"!=typeof c||d)&&(c=0),n.indexOf(a,b,c)>=0},n.invoke=r(function(a,b,c){var d=n.isFunction(b);return n.map(a,function(a){var e=d?b:a[b];return null==e?e:e.apply(a,c)})}),n.pluck=function(a,b){return n.map(a,n.property(b))},n.where=function(a,b){return n.filter(a,n.matcher(b))},n.findWhere=function(a,b){return n.find(a,n.matcher(b))},n.max=function(a,b,c){var d,e,f=-1/0,g=-1/0;if(null==b||"number"==typeof b&&"object"!=typeof a[0]&&null!=a){a=w(a)?a:n.values(a);for(var h=0,i=a.length;h<i;h++)null!=(d=a[h])&&d>f&&(f=d)}else b=q(b,c),n.each(a,function(a,c,d){((e=b(a,c,d))>g||e===-1/0&&f===-1/0)&&(f=a,g=e)});return f},n.min=function(a,b,c){var d,e,f=1/0,g=1/0;if(null==b||"number"==typeof b&&"object"!=typeof a[0]&&null!=a){a=w(a)?a:n.values(a);for(var h=0,i=a.length;h<i;h++)null!=(d=a[h])&&d<f&&(f=d)}else b=q(b,c),n.each(a,function(a,c,d){((e=b(a,c,d))<g||e===1/0&&f===1/0)&&(f=a,g=e)});return f},n.shuffle=function(a){return n.sample(a,1/0)},n.sample=function(a,b,c){if(null==b||c)return w(a)||(a=n.values(a)),a[n.random(a.length-1)];var d=w(a)?n.clone(a):n.values(a),e=v(d);b=Math.max(Math.min(b,e),0);for(var f=e-1,g=0;g<b;g++){var h=n.random(g,f),i=d[g];d[g]=d[h],d[h]=i}return d.slice(0,b)},n.sortBy=function(a,b,c){var d=0;return b=q(b,c),n.pluck(n.map(a,function(a,c,e){return{value:a,index:d++,criteria:b(a,c,e)}}).sort(function(a,b){var c=a.criteria,d=b.criteria;if(c!==d){if(c>d||void 0===c)return 1;if(c<d||void 0===d)return-1}return a.index-b.index}),"value")};var y=function(a,b){return function(c,d,e){var f=b?[[],[]]:{};return d=q(d,e),n.each(c,function(b,e){var g=d(b,e,c);a(f,b,g)}),f}};n.groupBy=y(function(a,b,c){n.has(a,c)?a[c].push(b):a[c]=[b]}),n.indexBy=y(function(a,b,c){a[c]=b}),n.countBy=y(function(a,b,c){n.has(a,c)?a[c]++:a[c]=1});var z=/[^\ud800-\udfff]|[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff]/g;n.toArray=function(a){return a?n.isArray(a)?g.call(a):n.isString(a)?a.match(z):w(a)?n.map(a,n.identity):n.values(a):[]},n.size=function(a){return null==a?0:w(a)?a.length:n.keys(a).length},n.partition=y(function(a,b,c){a[c?0:1].push(b)},!0),n.first=n.head=n.take=function(a,b,c){if(null!=a)return null==b||c?a[0]:n.initial(a,a.length-b)},n.initial=function(a,b,c){return g.call(a,0,Math.max(0,a.length-(null==b||c?1:b)))},n.last=function(a,b,c){if(null!=a)return null==b||c?a[a.length-1]:n.rest(a,Math.max(0,a.length-b))},n.rest=n.tail=n.drop=function(a,b,c){return g.call(a,null==b||c?1:b)},n.compact=function(a){return n.filter(a,Boolean)};var A=function(a,b,c,d){d=d||[];for(var e=d.length,f=0,g=v(a);f<g;f++){var h=a[f];if(w(h)&&(n.isArray(h)||n.isArguments(h)))if(b)for(var i=0,j=h.length;i<j;)d[e++]=h[i++];else A(h,b,c,d),e=d.length;else c||(d[e++]=h)}return d};n.flatten=function(a,b){return A(a,b,!1)},n.without=r(function(a,b){return n.difference(a,b)}),n.uniq=n.unique=function(a,b,c,d){n.isBoolean(b)||(d=c,c=b,b=!1),null!=c&&(c=q(c,d));for(var e=[],f=[],g=0,h=v(a);g<h;g++){var i=a[g],j=c?c(i,g,a):i;b?(g&&f===j||e.push(i),f=j):c?n.contains(f,j)||(f.push(j),e.push(i)):n.contains(e,i)||e.push(i)}return e},n.union=r(function(a){return n.uniq(A(a,!0,!0))}),n.intersection=function(a){for(var b=[],c=arguments.length,d=0,e=v(a);d<e;d++){var f=a[d];if(!n.contains(b,f)){var g;for(g=1;g<c&&n.contains(arguments[g],f);g++);g===c&&b.push(f)}}return b},n.difference=r(function(a,b){return b=A(b,!0,!0),n.filter(a,function(a){return!n.contains(b,a)})}),n.unzip=function(a){for(var b=a&&n.max(a,v).length||0,c=Array(b),d=0;d<b;d++)c[d]=n.pluck(a,d);return c},n.zip=r(n.unzip),n.object=function(a,b){for(var c={},d=0,e=v(a);d<e;d++)b?c[a[d]]=b[d]:c[a[d][0]]=a[d][1];return c};var B=function(a){return function(b,c,d){c=q(c,d);for(var e=v(b),f=a>0?0:e-1;f>=0&&f<e;f+=a)if(c(b[f],f,b))return f;return-1}};n.findIndex=B(1),n.findLastIndex=B(-1),n.sortedIndex=function(a,b,c,d){c=q(c,d,1);for(var e=c(b),f=0,g=v(a);f<g;){var h=Math.floor((f+g)/2);c(a[h])<e?f=h+1:g=h}return f};var C=function(a,b,c){return function(d,e,f){var h=0,i=v(d);if("number"==typeof f)a>0?h=f>=0?f:Math.max(f+i,h):i=f>=0?Math.min(f+1,i):f+i+1;else if(c&&f&&i)return f=c(d,e),d[f]===e?f:-1;if(e!==e)return f=b(g.call(d,h,i),n.isNaN),f>=0?f+h:-1;for(f=a>0?h:i-1;f>=0&&f<i;f+=a)if(d[f]===e)return f;return-1}};n.indexOf=C(1,n.findIndex,n.sortedIndex),n.lastIndexOf=C(-1,n.findLastIndex),n.range=function(a,b,c){null==b&&(b=a||0,a=0),c||(c=b<a?-1:1);for(var d=Math.max(Math.ceil((b-a)/c),0),e=Array(d),f=0;f<d;f++,a+=c)e[f]=a;return e},n.chunk=function(a,b){if(null==b||b<1)return[];for(var c=[],d=0,e=a.length;d<e;)c.push(g.call(a,d,d+=b));return c};var D=function(a,b,c,d,e){if(!(d instanceof b))return a.apply(c,e);var f=s(a.prototype),g=a.apply(f,e);return n.isObject(g)?g:f};n.bind=r(function(a,b,c){if(!n.isFunction(a))throw new TypeError("Bind must be called on a function");var d=r(function(e){return D(a,d,b,this,c.concat(e))});return d}),n.partial=r(function(a,b){var c=n.partial.placeholder,d=function(){for(var e=0,f=b.length,g=Array(f),h=0;h<f;h++)g[h]=b[h]===c?arguments[e++]:b[h];for(;e<arguments.length;)g.push(arguments[e++]);return D(a,d,this,this,g)};return d}),n.partial.placeholder=n,n.bindAll=r(function(a,b){b=A(b,!1,!1);var c=b.length;if(c<1)throw new Error("bindAll must be passed function names");for(;c--;){var d=b[c];a[d]=n.bind(a[d],a)}}),n.memoize=function(a,b){var c=function(d){var e=c.cache,f=""+(b?b.apply(this,arguments):d);return n.has(e,f)||(e[f]=a.apply(this,arguments)),e[f]};return c.cache={},c},n.delay=r(function(a,b,c){return setTimeout(function(){return a.apply(null,c)},b)}),n.defer=n.partial(n.delay,n,1),n.throttle=function(a,b,c){var d,e,f,g,h=0;c||(c={});var i=function(){h=!1===c.leading?0:n.now(),d=null,g=a.apply(e,f),d||(e=f=null)},j=function(){var j=n.now();h||!1!==c.leading||(h=j);var k=b-(j-h);return e=this,f=arguments,k<=0||k>b?(d&&(clearTimeout(d),d=null),h=j,g=a.apply(e,f),d||(e=f=null)):d||!1===c.trailing||(d=setTimeout(i,k)),g};return j.cancel=function(){clearTimeout(d),h=0,d=e=f=null},j},n.debounce=function(a,b,c){var d,e,f=function(b,c){d=null,c&&(e=a.apply(b,c))},g=r(function(g){if(d&&clearTimeout(d),c){var h=!d;d=setTimeout(f,b),h&&(e=a.apply(this,g))}else d=n.delay(f,b,this,g);return e});return g.cancel=function(){clearTimeout(d),d=null},g},n.wrap=function(a,b){return n.partial(b,a)},n.negate=function(a){return function(){return!a.apply(this,arguments)}},n.compose=function(){var a=arguments,b=a.length-1;return function(){for(var c=b,d=a[b].apply(this,arguments);c--;)d=a[c].call(this,d);return d}},n.after=function(a,b){return function(){if(--a<1)return b.apply(this,arguments)}},n.before=function(a,b){var c;return function(){return--a>0&&(c=b.apply(this,arguments)),a<=1&&(b=null),c}},n.once=n.partial(n.before,2),n.restArgs=r;var E=!{toString:null}.propertyIsEnumerable("toString"),F=["valueOf","isPrototypeOf","toString","propertyIsEnumerable","hasOwnProperty","toLocaleString"],G=function(a,b){var c=F.length,e=a.constructor,f=n.isFunction(e)&&e.prototype||d,g="constructor";for(n.has(a,g)&&!n.contains(b,g)&&b.push(g);c--;)(g=F[c])in a&&a[g]!==f[g]&&!n.contains(b,g)&&b.push(g)};n.keys=function(a){if(!n.isObject(a))return[];if(k)return k(a);var b=[];for(var c in a)n.has(a,c)&&b.push(c);return E&&G(a,b),b},n.allKeys=function(a){if(!n.isObject(a))return[];var b=[];for(var c in a)b.push(c);return E&&G(a,b),b},n.values=function(a){for(var b=n.keys(a),c=b.length,d=Array(c),e=0;e<c;e++)d[e]=a[b[e]];return d},n.mapObject=function(a,b,c){b=q(b,c);for(var d=n.keys(a),e=d.length,f={},g=0;g<e;g++){var h=d[g];f[h]=b(a[h],h,a)}return f},n.pairs=function(a){for(var b=n.keys(a),c=b.length,d=Array(c),e=0;e<c;e++)d[e]=[b[e],a[b[e]]];return d},n.invert=function(a){for(var b={},c=n.keys(a),d=0,e=c.length;d<e;d++)b[a[c[d]]]=c[d];return b},n.functions=n.methods=function(a){var b=[];for(var c in a)n.isFunction(a[c])&&b.push(c);return b.sort()};var H=function(a,b){return function(c){var d=arguments.length;if(b&&(c=Object(c)),d<2||null==c)return c;for(var e=1;e<d;e++)for(var f=arguments[e],g=a(f),h=g.length,i=0;i<h;i++){var j=g[i];b&&void 0!==c[j]||(c[j]=f[j])}return c}};n.extend=H(n.allKeys),n.extendOwn=n.assign=H(n.keys),n.findKey=function(a,b,c){b=q(b,c);for(var d,e=n.keys(a),f=0,g=e.length;f<g;f++)if(d=e[f],b(a[d],d,a))return d};var I=function(a,b,c){return b in c};n.pick=r(function(a,b){var c={},d=b[0];if(null==a)return c;n.isFunction(d)?(b.length>1&&(d=p(d,b[1])),b=n.allKeys(a)):(d=I,b=A(b,!1,!1),a=Object(a));for(var e=0,f=b.length;e<f;e++){var g=b[e],h=a[g];d(h,g,a)&&(c[g]=h)}return c}),n.omit=r(function(a,b){var c,d=b[0];return n.isFunction(d)?(d=n.negate(d),b.length>1&&(c=b[1])):(b=n.map(A(b,!1,!1),String),d=function(a,c){return!n.contains(b,c)}),n.pick(a,d,c)}),n.defaults=H(n.allKeys,!0),n.create=function(a,b){var c=s(a);return b&&n.extendOwn(c,b),c},n.clone=function(a){return n.isObject(a)?n.isArray(a)?a.slice():n.extend({},a):a},n.tap=function(a,b){return b(a),a},n.isMatch=function(a,b){var c=n.keys(b),d=c.length;if(null==a)return!d;for(var e=Object(a),f=0;f<d;f++){var g=c[f];if(b[g]!==e[g]||!(g in e))return!1}return!0};var J,K;J=function(a,b,c,d){if(a===b)return 0!==a||1/a==1/b;if(null==a||null==b)return a===b;if(a!==a)return b!==b;var e=typeof a;return("function"===e||"object"===e||"object"==typeof b)&&K(a,b,c,d)},K=function(a,b,c,d){a instanceof n&&(a=a._wrapped),b instanceof n&&(b=b._wrapped);var f=h.call(a);if(f!==h.call(b))return!1;switch(f){case"[object RegExp]":case"[object String]":return""+a==""+b;case"[object Number]":return+a!=+a?+b!=+b:0==+a?1/+a==1/b:+a==+b;case"[object Date]":case"[object Boolean]":return+a==+b;case"[object Symbol]":return e.valueOf.call(a)===e.valueOf.call(b)}var g="[object Array]"===f;if(!g){if("object"!=typeof a||"object"!=typeof b)return!1;var i=a.constructor,j=b.constructor;if(i!==j&&!(n.isFunction(i)&&i instanceof i&&n.isFunction(j)&&j instanceof j)&&"constructor"in a&&"constructor"in b)return!1}c=c||[],d=d||[];for(var k=c.length;k--;)if(c[k]===a)return d[k]===b;if(c.push(a),d.push(b),g){if((k=a.length)!==b.length)return!1;for(;k--;)if(!J(a[k],b[k],c,d))return!1}else{var l,m=n.keys(a);if(k=m.length,n.keys(b).length!==k)return!1;for(;k--;)if(l=m[k],!n.has(b,l)||!J(a[l],b[l],c,d))return!1}return c.pop(),d.pop(),!0},n.isEqual=function(a,b){return J(a,b)},n.isEmpty=function(a){return null==a||(w(a)&&(n.isArray(a)||n.isString(a)||n.isArguments(a))?0===a.length:0===n.keys(a).length)},n.isElement=function(a){return!(!a||1!==a.nodeType)},n.isArray=j||function(a){return"[object Array]"===h.call(a)},n.isObject=function(a){var b=typeof a;return"function"===b||"object"===b&&!!a},n.each(["Arguments","Function","String","Number","Date","RegExp","Error","Symbol","Map","WeakMap","Set","WeakSet"],function(a){n["is"+a]=function(b){return h.call(b)==="[object "+a+"]"}}),n.isArguments(arguments)||(n.isArguments=function(a){return n.has(a,"callee")});var L=a.document&&a.document.childNodes;"function"!=typeof/./&&"object"!=typeof Int8Array&&"function"!=typeof L&&(n.isFunction=function(a){return"function"==typeof a||!1}),n.isFinite=function(a){return!n.isSymbol(a)&&isFinite(a)&&!isNaN(parseFloat(a))},n.isNaN=function(a){return isNaN(a)&&n.isNumber(a)},n.isBoolean=function(a){return!0===a||!1===a||"[object Boolean]"===h.call(a)},n.isNull=function(a){return null===a},n.isUndefined=function(a){return void 0===a},n.has=function(a,b){return null!=a&&i.call(a,b)},n.noConflict=function(){return a._=b,this},n.identity=function(a){return a},n.constant=function(a){return function(){return a}},n.noop=function(){},n.property=t,n.propertyOf=function(a){return null==a?function(){}:function(b){return a[b]}},n.matcher=n.matches=function(a){return a=n.extendOwn({},a),function(b){return n.isMatch(b,a)}},n.times=function(a,b,c){var d=Array(Math.max(0,a));b=p(b,c,1);for(var e=0;e<a;e++)d[e]=b(e);return d},n.random=function(a,b){return null==b&&(b=a,a=0),a+Math.floor(Math.random()*(b-a+1))},n.now=Date.now||function(){return(new Date).getTime()};var M={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;","`":"&#x60;"},N=n.invert(M),O=function(a){var b=function(b){return a[b]},c="(?:"+n.keys(a).join("|")+")",d=RegExp(c),e=RegExp(c,"g");return function(a){return a=null==a?"":""+a,d.test(a)?a.replace(e,b):a}};n.escape=O(M),n.unescape=O(N),n.result=function(a,b,c){var d=null==a?void 0:a[b];return void 0===d&&(d=c),n.isFunction(d)?d.call(a):d};var P=0;n.uniqueId=function(a){var b=++P+"";return a?a+b:b},n.templateSettings={evaluate:/<%([\s\S]+?)%>/g,interpolate:/<%=([\s\S]+?)%>/g,escape:/<%-([\s\S]+?)%>/g};var Q=/(.)^/,R={"'":"'","\\":"\\","\r":"r","\n":"n","\u2028":"u2028","\u2029":"u2029"},S=/\\|'|\r|\n|\u2028|\u2029/g,T=function(a){return"\\"+R[a]};n.template=function(a,b,c){!b&&c&&(b=c),b=n.defaults({},b,n.templateSettings);var d=RegExp([(b.escape||Q).source,(b.interpolate||Q).source,(b.evaluate||Q).source].join("|")+"|$","g"),e=0,f="__p+='";a.replace(d,function(b,c,d,g,h){return f+=a.slice(e,h).replace(S,T),e=h+b.length,c?f+="'+\n((__t=("+c+"))==null?'':_.escape(__t))+\n'":d?f+="'+\n((__t=("+d+"))==null?'':__t)+\n'":g&&(f+="';\n"+g+"\n__p+='"),b}),f+="';\n",b.variable||(f="with(obj||{}){\n"+f+"}\n"),f="var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};\n"+f+"return __p;\n";var g;try{g=new Function(b.variable||"obj","_",f)}catch(a){throw a.source=f,a}var h=function(a){return g.call(this,a,n)},i=b.variable||"obj";return h.source="function("+i+"){\n"+f+"}",h},n.chain=function(a){var b=n(a);return b._chain=!0,b};var U=function(a,b){return a._chain?n(b).chain():b};n.mixin=function(a){return n.each(n.functions(a),function(b){var c=n[b]=a[b];n.prototype[b]=function(){var a=[this._wrapped];return f.apply(a,arguments),U(this,c.apply(n,a))}}),n},n.mixin(n),n.each(["pop","push","reverse","shift","sort","splice","unshift"],function(a){var b=c[a];n.prototype[a]=function(){var c=this._wrapped;return b.apply(c,arguments),"shift"!==a&&"splice"!==a||0!==c.length||delete c[0],U(this,c)}}),n.each(["concat","join","slice"],function(a){var b=c[a];n.prototype[a]=function(){return U(this,b.apply(this._wrapped,arguments))}}),n.prototype.value=function(){return this._wrapped},n.prototype.valueOf=n.prototype.toJSON=n.prototype.value,n.prototype.toString=function(){return""+this._wrapped},"function"==typeof define&&define.amd&&define("underscore",[],function(){return n})}();var Detector={canvas:!!window.CanvasRenderingContext2D,webgl:function(){try{var a=document.createElement("canvas");return!(!window.WebGLRenderingContext||!a.getContext("webgl")&&!a.getContext("experimental-webgl"))}catch(a){return!1}}(),workers:!!window.Worker,fileapi:window.File&&window.FileReader&&window.FileList&&window.Blob,getWebGLErrorMessage:function(){var a=document.createElement("div");return a.id="webgl-error-message",a.style.fontFamily="monospace",a.style.fontSize="13px",a.style.fontWeight="normal",a.style.textAlign="center",a.style.background="#fff",a.style.color="#000",a.style.padding="1.5em",a.style.width="400px",a.style.margin="5em auto 0",this.webgl||(a.innerHTML=window.WebGLRenderingContext?['Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br />','Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'].join("\n"):['Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br/>','Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'].join("\n")),a},addGetWebGLMessage:function(a){var b,c,d;a=a||{},b=void 0!==a.parent?a.parent:document.body,c=void 0!==a.id?a.id:"oldie",d=Detector.getWebGLErrorMessage(),d.id=c,b.appendChild(d)}};"object"==typeof module&&(module.exports=Detector),function(a,b){"use strict";function c(){if(a.postMessage&&!a.importScripts){var b=!0,c=a.onmessage;return a.onmessage=function(){b=!1},a.postMessage("","*"),a.onmessage=c,b}}function d(){return a.navigator&&/Trident/.test(a.navigator.userAgent)}if(!d()&&(a.msSetImmediate||a.setImmediate))return void(a.setImmediate||(a.setImmediate=a.msSetImmediate,a.clearImmediate=a.msClearImmediate));var e=a.document,f=Array.prototype.slice,g=Object.prototype.toString,h={};h.polifill={},h.nextId=1,h.tasks={},h.lock=!1,h.run=function(b){if(h.lock)a.setTimeout(h.wrap(h.run,b),0);else{var c=h.tasks[b];if(c){h.lock=!0;try{c()}finally{h.clear(b),h.lock=!1}}}},h.wrap=function(a){var c=f.call(arguments,1);return function(){a.apply(b,c)}},h.create=function(a){return h.tasks[h.nextId]=h.wrap.apply(b,a),h.nextId++},h.clear=function(a){delete h.tasks[a]},h.polifill.messageChannel=function(){var b=new a.MessageChannel;return b.port1.onmessage=function(a){h.run(Number(a.data))},function(){var a=h.create(arguments);return b.port2.postMessage(a),a}},h.polifill.nextTick=function(){return function(){var b=h.create(arguments);return a.process.nextTick(h.wrap(h.run,b)),b}},h.polifill.postMessage=function(){var b="setImmediate$"+Math.random()+"$",c=function(c){c.source===a&&"string"==typeof c.data&&0===c.data.indexOf(b)&&h.run(Number(c.data.slice(b.length)))};return a.addEventListener?a.addEventListener("message",c,!1):a.attachEvent("onmessage",c),function(){var c=h.create(arguments);return a.postMessage(b+c,"*"),c}},h.polifill.readyStateChange=function(){var a=e.documentElement;return function(){var b=h.create(arguments),c=e.createElement("script");return c.onreadystatechange=function(){h.run(b),c.onreadystatechange=null,a.removeChild(c),c=null},a.appendChild(c),b}},h.polifill.setTimeout=function(){return function(){var b=h.create(arguments);return a.setTimeout(h.wrap(h.run,b),0),b}};var i;i=d()?"setTimeout":"[object process]"===g.call(a.process)?"nextTick":c()?"postMessage":a.MessageChannel?"messageChannel":e&&"onreadystatechange"in e.createElement("script")?"readyStateChange":"setTimeout";var j=Object.getPrototypeOf&&Object.getPrototypeOf(a);j=j&&j.setTimeout?j:a,j.setImmediate=h.polifill[i](),j.setImmediate.usePolifill=i,j.msSetImmediate=j.setImmediate,j.clearImmediate=h.clear,j.msClearImmediate=h.clear}(function(){return this||(0,eval)("this")}()),function(){"use strict";function a(){}function b(a,b){for(var c=a.length;c--;)if(a[c].listener===b)return c;return-1}function c(a){return function(){return this[a].apply(this,arguments)}}var d=a.prototype,e=this,f=e.EventEmitter;d.getListeners=function(a){var b,c,d=this._getEvents();if(a instanceof RegExp){b={};for(c in d)d.hasOwnProperty(c)&&a.test(c)&&(b[c]=d[c])}else b=d[a]||(d[a]=[]);return b},d.flattenListeners=function(a){var b,c=[];for(b=0;b<a.length;b+=1)c.push(a[b].listener);return c},d.getListenersAsObject=function(a){var b,c=this.getListeners(a);return c instanceof Array&&(b={},b[a]=c),b||c},d.addListener=function(a,c){var d,e=this.getListenersAsObject(a),f="object"==typeof c;for(d in e)e.hasOwnProperty(d)&&-1===b(e[d],c)&&e[d].push(f?c:{listener:c,once:!1});return this},d.on=c("addListener"),d.addOnceListener=function(a,b){return this.addListener(a,{listener:b,once:!0})},d.once=c("addOnceListener"),d.defineEvent=function(a){return this.getListeners(a),this},d.defineEvents=function(a){for(var b=0;b<a.length;b+=1)this.defineEvent(a[b]);return this},d.removeListener=function(a,c){var d,e,f=this.getListenersAsObject(a);for(e in f)f.hasOwnProperty(e)&&-1!==(d=b(f[e],c))&&f[e].splice(d,1);return this},d.off=c("removeListener"),d.addListeners=function(a,b){return this.manipulateListeners(!1,a,b)},d.removeListeners=function(a,b){return this.manipulateListeners(!0,a,b)},d.manipulateListeners=function(a,b,c){var d,e,f=a?this.removeListener:this.addListener,g=a?this.removeListeners:this.addListeners;if("object"!=typeof b||b instanceof RegExp)for(d=c.length;d--;)f.call(this,b,c[d]);else for(d in b)b.hasOwnProperty(d)&&(e=b[d])&&("function"==typeof e?f.call(this,d,e):g.call(this,d,e));return this},d.removeEvent=function(a){var b,c=typeof a,d=this._getEvents();if("string"===c)delete d[a];else if(a instanceof RegExp)for(b in d)d.hasOwnProperty(b)&&a.test(b)&&delete d[b];else delete this._events;return this},d.removeAllListeners=c("removeEvent"),d.emitEvent=function(a,b){var c,d,e,f,g=this.getListenersAsObject(a);for(f in g)if(g.hasOwnProperty(f))for(c=g[f].slice(0),e=c.length;e--;)d=c[e],!0===d.once&&this.removeListener(a,d.listener),d.listener.apply(this,b||[])===this._getOnceReturnValue()&&this.removeListener(a,d.listener);return this},d.trigger=c("emitEvent"),d.emit=function(a){var b=Array.prototype.slice.call(arguments,1);return this.emitEvent(a,b)},d.setOnceReturnValue=function(a){return this._onceReturnValue=a,this},d._getOnceReturnValue=function(){return!this.hasOwnProperty("_onceReturnValue")||this._onceReturnValue},d._getEvents=function(){return this._events||(this._events={})},a.noConflict=function(){return e.EventEmitter=f,a},"function"==typeof define&&define.amd?define(function(){return a}):"object"==typeof module&&module.exports?module.exports=a:e.EventEmitter=a}.call(this),GrowingPacker=function(){},GrowingPacker.prototype={fit:function(a){var b,c,d,e=a.length,f=e>0?a[0].w:0,g=e>0?a[0].h:0;for(this.root={x:0,y:0,w:f,h:g},b=0;b<e;b++)d=a[b],(c=this.findNode(this.root,d.w,d.h))?d.fit=this.splitNode(c,d.w,d.h):d.fit=this.growNode(d.w,d.h)},findNode:function(a,b,c){return a.used?this.findNode(a.right,b,c)||this.findNode(a.down,b,c):b<=a.w&&c<=a.h?a:null},splitNode:function(a,b,c){return a.used=!0,a.down={x:a.x,y:a.y+c,w:a.w,h:a.h-c},a.right={x:a.x+b,y:a.y,w:a.w-b,h:c},a},growNode:function(a,b){var c=a<=this.root.w,d=b<=this.root.h,e=d&&this.root.h>=this.root.w+a,f=c&&this.root.w>=this.root.h+b;return e?this.growRight(a,b):f?this.growDown(a,b):d?this.growRight(a,b):c?this.growDown(a,b):null},growRight:function(a,b){this.root={used:!0,x:0,y:0,w:this.root.w+a,h:this.root.h,down:this.root,right:{x:this.root.w,y:0,w:a,h:this.root.h}};var c=this.findNode(this.root,a,b);return c?this.splitNode(c,a,b):null},growDown:function(a,b){this.root={used:!0,x:0,y:0,w:this.root.w,h:this.root.h+b,down:{x:0,y:this.root.h,w:this.root.w,h:b},right:this.root};var c=this.findNode(this.root,a,b);return c?this.splitNode(c,a,b):null}},function(){function a(a,d){var e=(new Date).getTime(),f=Math.max(0,16-(e-c)),g=b.setTimeout(function(){a(e+f)},f);return c=e+f,g}for(var b=this,c=0,d=["ms","moz","webkit","o"],e=0;e<d.length&&!b.requestAnimationFrame;++e)b.requestAnimationFrame=b[d[e]+"RequestAnimationFrame"],b.cancelAnimationFrame=b[d[e]+"CancelAnimationFrame"]||b[d[e]+"CancelRequestAnimationFrame"];b.requestAnimationFrame||(b.requestAnimationFrame=a),b.cancelAnimationFrame||(b.cancelAnimationFrame=function(a){clearTimeout(a)}),"undefined"!=typeof exports?("undefined"!=typeof module&&module.exports&&(exports=module.exports=b.requestAnimationFrame),exports.requestAnimationFrame=b.requestAnimationFrame):b.requestAnimationFrame=b.requestAnimationFrame,"function"==typeof define&&define.amd&&define("requestAnimationFrame",[],function(){return b.requestAnimationFrame})}(),function(a,b,c,d,e){var f=this,g=f.Blotter=a=function(a,b){d.webgl||g.Messaging.throwError("Blotter",!1,"device does not support webgl"),this._texts=[],this._textEventBindings={},this._scopes={},this._scopeEventBindings={},this._renderer=new g.Renderer,this._startTime=0,this._lastDrawTime=0,this.init.apply(this,arguments)};g.prototype=function(){function a(){var a=Date.now();this._material.uniforms.uTimeDelta.value=(a-(this._lastDrawTime||a))/1e3,this._material.uniforms.uGlobalTime.value=(a-this._startTime)/1e3,this._lastDrawTime=a}function c(){a.call(this),b.each(this._scopes,b.bind(function(a){a.playing&&a.render(),this.trigger("render")},this))}function d(a){if(this.mappingMaterial){var b=this._material.uniforms[a].value;this.mappingMaterial.uniformInterface[a].value=b}}function e(a,b){if(this.mappingMaterial){var c=this._scopes[a],d=c.material.uniforms[b].value;this.mappingMaterial.textUniformInterface[a][b].value=d}}function f(){var a,c,d;a=b.bind(function(){return b.bind(function(a){g.MappingBuilder.build(this._texts,b.bind(function(b){this._mapping=b,this._mapping.ratio=this.ratio,a()},this))},this)},this),c=b.bind(function(){return b.bind(function(a){g.MappingMaterialBuilder.build(this._mapping,this._material,b.bind(function(b){this.mappingMaterial=b,a()},this))},this)},this),d=[a(),c()],b(d).reduceRight(b.wrap,b.bind(function(){this._renderer.stop(),b.each(this._scopes,b.bind(function(a,b){a.mappingMaterial=this.mappingMaterial,a.needsUpdate=!0},this)),this._renderer.material=this.mappingMaterial.shaderMaterial,this._renderer.width=this._mapping.width,this._renderer.height=this._mapping.height,this.autostart&&this.start(),this.trigger(this.lastUpdated?"update":"ready"),this.lastUpdated=Date.now()},this))()}return{constructor:g,get needsUpdate(){},set needsUpdate(a){!0===a&&f.call(this)},get material(){return this._material},set material(a){this.setMaterial(a)},get texts(){return this._texts},set texts(a){this.removeTexts(this._texts),this.addTexts(a)},get imageData(){return this._renderer.imageData},init:function(a,d){d=d||{},b.defaults(this,d,{ratio:g.CanvasUtils.pixelRatio,autobuild:!0,autostart:!0,autoplay:!0}),this.setMaterial(a),this.addTexts(d.texts),this._renderer.on("render",b.bind(c,this)),this.autobuild&&(this.needsUpdate=!0),this.autostart&&this.start()},start:function(){this.autostart=!0,this._startTime=Date.now(),this._renderer.start()},stop:function(){this.autostart=!1,this._renderer.stop()},teardown:function(){this._renderer.teardown()},setMaterial:function(a){g.Messaging.ensureInstanceOf(a,g.Material,"Blotter.Material","Blotter","setMaterial"),this._material=a,this._materialEventBinding&&this._materialEventBinding.unsetEventCallbacks(),this._materialEventBinding=new g.ModelEventBinding(a,{update:b.bind(function(){f.call(this)},this),updateUniform:b.bind(function(a){d.call(this,a)},this)}),a.on("update",this._materialEventBinding.eventCallbacks.update),a.on("update:uniform",this._materialEventBinding.eventCallbacks.updateUniform)},addText:function(a){this.addTexts(a)},addTexts:function(a){var c=g.TextUtils.filterTexts(a),d=b.difference(c,this._texts);b.each(d,b.bind(function(a){this._texts.push(a),this._textEventBindings[a.id]=new g.ModelEventBinding(a,{update:b.bind(function(){f.call(this)},this)}),a.on("update",this._textEventBindings[a.id].eventCallbacks.update),this._scopes[a.id]=new g.RenderScope(a,this),this._scopeEventBindings[a.id]=new g.ModelEventBinding(this._scopes[a.id],{updateUniform:b.bind(function(b){e.call(this,a.id,b)},this)}),this._scopes[a.id].on("update:uniform",this._scopeEventBindings[a.id].eventCallbacks.updateUniform)},this))},removeText:function(a){this.removeTexts(a)},removeTexts:function(a){var c=g.TextUtils.filterTexts(a),d=b.intersection(this._texts,c);b.each(d,b.bind(function(a){this._texts=b.without(this._texts,a),this._textEventBindings[a.id].unsetEventCallbacks(),this._scopeEventBindings[a.id].unsetEventCallbacks(),delete this._textEventBindings[a.id],delete this._scopeEventBindings[a.id],delete this._scopes[a.id]},this))},forText:function(a){return g.Messaging.ensureInstanceOf(a,g.Text,"Blotter.Text","Blotter","forText"),this._scopes[a.id]?this._scopes[a.id]:void g.Messaging.logError("Blotter","forText","Blotter.Text object not found in blotter")},boundsForText:function(a){return g.Messaging.ensureInstanceOf(a,g.Text,"Blotter.Text","Blotter","boundsForText"),this._scopes[a.id]?this._mapping?this.mappingMaterial.boundsForText(a):void 0:void g.Messaging.logError("Blotter","boundsForText","Blotter.Text object not found in blotter")}}}(),b.extend(g.prototype,e.prototype),g.Version="v0.1.0",g.webglRenderer=g.webglRenderer||new c.WebGLRenderer({antialias:!0,alpha:!0,premultipliedAlpha:!1}),g.Assets=g.Assets||{},g.Assets.Shaders=g.Assets.Shaders||{}}(this.Blotter,this._,this.THREE,this.Detector,this.EventEmitter),function(a){a.Math={generateUUID:function(){for(var a=[],b=0;b<256;b++)a[b]=(b<16?"0":"")+b.toString(16).toUpperCase();return function(){var b=4294967295*Math.random()|0,c=4294967295*Math.random()|0,d=4294967295*Math.random()|0,e=4294967295*Math.random()|0;return a[255&b]+a[b>>8&255]+a[b>>16&255]+a[b>>24&255]+"-"+a[255&c]+a[c>>8&255]+"-"+a[c>>16&15|64]+a[c>>24&255]+"-"+a[63&d|128]+a[d>>8&255]+"-"+a[d>>16&255]+a[d>>24&255]+a[255&e]+a[e>>8&255]+a[e>>16&255]+a[e>>24&255]}}()}}(this.Blotter),function(a){a.Messaging=function(){function a(a,b,c){return a+(b?"#"+b:"")+": "+c}return{ensureInstanceOf:function(a,b,c,d,e){if(!(a instanceof b))return void this.logError(d,e,"argument must be instanceof "+c)},logError:function(b,c,d){var e=a(b,c,d);console.error(e)},logWarning:function(b,c,d){var e=a(b,c,d);console.warn(e)},throwError:function(b,c,d){throw a(b,c,d)}}}()}(this.Blotter),function(a,b){a._extendWithGettersSetters=function(a){return b.each(Array.prototype.slice.call(arguments,1),function(b){if(b)for(var c in b)a[c]&&Object.getOwnPropertyDescriptor(a,c)&&Object.getOwnPropertyDescriptor(a,c).set?Object.getOwnPropertyDescriptor(a,c).set(b[c]):a[c]=b[c]}),a}}(this.Blotter,this._),function(a){a.VendorPrefixes=["ms","moz","webkit","o"]}(this.Blotter),function(a,b){a.ModelEventBinding=function(a,b){this.model=a,this.eventCallbacks=b||{}},a.ModelEventBinding.prototype={constructor:a.ModelEventBinding,unsetEventCallbacks:function(){b.each(this.eventCallbacks,b.bind(function(a,b){this.model.off(b,a)},this))}}}(this.Blotter,this._),function(a){a.CanvasUtils={canvas:function(a,b,c){c=c||{};var d=document.createElement("canvas");return d.className=c.class,d.innerHTML=c.html,d.width=a,d.height=b,d},hiDpiCanvas:function(a,b,c,d){c=c||this.pixelRatio,d=d||{};var e=document.createElement("canvas");return e.className=d.class,e.innerHTML=d.html,this.updateCanvasSize(e,a,b,c),e},updateCanvasSize:function(a,b,c,d){d=d||1,a.width=b*d,a.height=c*d,a.style.width=b+"px",a.style.height=c+"px",a.getContext("2d").setTransform(d,0,0,d,0,0)},pixelRatio:function(){for(var b=document.createElement("canvas").getContext("2d"),c=window.devicePixelRatio||1,d=b.backingStorePixelRatio,e=0;e<a.VendorPrefixes.length&&!d;++e)d=b[a.VendorPrefixes[e]+"BackingStorePixelRatio"];return d=d||1,c/d}(),mousePosition:function(a,b){var c=a.getBoundingClientRect();return{x:b.clientX-c.left,y:b.clientY-c.top}},normalizedMousePosition:function(a,b){var c=a.getBoundingClientRect(),d=this.mousePosition(a,b);return{x:d.x/c.width,y:d.y/c.height}}}}(this.Blotter),function(a,b){a.PropertyDefaults={family:"sans-serif",size:12,leading:1.5,fill:"#000",style:"normal",weight:400,padding:0,paddingTop:0,paddingRight:0,paddingBottom:0,paddingLeft:0},a.TextUtils={Properties:b.keys(a.PropertyDefaults),ensurePropertyValues:function(c){return c=b.defaults(c||{},a.PropertyDefaults)},filterTexts:function(c){return c=c instanceof a.Text?[c]:b.toArray(c),b.filter(c,b.bind(function(b){var c=b instanceof a.Text;return c||a.Messaging.logWarning("Blotter.TextUtils","filterTexts","object must be instance of Blotter.Text"),c},this))},stringifiedPadding:function(a){var b=a||this.ensurePropertyValues();return(a.paddingTop||b.padding)+"px "+(b.paddingRight||b.padding)+"px "+(b.paddingBottom||b.padding)+"px "+(b.paddingLeft||b.padding)+"px"},sizeForText:function(a,b){var c,d=document.createElement("span");return b=this.ensurePropertyValues(b),d.innerHTML=a,d.style.display="inline-block",d.style.fontFamily=b.family,d.style.fontSize=b.size+"px",d.style.fontWeight=b.weight,d.style.fontStyle=b.style,d.style.lineHeight=b.leading,d.style.maxWidth="none",d.style.padding=this.stringifiedPadding(b),d.style.position="absolute",d.style.width="auto",d.style.visibility="hidden",document.body.appendChild(d),c={w:d.offsetWidth,h:d.offsetHeight},document.body.removeChild(d),c}}}(this.Blotter,this._),function(a,b){a.UniformUtils={UniformTypes:["1f","2f","3f","4f"],defaultUniforms:{uResolution:{type:"2f",value:[0,0]},uGlobalTime:{type:"1f",value:0},uTimeDelta:{type:"1f",value:0},uBlendColor:{type:"4f",value:[1,1,1,1]},uPixelRatio:{type:"1f",value:a.CanvasUtils.pixelRatio}},validValueForUniformType:function(a,c){var d=!1,e=function(a){return!isNaN(a)};switch(a){case"1f":d=!isNaN(c)&&[c].every(e);break;case"2f":d=b.isArray(c)&&2==c.length&&c.every(e);break;case"3f":d=b.isArray(c)&&3==c.length&&c.every(e);break;case"4f":d=b.isArray(c)&&4==c.length&&c.every(e)}return d},glslDataTypeForUniformType:function(a){var b;switch(a){case"1f":b="float";break;case"2f":b="vec2";break;case"3f":b="vec3";break;case"4f":b="vec4"}return b},fullSwizzleStringForUniformType:function(a){var b;switch(a){case"1f":b="x";break;case"2f":b="xy";break;case"3f":b="xyz";break;case"4f":b="xyzw"}return b},extractValidUniforms:function(c){return c=c||{},b.reduce(c,function(c,d,e){return-1==a.UniformUtils.UniformTypes.indexOf(d.type)?(a.Messaging.logError("Blotter.UniformUtils","extractValidUniforms","uniforms must be one of type: "+a.UniformUtils.UniformTypes.join(", ")),c):a.UniformUtils.validValueForUniformType(d.type,d.value)?(c[e]=b.pick(d,"type","value"),c):(a.Messaging.logError("Blotter.UniformUtils","extractValidUniforms","uniform value for "+e+" is incorrect for type: "+d.type),c)},{})},ensureHasRequiredDefaultUniforms:function(b,c,d){if(!a.UniformUtils.hasRequiredDefaultUniforms(b))return void this.logError(c,d,"uniforms object is missing required default uniforms defined in Blotter.UniformUtils.defaultUniforms")},hasRequiredDefaultUniforms:function(c){return!b.difference(b.allKeys(a.UniformUtils.defaultUniforms),b.allKeys(c)).length}}}(this.Blotter,this._),function(a,b,c,d){a.Text=function(b,c){this.id=a.Math.generateUUID(),this.value=b,this.properties=c},a.Text.prototype={constructor:a.Text,get needsUpdate(){},set needsUpdate(a){!0===a&&this.trigger("update")},get properties(){return this._properties},set properties(b){this._properties=a.TextUtils.ensurePropertyValues(b)}},a._extendWithGettersSetters(a.Text.prototype,d.prototype)}(this.Blotter,this._,this.THREE,this.EventEmitter),function(a,b){a.Assets.Shaders.Blending=["//","// Author : Bradley Griffith","// License : Distributed under the MIT License.","//","","// Returns the resulting blend color by blending a top color over a base color","highp vec4 normalBlend(highp vec4 topColor, highp vec4 baseColor) {","  highp vec4 blend = vec4(0.0);","  // HACK","  // Cant divide by 0 (see the 'else' alpha) and after a lot of attempts","  // this simply seems like the only solution Im going to be able to come up with to get alpha back.","  if (baseColor.a == 1.0) {","    baseColor.a = 0.9999999;","  };","  if (topColor.a >= 1.0) {","    blend.a = topColor.a;","    blend.r = topColor.r;","    blend.g = topColor.g;","    blend.b = topColor.b;","  } else if (topColor.a == 0.0) {","    blend.a = baseColor.a;","    blend.r = baseColor.r;","    blend.g = baseColor.g;","    blend.b = baseColor.b;","  } else {","    blend.a = 1.0 - (1.0 - topColor.a) * (1.0 - baseColor.a); // alpha","    blend.r = (topColor.r * topColor.a / blend.a) + (baseColor.r * baseColor.a * (1.0 - topColor.a) / blend.a);","    blend.g = (topColor.g * topColor.a / blend.a) + (baseColor.g * baseColor.a * (1.0 - topColor.a) / blend.a);","    blend.b = (topColor.b * topColor.a / blend.a) + (baseColor.b * baseColor.a * (1.0 - topColor.a) / blend.a);","  }","  return blend;","}","// Returns a vec4 representing the original top color that would have been needed to blend","//  against a passed in base color in order to result in the passed in blend color.","highp vec4 normalUnblend(highp vec4 blendColor, highp vec4 baseColor) {","  highp vec4 unblend = vec4(0.0);","  // HACKY","  // Cant divide by 0 (see alpha) and after a lot of attempts","  // this simply seems like the only solution Im going to be able to come up with to get alpha back.","  if (baseColor.a == 1.0) {","    baseColor.a = 0.9999999;","  }","  unblend.a = 1.0 - ((1.0 - blendColor.a) / (1.0 - baseColor.a));","  // Round to two decimal places","  unblend.a = (sign(100.0 * unblend.a) * floor(abs(100.0 * unblend.a) + 0.5)) / 100.0;","  if (unblend.a >= 1.0) {","    unblend.r = blendColor.r;","    unblend.g = blendColor.g;","    unblend.b = blendColor.b;","  } else if (unblend.a == 0.0) {","    unblend.r = baseColor.r;","    unblend.g = baseColor.g;","    unblend.b = baseColor.b;","  } else {","    unblend.r = (blendColor.r - (baseColor.r * baseColor.a * (1.0 - unblend.a) / blendColor.a)) / (unblend.a / blendColor.a);","    unblend.g = (blendColor.g - (baseColor.g * baseColor.a * (1.0 - unblend.a) / blendColor.a)) / (unblend.a / blendColor.a);","    unblend.b = (blendColor.b - (baseColor.b * baseColor.a * (1.0 - unblend.a) / blendColor.a)) / (unblend.a / blendColor.a);","  }","  return unblend;","}"].join("\n")}(this.Blotter,this._),function(a,b){a.Assets.Shaders.Inf=["//","// Author : Bradley Griffith","// License : Distributed under the MIT License.","//","bool isinf(float val) {","    return (val != 0.0 && val * 2.0 == val) ? true : false;","}"].join("\n")}(this.Blotter,this._),function(a,b){a.Assets.Shaders.LineMath=[a.Assets.Shaders.Inf,"","//","// Author : Bradley Griffith","// License : Distributed under the MIT License.","//","","// Returns the slope of a line given the degrees of the angle on which that line is rotated;","float slopeForDegrees(float deg) {","    // Ensure degrees stay withing 0.0 - 360.0","    deg = mod(deg, 360.0);","    float radians = deg * (PI / 180.0);","    return tan(radians);","}","// Given x, a slope, and another point, find y for x.","float yForXOnSlope(float x, float slope, vec2 p2) {","    return -1.0 * ((slope * (p2.x - x)) - p2.y);","}","// Given y, a slope, and another point, find x for y.","float xForYOnSlope(float y, float slope, vec2 p2) {","    return ((y - p2.y) + (slope * p2.x)) / slope;","}","// Returns slope adjusted for screen ratio.","float normalizedSlope(float slope, vec2 resolution) {","    vec2 p = vec2(1.0) / resolution;","    return ((slope * 100.0) / p.x) / (100.0 / p.x);","}","// Returns offsets (+/-) for any coordinate at distance given slope.","//   Note: This function does not normalize distance.","//   Note: This function does not adjust slope for screen ratio.","vec2 offsetsForCoordAtDistanceOnSlope(float d, float slope) {","    return vec2(","        (d * cos(atan(slope))),","        (d * sin(atan(slope)))","    );","}","// Returns a boolean designating whether or not an infinite line intersects with an infinite line, and sets an `out` variable for the intersection point if it is found.","//   Note: This function does not adjust slope for screen ratio.","bool lineLineIntersection (out vec2 intersect, in vec2 p1, in float m1, in vec2 p2, in float m2) {","    // See: http://gamedev.stackexchange.com/questions/44720/line-intersection-from-parametric-equation","    //      http://stackoverflow.com/questions/41687083/formula-to-determine-if-an-infinite-line-and-a-line-segment-intersect/41687904#41687904","    bool isIntersecting = false;","    float dx = 1.0;","    float dy = m1;","    float dxx = 1.0;","    float dyy = m2;","    float denominator = ((dxx * dy) - (dyy * dx));","    if (denominator == 0.0) {","        // Lines are parallel","        return isIntersecting;","    }","    if (isinf(dy)) {","        float y = yForXOnSlope(p1.x, m2, p2);","        isIntersecting = true;","        intersect = vec2(p1.x, y);","        return isIntersecting;","    }","    if (isinf(dyy)) {","        float y = yForXOnSlope(p2.x, m1, p1);","        isIntersecting = true;","        intersect = vec2(p2.x, y);","        return isIntersecting;","    }","    float u = ((dx * (p2.y - p1.y)) + (dy * (p1.x - p2.x))) / denominator;","    isIntersecting = true;","    intersect = p2 + (u * vec2(dxx, dyy));","    return isIntersecting;","}","// Returns a boolean designating whether or not an infinite line intersects with a line segment, and sets an `out` variable for the intersection point if it is found.","//   Note: This function does not adjust slope for screen ratio.","bool lineLineSegmentIntersection (out vec2 intersect, in vec2 point, in float m, in vec2 pA, in vec2 pB) {","    // See: http://gamedev.stackexchange.com/questions/44720/line-intersection-from-parametric-equation","    //      http://stackoverflow.com/questions/41687083/formula-to-determine-if-an-infinite-line-and-a-line-segment-intersect/41687904#41687904","    bool isIntersecting = false;","    float dx = 1.0;","    float dy = m;","    float dxx = pB.x - pA.x;","    float dyy = pB.y - pA.y;","    float denominator = ((dxx * dy) - (dyy * dx));","    if (denominator == 0.0 || (isinf(dyy / dxx) && isinf(dy))) {","        // Lines are parallel","        return isIntersecting;","    }","    if (isinf(dy)) {","        float m2 = dyy / dxx;","        float y = yForXOnSlope(point.x, m2, pB);","        isIntersecting = true;","        intersect = vec2(point.x, y);","        return isIntersecting;","    }","    float u = ((dx * (pA.y - point.y)) + (dy * (point.x - pA.x))) / denominator;","    if (u >= 0.0 && u <= 1.0) {","        // Intersection occured on line segment","        isIntersecting = true;","        intersect = pA + (u * vec2(dxx, dyy));","    }","    return isIntersecting;","}","// Dev Note: Terrible code. Needs refactor. Just trying to find ","//   which two edges of the rect the intersections occur at.","void intersectsOnRectForLine(out vec2 iA, out vec2 iB, in vec2 rMinXY, in vec2 rMaxXY, in vec2 point, in float slope) {","    bool firstIntersectFound = false;","    vec2 intersectLeft = vec2(0.0);","    vec2 intersectTop = vec2(0.0);","    vec2 intersectRight = vec2(0.0);","    vec2 intersectBottom = vec2(0.0);","    bool intersectsLeft = lineLineSegmentIntersection(intersectLeft, point, slope, rMinXY, vec2(rMinXY.x, rMaxXY.y));","    bool intersectsTop = lineLineSegmentIntersection(intersectTop, point, slope, vec2(rMinXY.x, rMaxXY.y), rMaxXY);","    bool intersectsRight = lineLineSegmentIntersection(intersectRight, point, slope, rMaxXY, vec2(rMaxXY.x, rMinXY.y));","    bool intersectsBottom = lineLineSegmentIntersection(intersectBottom, point, slope, rMinXY, vec2(rMaxXY.x, rMinXY.y));","    if (intersectsLeft) {","        if (firstIntersectFound) {","            iB = intersectLeft;","        }","        else {","            iA = intersectLeft;","            firstIntersectFound = true;","        }","    }","    if (intersectsTop) {","        if (firstIntersectFound) {","            iB = intersectTop;","        }","        else {","            iA = intersectTop;","            firstIntersectFound = true;","        }","    }","    if (intersectsRight) {","        if (firstIntersectFound) {","            iB = intersectRight;","        }","        else {","            iA = intersectRight;","            firstIntersectFound = true;","        }","    }","    if (intersectsBottom) {","        if (firstIntersectFound) {","            iB = intersectBottom;","        }","        else {","            iA = intersectBottom;","        }","    }","}"].join("\n")}(this.Blotter,this._),function(a,b){a.Assets.Shaders.BlinnPhongSpecular=["//","// Author : Reza Ali","// License : Distributed under the MIT License.","//","","float blinnPhongSpecular( vec3 lightDirection, vec3 viewDirection, vec3 surfaceNormal, float shininess ) {","","  //Calculate Blinn-Phong power","  vec3 H = normalize(viewDirection + lightDirection);","  return pow(max(0.0, dot(surfaceNormal, H)), shininess);","}"].join("\n")}(this.Blotter,this._),function(a,b){a.Assets.Shaders.Easing=["//","// Author : Reza Ali","// License : Distributed under the MIT License.","//","","float linear( float t, float b, float c, float d )","{","    return t * ( c / d ) + b;","}","","float linear( float t )","{","    return t;","}","","float inQuad( float t, float b, float c, float d )","{","    return c * ( t /= d ) * t + b;","}","","float inQuad( float t )","{","    return t * t;","}","","float outQuad( float t, float b, float c, float d )","{","    return -c * ( t /= d ) * ( t - 2.0 ) + b;","}","","float outQuad( float t )","{","    return - ( t -= 1.0 ) * t + 1.0;","}","","float inOutQuad( float t, float b, float c, float d )","{","    if( ( t /= d / 2.0 ) < 1.0 ) {","      return c / 2.0 * t * t + b;","    }","    return - c / 2.0 * ( ( --t ) * ( t - 2.0 ) - 1.0 ) + b;","}","","float inOutQuad( float t )","{","    if( ( t /= 0.5 ) < 1.0 ) return 0.5 * t * t;","    return -0.5 * ( ( --t ) * ( t-2 ) - 1 );","}","","float inCubic( float t, float b, float c, float d )","{","    return c * ( t /= d ) * t * t + b;","}","","float inCubic( float t )","{","    return t * t * t;","}","","float outCubic( float t, float b, float c, float d )","{","    return c * ( ( t = t/d - 1.0 ) * t * t + 1.0 ) + b;","}","","float outCubic( float t )","{","    return ( ( --t ) * t * t + 1.0 );","}","","float inOutCubic( float t, float b, float c, float d )","{","    if( ( t /= d / 2.0 ) < 1.0 ) return  c / 2.0 * t * t * t + b;","    return c / 2.0 * ( ( t -= 2.0 ) * t * t + 2.0 ) + b;","}","","float inOutCubic( float t )","{","    if( ( t /= 0.5 ) < 1.0 ) return 0.5 * t * t * t;","    return 0.5 * ( ( t -= 2.0 ) * t * t + 2.0 );","}","","float inQuart( float t, float b, float c, float d )","{","    return c * ( t /= d ) * t * t * t + b;","}","","float inQuart( float t )","{","    return t * t * t * t;","}","","float outQuart( float t, float b, float c, float d )","{","    return -c * ( ( t = t/d - 1.0 ) * t * t * t - 1.0 ) + b;","}","","float outQuart( float t )","{","    return - ( ( --t ) * t * t * t - 1.0 );","}","","float inOutQuart( float t, float b, float c, float d )","{","    if ( ( t /= d / 2.0 ) < 1.0 ) return c / 2.0 * t * t * t * t + b;","    return -c / 2.0 * ( ( t -= 2.0 ) * t * t * t - 2.0 ) + b;","}","","float inOutQuart( float t )","{","    if ( (t /= 0.5 ) < 1.0 ) return 0.5 * t * t * t * t;","    return -0.5 * ( ( t -= 2.0 ) * t * t * t - 2.0 );","}","","float inQuint( float t, float b, float c, float d )","{","    return c * ( t /= d ) * t * t * t * t + b;","}","","float inQuint( float t )","{","    return t * t * t * t * t;","}","","float outQuint( float t, float b, float c, float d )","{","    return c * ( ( t = t/d - 1.0) * t * t * t * t + 1.0 ) + b;","}","","float outQuint( float t )","{","    return ( ( --t ) * t * t * t * t + 1.0 );","}","","float inOutQuint( float t, float b, float c, float d )","{","    if( ( t /= d /2.0 ) < 1.0 ) return  c / 2.0 * t * t * t * t * t + b;","    return c / 2.0 * ( ( t -= 2.0 ) * t * t * t * t + 2.0) + b;","}","","float inOutQuint( float t )","{","    if ( ( t /= 0.5 ) < 1.0 ) return 0.5 * t * t * t * t * t;","    return 0.5 * ( ( t -= 2 ) * t * t * t * t + 2.0 );","}","","float inSine( float t, float b, float c, float d )","{","    return -c * cos( t / d * ( 1.5707963268 ) ) + c + b;","}","","float inSine( float t )","{","    return -1.0 * cos( t * ( 1.5707963268 ) ) + 1.0;","}","","float outSine( float t, float b, float c, float d )","{","    return c * sin( t / d * ( 1.5707963268 ) ) + b;","}","","float outSine( float t )","{","    return sin( t * ( 1.5707963268 ) );","}","","float inOutSine( float t, float b, float c, float d )","{","    return - c / 2.0 * ( cos( 3.1415926536 * t / d ) - 1.0 ) + b;","}","","float inOutSine( float t )","{","    return -0.5 * ( cos( 3.1415926536 * t ) - 1.0 );","}","","float inExpo( float t, float b, float c, float d )","{","    return ( t == 0.0 ) ? b : c * pow( 2.0, 10.0 * ( t / d - 1.0 ) ) + b;","}","","float inExpo( float t )","{","    return ( t == 0 ) ? 0.0 : pow( 2.0, 10.0 * ( t - 1.0 ) );","}","","float outExpo( float t, float b, float c, float d )","{","    return ( t == d ) ? b + c : c * ( - pow( 2.0, -10.0 * t / d ) + 1.0 ) + b;","}","","float outExpo( float t )","{","    return ( t == 1.0 ) ? 1.0 : ( - pow( 2.0, -10.0 * t ) + 1.0 );","}","","float inOutExpo( float t, float b, float c, float d )","{","    if( t == 0 ) return b;","    if( t == d ) return b + c;","    if(( t /= d / 2.0 ) < 1.0 ) return c / 2.0 * pow( 2.0, 10.0 * ( t - 1.0 ) ) + b;","    return c / 2.0 * ( - pow( 2.0, -10.0 * --t ) + 2.0 ) + b;","}","","float inOutExpo( float t )","{","    if( t == 0.0 ) return 0.0;","    if( t == 1.0 ) return 1.0;","    if( ( t /= 0.5 ) < 1.0 ) return 0.5 * pow( 2.0, 10.0 * ( t - 1.0 ) );","    return 0.5 * ( - pow( 2.0, -10.0 * --t ) + 2.0 );","}","","float inCirc( float t, float b, float c, float d )","{","    return -c * ( sqrt( 1.0 - (t/=d)*t) - 1) + b;","}","","float inCirc( float t )","{","    return - ( sqrt( 1.0 - t*t) - 1);","}","","float outCirc( float t, float b, float c, float d )","{","    return c * sqrt( 1.0 - (t=t/d-1)*t) + b;","}","","float outCirc( float t )","{","    return sqrt( 1.0 - (--t)*t);","}","","float inOutCirc( float t, float b, float c, float d )","{","    if ( ( t /= d / 2.0 ) < 1 ) return - c / 2.0 * ( sqrt( 1.0 - t * t ) - 1.0 ) + b;","    return c / 2.0 * ( sqrt( 1.0 - ( t -= 2.0 ) * t ) + 1.0 ) + b;","}","","float inOutCirc( float t )","{","    if( ( t /= 0.5 ) < 1.0 ) return -0.5 * ( sqrt( 1.0 - t * t ) - 1.0 );","    return 0.5 * ( sqrt( 1.0 - ( t -= 2.0 ) * t ) + 1.0 );","}","","float inElastic( float t, float b, float c, float d )","{","    float s = 1.70158; float p = 0.0; float a = c;","    if( t == 0 ) return b;  if( ( t /= d ) == 1 ) return b + c;","    p = d * 0.3;","    if( a < abs( c ) ) { a = c; float s = p / 4.0; }","    else s = 0.1591549431 * p / ( 6.2831853072 ) * asin( c / a );","    return -( a * pow( 2.0, 10.0 * ( t -= 1.0 ) ) * sin( ( t * d - s ) * ( 6.2831853072 ) / p ) )  + b;","}","","float inElastic( float t )","{","    float s = 1.70158; float p = 0.0; float a = 1.0;","    if( t == 0.0 ) return 0.0;","    if( t == 1.0 ) return 1.0;","    p = 0.3;","    s = p / ( 6.2831853072 ) * asin( 1.0 / a );","    return -( a * pow( 2.0, 10.0 * ( t -= 1.0 ) ) * sin( ( t - s ) * ( 6.2831853072 ) / p ) );","}","","float outElastic( float t, float b, float c, float d )","{","    float s = 1.70158; float p = 0.0; float a = c;","    if( t == 0.0 ) return b;","    if( (t /= d ) == 1.0 ) return b + c;","    p = d * 0.3;","    if( a < abs( c ) ) { a = c; s = p / 4.0; }","    else { s = p / ( 6.2831853072 ) * asin( c / a ); }","    return a * pow( 2.0, -10.0 * t ) * sin( ( t * d - s ) * ( 6.2831853072 ) / p ) + c + b;","}","","float outElastic( float t )","{","    float s = 1.70158; float p = 0.0 ; float a = 1.0;","    if( t == 0.0 ) return 0.0;  if( t == 1.0 ) return 1.0;","    p = 0.3;","    s = p / ( 6.2831853072 ) * asin( 1.0 / a );","    return a * pow( 2.0, -10.0 * t ) * sin( ( t - s ) * ( 6.2831853072 ) / p ) + 1.0;","}","","float inOutElastic( float t, float b, float c, float d )","{","    float s = 1.70158; float p = 0.0; float a = c;","    if( t == 0.0 ) return b;","    if( ( t /= d / 2.0 ) == 2.0 ) return b + c;","    p = d * ( 0.3 * 1.5 );","    if( a < abs( c ) ) { a = c; s = p / 4.0; }","    else { s = p / ( 6.2831853072 ) * asin( c / a ); }","    if( t < 1.0 ) return -0.5 * ( a * pow( 2.0, 10.0 * ( t -= 1.0 ) ) * sin( ( t * d - s ) * ( 6.2831853072 ) / p ) ) + b;","    return a * pow( 2.0, -10.0 * ( t -= 1.0 ) ) * sin( ( t * d - s ) * ( 6.2831853072 ) / p ) * 0.5 + c + b;","}","","float inOutElastic( float t )","{","    float s = 1.70158; float p = 0; float a = 1.0;","    if( t == 0 ) return 0.0;","    if( ( t /= 0.5 ) == 2.0 ) return 1.0;","    p = ( 0.3 * 1.5 );","    s = p / ( 6.2831853072 ) * asin( 1.0 / a );","    if( t < 1.0 ) return -0.5 * ( a * pow( 2.0, 10.0 * ( t -= 1.0 ) ) * sin( ( t - s ) * ( 6.2831853072 ) / p ) );","    return a * pow( 2.0, -10.0 * ( t -= 1.0 ) ) * sin( ( t - s ) * ( 6.2831853072 ) / p ) * 0.5 + 1.0;","}","","float inBack( float t, float b, float c, float d )","{","    float s = 1.70158;","    return c * ( t /= d ) * t * ( ( s + 1.0 ) * t - s ) + b;","}","","float inBack( float t )","{","    float s = 1.70158;","    return t * t * ( ( s + 1.0 ) * t - s);","}","","float outBack( float t,  float b,  float c,  float d )","{","    float s = 1.70158;","    return c * ( ( t = t / d - 1.0 ) * t * ( ( s + 1.0 ) * t + s ) + 1.0 ) + b;","}","","float outBack( float t )","{","    float s = 1.70158;","    return ( ( --t ) * t * ( ( s + 1.0 ) * t + s ) + 1.0);","}","","float inOutBack( float t, float b, float c, float d )","{","    float s = 1.70158;","    if( ( t /= d / 2.0 ) < 1.0 ) return c / 2.0 * ( t * t * ( ( ( s *= 1.525 ) + 1.0 ) * t - s ) ) + b;","    return c / 2.0 * ( ( t -= 2.0 ) * t * ( ( ( s *= ( 1.525 ) ) + 1.0 ) * t + s ) + 2.0 ) + b;","}","","float inOutBack( float t )","{","    float s = 1.70158;","    if( ( t /= 0.5 ) < 1.0 ) return 0.5 * ( t * t * ( ( ( s *= 1.525 ) + 1.0 ) * t - s ) );","    return 0.5 * ( ( t -= 2 ) * t * ( ( ( s *= ( 1.525 ) ) + 1.0 ) * t + s ) + 2.0 );","}","","float outBounce( float t, float b, float c, float d )","{","    if( ( t /= d ) < ( 1.0 / 2.75 ) ) {","        return c * ( 7.5625 * t * t ) + b;","    } else if ( t < ( 2.0 / 2.75 ) ) {","        return c * ( 7.5625 * ( t -= ( 1.5 / 2.75 ) ) * t + 0.75 ) + b;","    } else if ( t < ( 2.5 / 2.75 ) ) {","        return c * ( 7.5625 * ( t -= ( 2.25 / 2.75 ) ) * t + 0.9375 ) + b;","    } else {","        return c * ( 7.5625 * ( t -= ( 2.625 / 2.75 ) ) * t + 0.984375 ) + b;","    }","}","","float outBounce( float t )","{","    if( t < ( 1.0 / 2.75 ) ) {","        return ( 7.5625 * t * t );","    } else if ( t < ( 2.0 / 2.75 ) ) {","        return ( 7.5625 * ( t-= ( 1.5 / 2.75 ) ) * t + .75 );","    } else if ( t < ( 2.5 / 2.75 ) ) {","        return ( 7.5625 * ( t -= ( 2.25 / 2.75 ) ) * t + 0.9375 );","    } else {","        return ( 7.5625 * ( t -= ( 2.625 / 2.75 ) ) * t + 0.984375 );","    }","}","","float inBounce( float t, float b, float c, float d )","{","    return c - outBounce( d - t, 0.0, c, d ) + b;","}","","float inBounce( float t )","{","    return 1.0 - outBounce( 1.0 - t);","}","","float inOutBounce( float t, float b, float c, float d )","{","    if ( t < d /2.0 ) return inBounce ( t * 2.0, 0.0, c, d ) * 0.5 + b;","    return outBounce ( t * 2.0 - d, 0, c, d ) * 0.5 + c * 0.5 + b;","}","","float inOutBounce( float t )","{","    if ( t < 0.5 ) return inBounce( t * 2.0 ) * 0.5;","    return outBounce( t * 2.0 - 1.0 ) * 0.5 + 0.5;","}"].join("\n")}(this.Blotter,this._),function(a,b){a.Assets.Shaders.Gamma=["//","// Author : Reza Ali","// License : Distributed under the MIT License.","//","","const vec3 cGammaCorrection = vec3( 0.4545454545 );","","vec3 gamma( in vec3 color )","{","  return pow( color, cGammaCorrection );","}","","vec4 gamma( in vec4 color )","{","  return vec4( gamma( color.rgb ), color.a );","}"].join("\n")}(this.Blotter,this._),function(a,b){a.Assets.Shaders.Map=["//","// Author : Reza Ali","// License : Distributed under the MIT License.","//","","float map( float value, float inMin, float inMax, float outMin, float outMax )","{","    return ( (value - inMin) / ( inMax - inMin ) * ( outMax - outMin ) ) + outMin;","}"].join("\n")}(this.Blotter,this._),function(a,b){a.Assets.Shaders.Noise=["//","// Author : Patricio Gonzalez Vivo and Jen Lowe","// License : Distributed under the MIT License.","// Source : https://github.com/patriciogonzalezvivo/thebookofshaders","//","float random (in float _x) {","    return fract(sin(_x)*1e4);","}","","float random (in vec2 co) {","    return fract(sin(dot(co.xy,vec2(12.9898,78.233)))*43758.5453);","}","","float noise (in float _x) {","    float i = floor(_x);","    float f = fract(_x);","    float u = f * f * (3.0 - 2.0 * f);","    return mix(random(i), random(i + 1.0), u);","}","","float noise (in vec2 _st) {","    vec2 i = floor(_st);","    vec2 f = fract(_st);","    // Four corners in 2D of a tile","    float a = random(i);","    float b = random(i + vec2(1.0, 0.0));","    float c = random(i + vec2(0.0, 1.0));","    float d = random(i + vec2(1.0, 1.0));","    vec2 u = f * f * (3.0 - 2.0 * f);","    return mix(a, b, u.x) + ","            (c - a)* u.y * (1.0 - u.x) + ","            (d - b) * u.x * u.y;","}"].join("\n")}(this.Blotter,this._),function(a,b){a.Assets.Shaders.Noise2D=["//","// Description : Array and textureless GLSL 2D simplex noise function.","//      Author : Ian McEwan, Ashima Arts.","//  Maintainer : ijm","//     Lastmod : 20110822 (ijm)","//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.","//               Distributed under the MIT License. See LICENSE file.","//               https://github.com/ashima/webgl-noise","//","","vec2 n2mod289(vec2 x) {","  return x - floor(x * (1.0 / 289.0)) * 289.0;","}","","vec3 n2mod289(vec3 x) {","  return x - floor(x * (1.0 / 289.0)) * 289.0;","}","","vec4 n2mod289(vec4 x) {","  return x - floor(x * (1.0 / 289.0)) * 289.0;","}","","vec3 permute(vec3 x) {","  return n2mod289(((x*34.0)+1.0)*x);","}","","float snoise(vec2 v)","  {","  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0","                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)","                     -0.577350269189626,  // -1.0 + 2.0 * C.x","                      0.024390243902439); // 1.0 / 41.0","// First corner","  vec2 i  = floor(v + dot(v, C.yy) );","  vec2 x0 = v -   i + dot(i, C.xx);","","// Other corners","  vec2 i1;","  //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0","  //i1.y = 1.0 - i1.x;","  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);","  // x0 = x0 - 0.0 + 0.0 * C.xx ;","  // x1 = x0 - i1 + 1.0 * C.xx ;","  // x2 = x0 - 1.0 + 2.0 * C.xx ;","  vec4 x12 = x0.xyxy + C.xxzz;","  x12.xy -= i1;","","// Permutations","  i = n2mod289(i); // Avoid truncation effects in permutation","  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))","   + i.x + vec3(0.0, i1.x, 1.0 ));","","  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);","  m = m*m ;","  m = m*m ;","","// Gradients: 41 points uniformly over a line, mapped onto a diamond.","// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)","","  vec3 x = 2.0 * fract(p * C.www) - 1.0;","  vec3 h = abs(x) - 0.5;","  vec3 ox = floor(x + 0.5);","  vec3 a0 = x - ox;","","// Normalise gradients implicitly by scaling m","// Approximation of: m *= inversesqrt( a0*a0 + h*h );","  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );","","// Compute final noise value at P","  vec3 g;","  g.x  = a0.x  * x0.x  + h.x  * x0.y;","  g.yz = a0.yz * x12.xz + h.yz * x12.yw;","  return 130.0 * dot(m, g);","}"].join("\n")}(this.Blotter,this._),function(a,b){a.Assets.Shaders.Noise3D=["//","// Description : Array and textureless GLSL 2D/3D/4D simplex","//               noise functions.","//      Author : Ian McEwan, Ashima Arts.","//  Maintainer : ijm","//     Lastmod : 20110822 (ijm)","//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.","//               Distributed under the MIT License. See LICENSE file.","//               https://github.com/ashima/webgl-noise","//","","vec2 n3mod289(vec2 x) {","  return x - floor(x * (1.0 / 289.0)) * 289.0;","}","","vec3 n3mod289(vec3 x) {","  return x - floor(x * (1.0 / 289.0)) * 289.0;","}","","vec4 n3mod289(vec4 x) {","  return x - floor(x * (1.0 / 289.0)) * 289.0;","}","","vec4 permute(vec4 x) {","     return n3mod289(((x*34.0)+1.0)*x);","}","","vec4 taylorInvSqrt(vec4 r)","{","  return 1.79284291400159 - 0.85373472095314 * r;","}","","float snoise(vec3 v)","  {","  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;","  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);","","// First corner","  vec3 i  = floor(v + dot(v, C.yyy) );","  vec3 x0 =   v - i + dot(i, C.xxx) ;","","// Other corners","  vec3 g = step(x0.yzx, x0.xyz);","  vec3 l = 1.0 - g;","  vec3 i1 = min( g.xyz, l.zxy );","  vec3 i2 = max( g.xyz, l.zxy );","","  //   x0 = x0 - 0.0 + 0.0 * C.xxx;","  //   x1 = x0 - i1  + 1.0 * C.xxx;","  //   x2 = x0 - i2  + 2.0 * C.xxx;","  //   x3 = x0 - 1.0 + 3.0 * C.xxx;","  vec3 x1 = x0 - i1 + C.xxx;","  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y","  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y","","// Permutations","  i = n3mod289(i);","  vec4 p = permute( permute( permute(","             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))","           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))","           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));","","// Gradients: 7x7 points over a square, mapped onto an octahedron.","// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)","  float n_ = 0.142857142857; // 1.0/7.0","  vec3  ns = n_ * D.wyz - D.xzx;","","  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)","","  vec4 x_ = floor(j * ns.z);","  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)","","  vec4 x = x_ *ns.x + ns.yyyy;","  vec4 y = y_ *ns.x + ns.yyyy;","  vec4 h = 1.0 - abs(x) - abs(y);","","  vec4 b0 = vec4( x.xy, y.xy );","  vec4 b1 = vec4( x.zw, y.zw );","","  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;","  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;","  vec4 s0 = floor(b0)*2.0 + 1.0;","  vec4 s1 = floor(b1)*2.0 + 1.0;","  vec4 sh = -step(h, vec4(0.0));","","  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;","  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;","","  vec3 p0 = vec3(a0.xy,h.x);","  vec3 p1 = vec3(a0.zw,h.y);","  vec3 p2 = vec3(a1.xy,h.z);","  vec3 p3 = vec3(a1.zw,h.w);","","//Normalise gradients","  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));","  p0 *= norm.x;","  p1 *= norm.y;","  p2 *= norm.z;","  p3 *= norm.w;","","// Mix final noise value","  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);","  m = m * m;","  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),","                                dot(p2,x2), dot(p3,x3) ) );","  }"].join("\n")}(this.Blotter,this._),function(a,b){a.Assets.Shaders.Noise4D=["//","// Description : Array and textureless GLSL 2D/3D/4D simplex","//               noise functions.","//      Author : Ian McEwan, Ashima Arts.","//  Maintainer : ijm","//     Lastmod : 20110822 (ijm)","//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.","//               Distributed under the MIT License. See LICENSE file.","//               https://github.com/ashima/webgl-noise","//","","vec4 mod289(vec4 x) {","  return x - floor(x * (1.0 / 289.0)) * 289.0; }","","float mod289(float x) {","  return x - floor(x * (1.0 / 289.0)) * 289.0; }","","vec4 permute(vec4 x) {","     return mod289(((x*34.0)+1.0)*x);","}","","float permute(float x) {","     return mod289(((x*34.0)+1.0)*x);","}","","vec4 taylorInvSqrt(vec4 r)","{","  return 1.79284291400159 - 0.85373472095314 * r;","}","","float taylorInvSqrt(float r)","{","  return 1.79284291400159 - 0.85373472095314 * r;","}","","vec4 grad4(float j, vec4 ip)","  {","  const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);","  vec4 p,s;","","  p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;","  p.w = 1.5 - dot(abs(p.xyz), ones.xyz);","  s = vec4(lessThan(p, vec4(0.0)));","  p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www;","","  return p;","  }","","// (sqrt(5) - 1)/4 = F4, used once below","#define F4 0.309016994374947451","","float snoise(vec4 v)","  {","  const vec4  C = vec4( 0.138196601125011,  // (5 - sqrt(5))/20  G4","                        0.276393202250021,  // 2 * G4","                        0.414589803375032,  // 3 * G4","                       -0.447213595499958); // -1 + 4 * G4","","// First corner","  vec4 i  = floor(v + dot(v, vec4(F4)) );","  vec4 x0 = v -   i + dot(i, C.xxxx);","","// Other corners","","// Rank sorting originally contributed by Bill Licea-Kane, AMD (formerly ATI)","  vec4 i0;","  vec3 isX = step( x0.yzw, x0.xxx );","  vec3 isYZ = step( x0.zww, x0.yyz );","//  i0.x = dot( isX, vec3( 1.0 ) );","  i0.x = isX.x + isX.y + isX.z;","  i0.yzw = 1.0 - isX;","//  i0.y += dot( isYZ.xy, vec2( 1.0 ) );","  i0.y += isYZ.x + isYZ.y;","  i0.zw += 1.0 - isYZ.xy;","  i0.z += isYZ.z;","  i0.w += 1.0 - isYZ.z;","","  // i0 now contains the unique values 0,1,2,3 in each channel","  vec4 i3 = clamp( i0, 0.0, 1.0 );","  vec4 i2 = clamp( i0-1.0, 0.0, 1.0 );","  vec4 i1 = clamp( i0-2.0, 0.0, 1.0 );","","  //  x0 = x0 - 0.0 + 0.0 * C.xxxx","  //  x1 = x0 - i1  + 1.0 * C.xxxx","  //  x2 = x0 - i2  + 2.0 * C.xxxx","  //  x3 = x0 - i3  + 3.0 * C.xxxx","  //  x4 = x0 - 1.0 + 4.0 * C.xxxx","  vec4 x1 = x0 - i1 + C.xxxx;","  vec4 x2 = x0 - i2 + C.yyyy;","  vec4 x3 = x0 - i3 + C.zzzz;","  vec4 x4 = x0 + C.wwww;","","// Permutations","  i = mod289(i);","  float j0 = permute( permute( permute( permute(i.w) + i.z) + i.y) + i.x);","  vec4 j1 = permute( permute( permute( permute (","             i.w + vec4(i1.w, i2.w, i3.w, 1.0 ))","           + i.z + vec4(i1.z, i2.z, i3.z, 1.0 ))","           + i.y + vec4(i1.y, i2.y, i3.y, 1.0 ))","           + i.x + vec4(i1.x, i2.x, i3.x, 1.0 ));","","// Gradients: 7x7x6 points over a cube, mapped onto a 4-cross polytope","// 7*7*6 = 294, which is close to the ring size 17*17 = 289.","  vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ;","","  vec4 p0 = grad4(j0,   ip);","  vec4 p1 = grad4(j1.x, ip);","  vec4 p2 = grad4(j1.y, ip);","  vec4 p3 = grad4(j1.z, ip);","  vec4 p4 = grad4(j1.w, ip);","","// Normalise gradients","  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));","  p0 *= norm.x;","  p1 *= norm.y;","  p2 *= norm.z;","  p3 *= norm.w;","  p4 *= taylorInvSqrt(dot(p4,p4));","","// Mix contributions from the five corners","  vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);","  vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)            ), 0.0);","  m0 = m0 * m0;","  m1 = m1 * m1;","  return 49.0 * ( dot(m0*m0, vec3( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 )))","               + dot(m1*m1, vec2( dot( p3, x3 ), dot( p4, x4 ) ) ) ) ;","","  }"].join("\n")}(this.Blotter,this._),function(a,b){a.Assets.Shaders.PI=["//","// Author : Reza Ali","// License : Distributed under the MIT License.","//","","#define TWO_PI 6.2831853072","#define PI 3.14159265359","#define HALF_PI 1.57079632679"].join("\n")}(this.Blotter,this._),function(a,b){a.Assets.Shaders.Random=["//","// Author : Patricio Gonzalez Vivo and Jen Lowe","// License : Distributed under the MIT License.","// Source : https://github.com/patriciogonzalezvivo/thebookofshaders","//","","float random (in float _x) {","    return fract(sin(_x)*1e4);","}","","float random (in vec2 co) {","    return fract(sin(dot(co.xy,vec2(12.9898,78.233)))*43758.5453);","}"].join("\n")}(this.Blotter,this._),function(a,b){a.Mapping=function(a,b,c,d){this.texts=a,this._textBounds=b,this._width=c,this._height=d,this._ratio=1},a.Mapping.prototype=function(){function c(b,c){return c=c||a.TextUtils.ensurePropertyValues().leading,isNaN(c)?-1!==c.toString().indexOf("px")?c=parseInt(c):-1!==c.toString().indexOf("%")&&(c=parseInt(c)/100*b):c*=b,c}return{constructor:a.Mapping,get ratio(){return this._ratio},set ratio(a){this._ratio=a||1},get width(){return this._width*this._ratio},get height(){return this._height*this._ratio},boundsForText:function(b){a.Messaging.ensureInstanceOf(b,a.Text,"Blotter.Text","Blotter.Mapping","boundsForText");var c=this._textBounds[b.id];return c&&(c={w:c.w*this._ratio,h:c.h*this._ratio,x:c.x*this._ratio,y:c.y*this._ratio}),c},toCanvas:function(d){var e=a.CanvasUtils.hiDpiCanvas(this._width,this._height,this._ratio),f=e.getContext("2d",{alpha:!1}),g=new Image;f.textBaseline="middle";for(var h=0;h<this.texts.length;h++){var i=this.texts[h],j=this._textBounds[i.id],k=c.call(this,i.properties.size,i.properties.leading)/2;f.font=i.properties.style+" "+i.properties.weight+" "+i.properties.size+"px "+i.properties.family,f.save(),f.translate(j.x+i.properties.paddingLeft,this._height-(j.y+j.h)+i.properties.paddingTop),f.fillStyle=i.properties.fill,f.fillText(i.value,0,Math.round(k)),f.restore()}g.onload=b.bind(function(){f.save(),f.scale(1,-1),f.clearRect(0,-1*this._height,this._width,this._height),f.drawImage(g,0,-1*this._height,this._width,this._height),f.restore(),d(e)},this),g.src=e.toDataURL("image/png")}}}()}(this.Blotter,this._),function(a,b,c){a.MappingMaterial=function(a,b,c,d){this.mapping=a,this.material=b,this.shaderMaterial=c,this._userUniformDataTextureObjects=d,this.init.apply(this,arguments)},a.MappingMaterial.prototype=function(){function d(a,b,c,d){var e=d.type;"1f"==e?(c[4*b]=a,c[4*b+1]=0,c[4*b+2]=0,c[4*b+3]=0):"2f"==e?(c[4*b]=a[0],c[4*b+1]=a[1],c[4*b+2]=0,c[4*b+3]=0):"3f"==e?(c[4*b]=a[0],c[4*b+1]=a[1],c[4*b+2]=a[2],c[4*b+3]=0):"4f"==e?(c[4*b]=a[0],c[4*b+1]=a[1],c[4*b+2]=a[2],c[4*b+3]=a[3]):(c[4*b]=0,c[4*b+1]=0,c[4*b+2]=0,c[4*b+3]=0)}function e(d){var e={_type:d.userUniform.type,_value:d.userUniform.value,get value(){return this._value},set value(b){if(!a.UniformUtils.validValueForUniformType(this._type,b))return void a.Messaging.logError("Blotter.MappingMaterial",!1,"uniform value not valid for uniform type: "+this._type);this._value=b,this.trigger("update")}};return b.extend(e,c.prototype),e}function f(a,c){return b.reduce(a.texts,function(a,f,g){return a[f.id]=b.reduce(c.userUniforms,function(a,b,f){var h=b.position+g;return a[f]=e(b),a[f].on("update",function(){d(a[f].value,h,c.data,b.userUniform),c.texture.needsUpdate=!0}),a[f].value=b.userUniform.value,a},{}),a},{})}function g(a,c,d){return b.reduce(c.userUniforms,function(f,g,h){return f[h]=e(g),f[h].on("update",function(){b.each(a.texts,function(a){d[a.id][h].value=f[h].value}),c.texture.needsUpdate=!0}),f},{})}return{constructor:a.MappingMaterial,get uniforms(){return this.material.uniforms},get mainImage(){return this.material.mainImage},get width(){return this.mapping.width},get height(){return this.mapping.height},get ratio(){return this.mapping.ratio},init:function(a,b,c,d){this.textUniformInterface=f(this.mapping,this._userUniformDataTextureObjects),this.uniformInterface=g(this.mapping,this._userUniformDataTextureObjects,this.textUniformInterface)},boundsForText:function(b){return a.Messaging.ensureInstanceOf(b,a.Text,"Blotter.Text","Blotter.MappingMaterial","boundsForText"),this.mapping.boundsForText(b)}}}()}(this.Blotter,this._,this.EventEmitter),function(a,b,c){a.Material=function(){this.init.apply(this,arguments)},a.Material.prototype=function(){function d(){return["void mainImage( out vec4 mainImage, in vec2 fragCoord ) {","mainImage = textTexture(fragCoord / uResolution);","}"].join("\n")}function e(d){var e={_type:d.type,_value:d.value,get type(){return this._type},set type(a){this._type=a},get value(){return this._value},set value(b){if(!a.UniformUtils.validValueForUniformType(this._type,b))return void a.Messaging.logError("Blotter.Material",!1,"uniform value not valid for uniform type: "+this._type);this._value=b,this.trigger("update")}};return b.extend(e,c.prototype),e}function f(a){return b.reduce(a,b.bind(function(a,c,d){return a[d]=e(c),a[d].on("update",b.bind(function(){this.trigger("update:uniform",[d])},this)),a},this),{})}return{constructor:a.Material,get needsUpdate(){},set needsUpdate(a){!0===a&&this.trigger("update")},get mainImage(){return this._mainImage},set mainImage(a){this._mainImage=a||d()},get uniforms(){return this._uniforms},set uniforms(c){this._uniforms=f.call(this,a.UniformUtils.extractValidUniforms(b.extend(c,a.UniformUtils.defaultUniforms)))},init:function(){this.mainImage=d(),this.uniforms={}}}}(),a._extendWithGettersSetters(a.Material.prototype,c.prototype)}(this.Blotter,this._,this.EventEmitter),function(a,b){a.ShaderMaterial=function(b,c){a.Material.apply(this,arguments)},a.ShaderMaterial.prototype=Object.create(a.Material.prototype),a._extendWithGettersSetters(a.ShaderMaterial.prototype,function(){return{constructor:a.ShaderMaterial,init:function(a,c){b.defaults(this,c),this.mainImage=a}}}())}(this.Blotter,this._),function(a,b,c){a.RenderScope=function(b,c){this.text=b,this.blotter=c,this.material={mainImage:this.blotter.material.mainImage},this._mappingMaterial=c.mappingMaterial,this.playing=this.blotter.autoplay,this.timeDelta=0,this.lastDrawTime=!1,this.frameCount=0,this.domElement=a.CanvasUtils.hiDpiCanvas(0,0,this.blotter.ratio,{class:"b-canvas",html:b.value}),this.context=this.domElement.getContext("2d")},a.RenderScope.prototype=function(){function d(){function b(b){c.domElement.addEventListener(b,function(d){var e=a.CanvasUtils.normalizedMousePosition(c.domElement,d);c.emit(b,e)},!1)}for(var c=this,d=["mousedown","mouseup","mousemove","mouseenter","mouseleave"],e=0;e<d.length;e++){b(d[e])}}function e(a,b){var c=a.boundsForText(b);if(c)return{w:c.w,h:c.h,x:-1*Math.floor(c.x),y:-1*Math.floor(a.height-(c.y+c.h))}}function f(a,c){b.each(a,function(a,b){var d=c[b];if(d){var e=d.type==a.type,f=d.value==a.value;e&&!f&&(d.value=a.value)}})}function g(d){var e={_type:d.type,_value:d.value,get type(){return this._type},set type(b){a.Messaging.logError("Blotter.RenderScope",!1,"uniform types may not be updated through a text scope")},get value(){return this._value},set value(b){if(!a.UniformUtils.validValueForUniformType(this._type,b))return void a.Messaging.logError("Blotter.RenderScope",!1,"uniform value not valid for uniform type: "+this._type);this._value=b,this.trigger("update")}};return b.extend(e,c.prototype),e}function h(a){return b.reduce(a,b.bind(function(a,c,d){return a[d]=g(c),a[d].on("update",b.bind(function(){this.trigger("update:uniform",[d])},this)),a},this),{})}function i(){var b=this._mappingMaterial,c=b&&e(b,this.text),d=this.material.uniforms;b&&c&&(a.CanvasUtils.updateCanvasSize(this.domElement,c.w/this.blotter.ratio,c.h/this.blotter.ratio,this.blotter.ratio),this.domElement.innerHTML=this.text.value,this.bounds=c,this.material.uniforms=h.call(this,b.uniforms),this.material.mainImage=b.mainImage,d&&f(d,this.material.uniforms),this.trigger(this.lastUpdated?"update":"ready"),this.lastUpdated=Date.now())}return{constructor:a.RenderScope,get needsUpdate(){},set needsUpdate(a){!0===a&&i.call(this)},get mappingMaterial(){},set mappingMaterial(a){this._mappingMaterial=a},play:function(){this.playing=!0},pause:function(){this.playing=!1},render:function(){if(this.bounds){var a=Date.now();this.frameCount+=1,this.timeDelta=(a-(this.lastDrawTime||a))/1e3,this.lastDrawTime=a,this.context.clearRect(0,0,this.domElement.width,this.domElement.height),this.context.putImageData(this.blotter.imageData,this.bounds.x,this.bounds.y),this.trigger("render",[this.frameCount])}},appendTo:function(a){return"function"==typeof a.append?a.append(this.domElement):a.appendChild(this.domElement),d.call(this),this}}}(),a._extendWithGettersSetters(a.RenderScope.prototype,c.prototype)}(this.Blotter,this._,this.EventEmitter),function(a,b,c,d){var e=this;a.Renderer=function(){this._currentAnimationLoop=!1,this._scene=new c.Scene,this._plane=new c.PlaneGeometry(1,1),this._material=new c.MeshBasicMaterial,this._mesh=new c.Mesh(this._plane,this._material),this._scene.add(this._mesh),this._camera=new c.OrthographicCamera(.5,.5,.5,.5,0,100),this.init.apply(this,arguments)},a.Renderer.prototype=function(){function d(a,b){var d=new c.WebGLRenderTarget(a,b,{minFilter:c.LinearFilter,magFilter:c.LinearFilter,format:c.RGBAFormat,type:c.UnsignedByteType});return d.texture.generateMipmaps=!1,d.width=a,d.height=b,d}function f(){a.webglRenderer.render(this._scene,this._camera,this._renderTarget),a.webglRenderer.readRenderTargetPixels(this._renderTarget,0,0,this._renderTarget.width,this._renderTarget.height,this._imageDataArray),this.trigger("render"),this._currentAnimationLoop=e.requestAnimationFrame(b.bind(f,this))}return{constructor:a.Renderer,get material(){},set material(a){a instanceof c.Material&&(this._material=a,this._mesh.material=a)},get width(){return this._width},set width(a){this.setSize(a,this._height)},get height(){return this._height},set height(a){this.setSize(this._width,a)},init:function(){this.setSize(1,1)},start:function(){this._currentAnimationLoop||f.call(this)},stop:function(){this._currentAnimationLoop&&(e.cancelAnimationFrame(this._currentAnimationLoop),this._currentAnimationLoop=void 0)},setSize:function(a,b){this._width=Math.trunc(a)||1,this._height=Math.trunc(b)||1,this._mesh.scale.set(this._width,this._height,1),this._camera.left=this._width/-2,this._camera.right=this._width/2,this._camera.top=this._height/2,this._camera.bottom=this._height/-2,this._camera.updateProjectionMatrix(),this._renderTarget=d(this._width,this._height),this._viewBuffer=new ArrayBuffer(this._width*this._height*4),this._imageDataArray=new Uint8Array(this._viewBuffer),this._clampedImageDataArray=new Uint8ClampedArray(this._viewBuffer),this.imageData=new ImageData(this._clampedImageDataArray,this._width,this._height)},teardown:function(){this.stop()}}}(),a._extendWithGettersSetters(a.Renderer.prototype,d.prototype)}(this.Blotter,this._,this.THREE,this.EventEmitter),function(a,b,c,d){a.BoundsDataTextureBuilder=function(){function a(a){for(var b=a.texts,c=new Float32Array(4*b.length),d=0;d<b.length;d++){var e=b[d],f=a.boundsForText(e);c[4*d]=f.x,c[4*d+1]=a.height-(f.y+f.h),c[4*d+2]=f.w,c[4*d+3]=f.h}return c}return{build:function(b,e){d(function(){var d=a(b),f=new c.DataTexture(d,b.texts.length,1,c.RGBAFormat,c.FloatType);f.needsUpdate=!0,e(f)})}}}()}(this.Blotter,this._,this.THREE,this.setImmediate),function(a,b,c,d){a.IndicesDataTextureBuilder=function(){function a(a,b,c,d){for(var e=a.ratio,f=new Float32Array(c*b*4),g=b%1,h=1/a.texts.length/2,i=1;i<f.length/4;i++){for(var j=Math.ceil(i/(b-g)),k=i-(b-g)*(j-1),l=0,m=0,n=0,o=0;o<a.texts.length;o++){var p=a.texts[o],q=a.boundsForText(p),r=q.w/e*d,s=q.h/e*d,t=q.x/e*d,u=q.y/e*d;if(j>=u&&j<=u+s&&k>=t&&k<=t+r){l=o/a.texts.length+h,n=1;break}}var v=i-1;f[4*v+0]=l,f[4*v+1]=m,f[4*v+2]=m,f[4*v+3]=n}return f}return{build:function(b,e){var f=.5;d(function(){var d=b.width/b.ratio*f,g=b.height/b.ratio*f,h=a(b,d,g,f),i=new c.DataTexture(h,d,g,c.RGBAFormat,c.FloatType);i.flipY=!0,i.needsUpdate=!0,e(i)})}}}()}(this.Blotter,this._,this.THREE,this.setImmediate),function(a,b,c){a.TextTextureBuilder=function(){return{build:function(a,d){var e,f=new c.TextureLoader;a.toCanvas(b.bind(function(a){e=a.toDataURL(),f.load(e,b.bind(function(a){a.minFilter=c.LinearFilter,a.magFilter=c.LinearFilter,a.generateMipmaps=!0,a.needsUpdate=!0,d(a)},this))},this))}}}()}(this.Blotter,this._,this.THREE),function(a,b,c,d,e){a.MappingBuilder=function(){function c(a,b){var c=a.w*a.h;return b.w*b.h-c}function f(c){return b.reduce(c,function(b,c){var d=a.TextUtils.sizeForText(c.value,c.properties);return b[c.id]=d,b},[])}return{build:function(b,g){e(function(){var e=a.TextUtils.filterTexts(b),h=f(e),i=new d,j=[],k={};for(var l in h)if(h.hasOwnProperty(l)){var m=h[l];m.referenceId=l,j.push(m)}i.fit(j.sort(c));for(var n=0;n<j.length;n++){var o=j[n];k[o.referenceId]={w:o.w,h:o.h,x:o.fit.x,y:i.root.h-(o.fit.y+o.h)}}g(new a.Mapping(e,k,i.root.w,i.root.h))})}}}()}(this.Blotter,this._,this.THREE,this.GrowingPacker,this.setImmediate),function(a,b,c){a.MappingMaterialBuilder=function(){function d(){return["varying vec2 _vTexCoord;","void main() {","  _vTexCoord = uv;","  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);","}"].join("\n")}function e(c,d,e){var f,g={publicUniformDeclarations:"",publicUniformDefinitions:""},h=(1/c.data.length/2).toFixed(20),i=c.texture.image.width.toFixed(1);return b.reduce(c.userUniforms,function(b,c,e){var f=a.UniformUtils.fullSwizzleStringForUniformType(c.userUniform.type),g=a.UniformUtils.glslDataTypeForUniformType(c.userUniform.type),j="(("+c.position.toFixed(1)+" + ((textIndex - ((1.0 / "+d.toFixed(1)+") / 2.0)) * "+d.toFixed(1)+")) / "+i+") + "+h;return b.publicUniformDeclarations+=g+" "+e+";\n",b.publicUniformDefinitions+="   "+e+" = texture2D(_userUniformsTexture, vec2("+j+", 0.5))."+f+";\n",b},g),f=[a.Assets.Shaders.Blending,a.Assets.Shaders.TextTexture,"uniform sampler2D _uSampler;","uniform vec2 _uCanvasResolution;","uniform sampler2D _uTextIndicesTexture;","uniform sampler2D _uTextBoundsTexture;","varying vec2 _vTexCoord;","vec4 _textBounds;","uniform sampler2D _userUniformsTexture;",g.publicUniformDeclarations,"// Helper function used by user programs to retrieve texel color information within the bounds of","// any given text. This is to be used instead of `texture2D` in the fragment sources for all Blotter materials.","vec4 textTexture(vec2 coord) {","   vec2 adjustedFragCoord = _textBounds.xy + vec2((_textBounds.z * coord.x), (_textBounds.w * coord.y));","   vec2 uv = adjustedFragCoord.xy / _uCanvasResolution;","   //  If adjustedFragCoord falls outside the bounds of the current texel's text, return `vec4(0.0)`.","   if (adjustedFragCoord.x < _textBounds.x ||","       adjustedFragCoord.x > _textBounds.x + _textBounds.z ||","       adjustedFragCoord.y < _textBounds.y ||","       adjustedFragCoord.y > _textBounds.y + _textBounds.w) {","     return vec4(0.0);","   }","   return texture2D(_uSampler, uv);","}","void mainImage(out vec4 mainImage, in vec2 fragCoord);",e,"void main(void) {","   vec4 textIndexData = texture2D(_uTextIndicesTexture, _vTexCoord);","   float textIndex = textIndexData.r;","   float textAlpha = textIndexData.a;","   _textBounds = texture2D(_uTextBoundsTexture, vec2(textIndex, 0.5));",g.publicUniformDefinitions,"   uResolution = _textBounds.zw;","   vec2 fragCoord = gl_FragCoord.xy - _textBounds.xy;","   vec4 outColor;","   mainImage(outColor, fragCoord);","   outColor.a = outColor.a * textAlpha;","   gl_FragColor = outColor;","}"],f.join("\n")}function f(b,c){a.TextTextureBuilder.build(b,function(a){c(a)})}function g(c,d){var e,f,g,h=[];e=function(){return function(b){a.IndicesDataTextureBuilder.build(c,function(a){h.push({uniformName:"_uTextIndicesTexture",texture:a}),b()})}},f=function(){return function(b){a.BoundsDataTextureBuilder.build(c,function(a){h.push({uniformName:"_uTextBoundsTexture",texture:a}),b()})}},g=[e(),f()],b(g).reduceRight(b.wrap,function(){d(h)})()}function h(d,e,f){a.UniformUtils.ensureHasRequiredDefaultUniforms(d,"Blotter.MappingMaterialBuilder","_buildUserUniformDataTextureObjects"),d=a.UniformUtils.extractValidUniforms(d);var g=Object.keys(d).length*e,h=new Float32Array(4*g),i=new c.DataTexture(h,g,1,c.RGBAFormat,c.FloatType),j={data:h,texture:i,userUniforms:{}};b.reduce(d,function(a,b,c){var f=Object.keys(d).indexOf(c)*e;return a.userUniforms[c]={userUniform:b,position:f},a},j),f(j)}function i(a){return b.reduce(a,function(a,b){return a[b.uniformName]={type:"t",value:b.texture},a},{})}function j(a){return{_userUniformsTexture:{type:"t",value:a.texture}}}function k(a,c,d,e,f){var g={_uSampler:{type:"t",value:d},_uCanvasResolution:{type:"2f",value:[a,c]}};return b.extend(g,i(e)),b.extend(g,j(f)),g}function l(a,b,d){var e=new c.ShaderMaterial({vertexShader:a,fragmentShader:b,uniforms:d});return e.depthTest=!1,e.depthWrite=!1,e.premultipliedAlpha=!1,e}return{build:function(c,i,j){var m,n,o,p,q;m=function(){return function(a){f(c,function(b){o=b,a()})}},n=function(){return function(a){g(c,function(b){p=b,a()})}},buildUserUniformDataTextureObjects=function(){return function(a){h(i.uniforms,c.texts.length,function(b){userUniformDataTextureObjects=b,a()})}},q=[m(),n(),buildUserUniformDataTextureObjects()],b(q).reduceRight(b.wrap,function(){var f=k(c.width,c.height,o,p,userUniformDataTextureObjects),g=(b.omit(f,"_uCanvasResolution","_uSampler","_uTextBoundsTexture","_uTextIndicesTexture"),l(d(),e(userUniformDataTextureObjects,c.texts.length,i.mainImage),f));j(new a.MappingMaterial(c,i,g,userUniformDataTextureObjects))})()}}}()}(this.Blotter,this._,this.THREE);
(function(Blotter) {

  Blotter.FliesMaterial = function() {
    Blotter.Material.apply(this, arguments);
  };

  Blotter.FliesMaterial.prototype = Object.create(Blotter.Material.prototype);

  Blotter._extendWithGettersSetters(Blotter.FliesMaterial.prototype, (function () {

    function _mainImageSrc () {
      var mainImageSrc = [
        Blotter.Assets.Shaders.Random,

        "vec2 random2(vec2 p) {",
        "    return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);",
        "}",

        "float isParticle(out vec3 particleColor, vec2 fragCoord, float pointRadius, float pointCellWidth, float dodge, vec2 dodgePosition, float dodgeSpread, float speed) {    ",
        "    if (pointCellWidth == 0.0) { return 0.0; };",

        "    vec2 uv = fragCoord.xy / uResolution.xy;",

        "    float pointRadiusOfCell = pointRadius / pointCellWidth;",

        "    vec2 totalCellCount = uResolution.xy / pointCellWidth;",
        "    vec2 cellUv = uv * totalCellCount;",

        "    // Tile the space",
        "    vec2 iUv = floor(cellUv);",
        "    vec2 fUv = fract(cellUv);",

        "    float minDist = 1.0;  // minimun distance",

        "    vec4 baseSample = textTexture(cellUv);",
        "    float maxWeight = 0.0;",
        "    particleColor = baseSample.rgb;",

        "    for (int y= -1; y <= 1; y++) {",
        "        for (int x= -1; x <= 1; x++) {",
        "            // Neighbor place in the grid",
        "            vec2 neighbor = vec2(float(x), float(y));",

        "            // Random position from current + neighbor place in the grid",
        "            vec2 point = random2(iUv + neighbor);",

        "            // Get cell weighting from cell's center alpha",
        "            vec2 cellRowCol = floor(fragCoord / pointCellWidth) + neighbor;",
        "            vec2 cellFragCoord = ((cellRowCol * pointCellWidth) + (pointCellWidth / 2.0));",
        "            vec4 cellSample = textTexture(cellFragCoord / uResolution.xy);",
        "            float cellWeight = cellSample.a;",

        "            if (cellWeight < 1.0) {",
        "               // If the cell is not fully within our text, we should disregard it",
        "               continue;",
        "            }",

        "            maxWeight = max(maxWeight, cellWeight);",
        "            if (cellWeight == maxWeight) {",
        "                particleColor = cellSample.rgb;",
        "            }",

        "            float distanceFromDodge = distance(dodgePosition * uResolution.xy, cellFragCoord) / uResolution.y;",
        "            distanceFromDodge = 1.0 - smoothstep(0.0, dodgeSpread, distanceFromDodge);",

        "            // Apply weighting to noise and dodge if dodge is set to 1.0",
        "            cellWeight = step(cellWeight, random(cellRowCol)) + (distanceFromDodge * dodge);",

        "            // Animate the point",
        "            point = 0.5 + 0.75 * sin((uGlobalTime * speed) + 6.2831 * point);",

        "            // Vector between the pixel and the point",
        "            vec2 diff = neighbor + point - fUv;",

        "            // Distance to the point",
        "            float dist = length(diff);",
        "            dist += cellWeight; // Effectively remove point",

        "            // Keep the closer distance",
        "            minDist = min(minDist, dist);",
        "        }",
        "    }",


        "    float pointEasing = pointRadiusOfCell - (1.0 / pointCellWidth);",

        "    float isParticle = 1.0 - smoothstep(pointEasing, pointRadiusOfCell, minDist);",

        "    return isParticle;",
        "}",

        "void mainImage( out vec4 mainImage, in vec2 fragCoord ) {",
        "    vec2 uv = fragCoord.xy / uResolution.xy;",

        "    // Convert uPointCellWidth to pixels, keeping it between 1 and the total y resolution of the text",
        "    // Note: floor uPointCellWidth here so that we dont have half pixel widths on retina displays",
        "    float pointCellWidth = floor(max(0.0, min(1.0, uPointCellWidth) * uResolution.y));",

        "    // Ensure uPointRadius allow points to exceed the width of their cells",
        "    float pointRadius = uPointRadius * 0.8;",
        "    pointRadius = min(pointRadius * pointCellWidth, pointCellWidth);",

        "    float dodge = ceil(uDodge);",

        "    vec3 outColor = vec3(0.0);",
        "    float point = isParticle(outColor, fragCoord, pointRadius, pointCellWidth, dodge, uDodgePosition, uDodgeSpread, uSpeed);",

        "    mainImage = vec4(outColor, point);",
        "}"
      ].join("\n");

      return mainImageSrc;
    }

    return {

      constructor : Blotter.FliesMaterial,

      init : function () {
        this.mainImage = _mainImageSrc();
        this.uniforms = {
          uPointCellWidth : { type : "1f", value : 0.04 },
          uPointRadius : { type : "1f", value : 0.75 },
          uDodge : { type : "1f", value : 0.0 },
          uDodgePosition : { type : "2f", value : [0.5, 0.5] },
          uDodgeSpread : { type : "1f", value : 0.25 },
          uSpeed : { type : "1f", value : 1.0 }
        };
      }
    };

  })());

})(
  this.Blotter
);



let below = false;

const cutoffHead = 200;

var textHead = new Blotter.Text("The Hidden Gatsbies", {
  family : "serif",
  size : 100,
  fill : "white",
  paddingLeft : 300,
});

var materialHead = new Blotter.FliesMaterial();

materialHead.uniforms.uPointCellWidth.value = 0.017;
materialHead.uniforms.uPointRadius.value = .8;
materialHead.uniforms.uSpeed.value = 5;

var blotterHead = new Blotter(materialHead, { 
  texts : textHead,
});

blotterHead.needsUpdate = true;

var elemHead = document.getElementById('title-text');
var scopeHead = blotterHead.forText(textHead);

scopeHead.appendTo(elemHead);


window.addEventListener("scroll", (event) => {
    let scroll = this.scrollY;
    if(this.scrollY > cutoffHead)
      elemHead.style.opacity = 0;
    else
      elemHead.style.opacity = 1-this.scrollY/cutoffHead;
});
