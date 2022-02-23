import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

// Setup

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);

const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
camera.position.setZ(30);
camera.position.setX(-3);

renderer.render(scene, camera);

// Torus

const geometry = new THREE.TorusGeometry(10, 3, 16, 100);
const material = new THREE.MeshStandardMaterial({ color: 0xff6347 });
const torus = new THREE.Mesh(geometry, material);

scene.add(torus);

let sun = new THREE.Vector3();

const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );
const water = new Water(
  waterGeometry,
  {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load( 'waternormals.jpg', function ( texture ) {

      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

    } ),
    sunDirection: new THREE.Vector3(),
    sunColor: 0xAAAAAA,
    waterColor: 0x001e0f,
    distortionScale: 3.7,
    fog: scene.fog !== undefined
  }
);

water.rotation.x = - Math.PI / 2;

scene.add( water );


const sky = new Sky();
sky.scale.setScalar( 10000 );
scene.add( sky );

const skyUniforms = sky.material.uniforms;

skyUniforms[ 'turbidity' ].value = 0.1;
skyUniforms[ 'rayleigh' ].value = 1; // 0.005
skyUniforms[ 'mieCoefficient' ].value = 0.0000005;
skyUniforms[ 'mieDirectionalG' ].value = 0.008;


const pmremGenerator = new THREE.PMREMGenerator( renderer );


sun.setFromSphericalCoords( 1, 1, 190 );

sky.material.uniforms[ 'sunPosition' ].value.copy( sun );
water.material.uniforms[ 'sunDirection' ].value.copy( sun ).normalize();

scene.environment = pmremGenerator.fromScene( sky ).texture;


const greenLight = new THREE.PointLight(0xff0000);
greenLight.position.set( 0, 50, 50 );
greenLight.intensity = 5;
scene.add( greenLight );

const ambientLight = new THREE.AmbientLight(0xffffff);
ambientLight.intensity = 1;
scene.add(ambientLight);

// Helpers

const gridHelper = new THREE.GridHelper(200, 50);
const pointHelper = new THREE.PointLightHelper(greenLight);
scene.add(pointHelper, gridHelper)

const controls = new OrbitControls(camera, renderer.domElement);

function addStar() {
  const geometry = new THREE.SphereGeometry(2, 24, 24);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const star = new THREE.Mesh(geometry, material);

  let theta = THREE.MathUtils.randFloatSpread(Math.PI);
  let phi = THREE.MathUtils.randFloatSpread(Math.PI*2);
  let r = THREE.MathUtils.randFloatSpread(1000)+1000;
  let y = r*Math.cos(theta);
  let rho = r*Math.sin(theta);
  let x = rho*Math.sin(phi);
  let z = rho*Math.cos(phi);

  console.log([x,y,z]);

  star.position.set(x, y, z);
  scene.add(star);
}

Array(2000).fill().forEach(addStar);

// Background

const spaceTexture = new THREE.TextureLoader().load('space.jpg');
scene.background = spaceTexture;

// Scroll Animation

function moveCamera() {
  const t = document.body.getBoundingClientRect().top;
  camera.position.z = t * -0.01;
  camera.position.x = t * -0.0002;
  camera.rotation.y = t * -0.0002;
}

// document.body.onscroll = moveCamera;
// moveCamera();

// Animation Loop

function animate() {
  requestAnimationFrame(animate);

  torus.rotation.x += 0.01;
  torus.rotation.y += 0.005;
  torus.rotation.z += 0.01;
  water.material.uniforms[ 'time' ].value += 2.0 / 60.0;

  controls.update();

  renderer.render(scene, camera);
}

animate();
