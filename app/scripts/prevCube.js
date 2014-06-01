'use strict';

var lastRender, uSize = 12,
    cubesX = 4, cubesY = 2, cubesZ = 3,
    divX = 2, divY = 1, divZ = 3;

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

function getTexture(cubesX, cubesY, divX, divY) {

  var bitmap = document.createElement('canvas'),
    ctx = bitmap.getContext('2d'), pos;

  bitmap.width = cubesX * divX * uSize;
  bitmap.height = cubesY * divY * uSize;
  ctx.fillStyle =  'eeeded';
  ctx.fillRect(0, 0, bitmap.width, bitmap.height);
  ctx.strokeStyle =  'a0a0a0';

  for (var cx = 0; cx <= cubesX; ++cx) {
    
    pos = cx * divX * uSize;
    line(pos, 0, pos, bitmap.height, 2);

    for (var dx = 0; cx < cubesX && dx < divX; ++dx) {

      pos = (cx * divX + dx) * uSize;
      line(pos, 0, pos, bitmap.height, 1);
    }
  }

  for (var cy = 0; cy <= cubesY; ++cy) {
    
    pos = cy * divY * uSize;
    line(0, pos, bitmap.width, pos, 2);

    for (var dy = 0; cy < cubesY && dy < divY; ++dy) {

      pos = (cy * divY + dy) * uSize;
      line(0, pos, bitmap.width, pos, 1);
    }
  }

  document.body.appendChild(bitmap)
  return bitmap;

  function line(sx, sy, ex, ey, lineWidth) {

    ctx.beginPath();
    ctx.lineWidth = lineWidth;
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }
}

var materials = [], material, texture;

texture = new THREE.Texture(getTexture(cubesZ, cubesY, divZ, divY));
texture.needsUpdate = true;
material = new THREE.MeshBasicMaterial({map: texture});
materials.push(material, material);

texture = new THREE.Texture(getTexture(cubesX, cubesZ, divX, divZ));
texture.needsUpdate = true;
material = new THREE.MeshBasicMaterial({map: texture});
materials.push(material, material);

texture = new THREE.Texture(getTexture(cubesX, cubesY, divX, divY));
texture.needsUpdate = true;
material = new THREE.MeshBasicMaterial({map: texture});
materials.push(material, material);

var cubeMaterial = new THREE.MeshFaceMaterial(materials.concat(materials));




// create a new mesh with
// cube geometry - we will cover
// the cubeMaterial next!
var cube = window.cube= new THREE.Mesh(new THREE.BoxGeometry(
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