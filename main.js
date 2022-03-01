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
const omegaC = 0.6;
let omega = omegaC;

const dumpGroundLoc = 60;
const myrtleLoc = 260;
const carLoc = 460;


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

const spaceTexture = new THREE.TextureLoader().load('images/space.jpg');
scene.background = spaceTexture;




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
  scene.add(obj);
}


makeImage('dump-ground.png', dumpGroundLoc, true);
makeImage('myrtle.png', myrtleLoc, false);
makeImage('death-car.jpg', carLoc, true);



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

let tt = 0;

function animate() {
  requestAnimationFrame(animate);

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
