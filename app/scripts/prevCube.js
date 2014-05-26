'use strict';

var lastRender, uSize = 30,
    cubesX = 1, cubesY = 2, cubesZ = 3,
    divX = 3, divY = 3, divZ = 3;

// set the scene size
var WIDTH = 400,
  HEIGHT = 300;

// set some camera attributes
var VIEW_ANGLE = 45,
  ASPECT = WIDTH / HEIGHT,
  NEAR = 0.1,
  FAR = 10000;

// get the DOM element to attach to
// - assume we've got jQuery to hand
var $container = $('#container');

// create a WebGL renderer, camera
// and a scene
var renderer = new THREE.WebGLRenderer({alpha: true});
var camera =
  new THREE.PerspectiveCamera(
    VIEW_ANGLE,
    ASPECT,
    NEAR,
    FAR);


var scene = new THREE.Scene();

// add the camera to the scene
scene.add(camera);

// the camera starts at 0,0,0
// so pull it back
camera.position.z = 300;

// start the renderer
renderer.setSize(WIDTH, HEIGHT);


var bitmap = document.createElement('canvas');
bitmap.width = 100;
bitmap.height = 100;
var ctx = bitmap.getContext('2d');
ctx.fillStyle = '#ff3382';
ctx.fillRect(0, 0, 100, 100);
ctx.fillStyle = '#36ff14';
ctx.fillRect(10, 10, 80, 80);


// create the cube's material

var materials = [], faceMaterial, texture;
texture = new THREE.Texture(bitmap);
texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(cubesX, cubesY);
texture.needsUpdate = true;
materials.push(new THREE.MeshBasicMaterial({map: texture}));

texture = new THREE.Texture(bitmap);
texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(cubesZ, cubesY);
texture.needsUpdate = true;
materials.push(new THREE.MeshBasicMaterial({map: texture}));

texture = new THREE.Texture(bitmap);
texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(cubesX, cubesZ);
texture.needsUpdate = true;
materials.push(new THREE.MeshBasicMaterial({map: texture}));

var cubeMaterial = new THREE.MeshFaceMaterial(materials);




// create a new mesh with
// cube geometry - we will cover
// the cubeMaterial next!
var cube = new THREE.Mesh(new THREE.CubeGeometry(
  uSize * cubesX * divX, 
  uSize * cubesY * divY, 
  uSize * cubesZ * divZ), cubeMaterial);
cube.rotation.x = -12;
cube.rotation.y = 23;

// add the cube to the scene
scene.add(cube);


// create a point light
var pointLight = new THREE.PointLight(0xFFFFFF);
// set its position
pointLight.position.x = 10;
pointLight.position.y = 50;
pointLight.position.z = 130;
// add to the scene
scene.add(pointLight);

// draw!
renderer.render(scene, camera);
window.render = function () {renderer.render(scene, camera);}
window.cube = cube;

function animSpin () {

  window.requestAnimationFrame(animSpin);

  var now = window.performance.now();
  
  cube.rotation.y += 0.00067 * (now - lastRender);
  renderer.render(scene, camera);

	lastRender = now;
}

function startSpin() {

	lastRender = window.performance.now();
	window.requestAnimationFrame(animSpin);
}

function stopSpin() {

	window.cancelAnimationFrame(animSpin);
}

startSpin();

module.exports = {

	domElement: renderer.domElement,
	startSpin: startSpin,
	stopSpin: stopSpin
}