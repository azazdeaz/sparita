'use strict';

var EdiBox = require('./EdiBox');

function Editor(model) {

  var x, y, z, ediBoxes = [], boxSize = [30, 30, 30],
  camera, scene, renderer;

  this._renderW = 400;
  this._renderH = 300;

  camera = new THREE.PerspectiveCamera( 45, this._renderW / this._renderH, .1, 1000 );
  camera.position.z = 300;

  scene = new THREE.Scene();

  renderer = new THREE.WebGLRenderer({alpha: false});
  renderer.setSize( this._renderW, this._renderH );
  this.domElement = renderer.domElement;

  // var pointLight = new THREE.PointLight(0xFFFFFF);
  // // set its position
  // pointLight.position.x = 10;
  // pointLight.position.y = 50;
  // pointLight.position.z = 130;
  // // add to the scene
  // scene.add(pointLight);

  for (x = 0; x < model.div[0]; ++x) {
    for (y = 0; y < model.div[1]; ++y) {
      for (z = 0; z < model.div[2]; ++z) {

        var ediBox = new EdiBox(model.boxDiv, boxSize);
        scene.add(ediBox.mesh);
        // ediBox.mesh.position.y = 213
        ediBoxes.push(ediBox);
      }
    }
  }

  renderer.render( scene, camera );
}

var p = Editor.prototype;

p.setSize = function (w, h) {

}

module.exports = Editor;
