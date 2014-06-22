'use strict';

var EdiBox = require('./EdiBox');

function Editor(model) {

  var that = this, x, y, z, ediBoxes = [], boxSize = [30, 30, 30],
  camera, scene, renderer, controls,
  projector, raycaster;

  projector = new THREE.Projector();
  raycaster = new THREE.Raycaster();

  this._renderW = 400;
  this._renderH = 300;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera( 45, this._renderW / this._renderH, .1, 1000 );
  camera.position.z = 300;
  scene.add(camera);

  controls = new THREE.OrbitControls( camera );
  controls.addEventListener( 'change', render );

  renderer = new THREE.WebGLRenderer({alpha: false});
  renderer.setSize( this._renderW, this._renderH );
  this.domElement = renderer.domElement;

  var pointLight = new THREE.PointLight(0xFFFFFF);
  pointLight.position.x = 310;
  pointLight.position.y = 250;
  // pointLight.position.z = 0;
  camera.add(pointLight);
  pointLight = new THREE.PointLight(0xFFFFFF);
  pointLight.position.x = -310;
  pointLight.position.y = -250;
  // pointLight.position.z = 400;
  camera.add(pointLight);


  for (x = 0; x < model.div[0]; ++x) {
    for (y = 0; y < model.div[1]; ++y) {
      for (z = 0; z < model.div[2]; ++z) {

        var ediBox = new EdiBox(model.boxDiv, boxSize);
        scene.add(ediBox.mesh);
        ediBox.mesh.position.x = (model.div[0]/-2 + x) * boxSize[0];
        ediBox.mesh.position.y = (model.div[1]/-2 + y) * boxSize[1];
        ediBox.mesh.position.z = (model.div[2]/-2 + z) * boxSize[2];
        ediBoxes.push(ediBox);
      }
    }
  }

  renderer.domElement.addEventListener('click', function (e) {

  	var mx = e.hasOwnProperty('offsetX') ? e.offsetX : e.layerX,
		my = e.hasOwnProperty('offsetY') ? e.offsetY : e.layerY,

	mx = (mx / that._renderW) * 2 - 1
 	my = (my / that._renderH) * -2 + 1
	
	var vector = new THREE.Vector3( mx, my, 1 );
		projector.unprojectVector( vector, camera );

	raycaster.set( camera.position, vector.sub( camera.position ).normalize() );
	var intersects = raycaster.intersectObjects( scene.children );
	console.log(mx, my, intersects);
  });

  renderer.render( scene, camera );

	function animate() {

	  requestAnimationFrame( animate );
	  controls.update();
	}

	function render() {

	  renderer.render( scene, camera );
	}
}

var p = Editor.prototype;

p.setSize = function (w, h) {
  // this.camera.aspect = window.innerWidth / window.innerHeight;
  // this.camera.updateProjectionMatrix();

  // this.renderer.setSize( window.innerWidth, window.innerHeight );

  // this.render();
}

module.exports = Editor;
