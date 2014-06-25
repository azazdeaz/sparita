'use strict';

var EdiBox = require('./EdiBox');

function Editor(model) {

  var that = this,
    x, y, z, ediBoxes = [],
    boxSize = [30, 30, 30],
    camera, scene, renderer, controls,
    projector, raycaster;

  this._renderW = 400;
  this._renderH = 300;

  this.scene = scene = new THREE.Scene({antialias: true});

  this.camera = camera = new THREE.PerspectiveCamera(45, this._renderW / this._renderH, 0.1, 1000);
  camera.position.z = 300;
  this.scene.add(camera);

  controls = new THREE.OrbitControls(camera);
  controls.addEventListener('change', render);

  this.renderer = renderer = new THREE.WebGLRenderer({alpha: false});
  renderer.setSize(this._renderW, this._renderH);
  this.domElement = renderer.domElement;

  projector = new THREE.Projector();
  raycaster = new THREE.Raycaster();

  var pointLight = new THREE.PointLight(0xFFFFFF);
  pointLight.position.x = 310;
  pointLight.position.y = 250;
  camera.add(pointLight);
  pointLight = new THREE.PointLight(0xFFFFFF);
  pointLight.position.x = -310;
  pointLight.position.y = -250;
  camera.add(pointLight);


  for (x = 0; x < model.div[0]; ++x) {
    for (y = 0; y < model.div[1]; ++y) {
      for (z = 0; z < model.div[2]; ++z) {

        var ediBox = new EdiBox({
          div: model.boxDiv,
          size: boxSize,
          renderer: renderer,
          camera: camera,
          recordHistory: this.recordHistory.bind(this)
        });
        this.scene.add(ediBox.mesh);
        ediBox.mesh.position.x = (model.div[0] / -2 + x) * boxSize[0];
        ediBox.mesh.position.y = (model.div[1] / -2 + y) * boxSize[1];
        ediBox.mesh.position.z = (model.div[2] / -2 + z) * boxSize[2];
        ediBox.onChange = render;
        ediBoxes.push(ediBox);
      }
    }
  }

  renderer.domElement.addEventListener('click', function(e) {

    var mx = e.hasOwnProperty('offsetX') ? e.offsetX : e.layerX,
      my = e.hasOwnProperty('offsetY') ? e.offsetY : e.layerY;

    mx = (mx / that._renderW) * 2 - 1;
    my = (my / that._renderH) * -2 + 1;

    var vector = new THREE.Vector3(mx, my, 1);
    projector.unprojectVector(vector, camera);

    raycaster.set(camera.position, vector.sub(camera.position).normalize());
    var intersects = raycaster.intersectObjects(that.scene.children);

    if (intersects.length) {

      ediBoxes.forEach(function (ediBox) {

        if (intersects[0].object === ediBox.mesh) {

          ediBox.showHandlers();
        }
      });
    }
  });

  renderer.render(this.scene, camera);

  function animate() {

    this.animateRafId = requestAnimationFrame(animate);
    controls.update();
  }

  function render() {

    renderer.render(that.scene, camera);
  }
}

var p = Editor.prototype;

p.setSize = function(w, h) {

  this._renderW = w;
  this._renderH = h;
  this.camera.aspect = this._renderW / this._renderH;
  this.camera.updateProjectionMatrix();

  this.renderer.setSize(this._renderW, this._renderH);

  // this.render();
};



//history
p.undo = function () {

  if (this._historyPointer > 0) {

    --this._historyPointer;
    var f = this._history[this._historyPointer].undo;
    f[0].apply(f[1], f.slice(2));

    return true;
  }
  else {
    return false;
  }
};

p.redo = function () {

  if (this._historyPointer < this._history.length) {

    var f = this._history[this._historyPointer].redo;
    f[0].apply(f[1], f.slice(2));

    ++this._historyPointer;

    return true;
  }
  else {
    return false;
  }
};

p.recordHistory = function (reg) {

  if (this._historyPointer < this._history.length) {
    this._history = this._history.splice(0, this._historyPointer);
  }

  this._history.push(reg);
  this._historyPointer = this._history.length;
};




p.destroy = function () {

  window.cancelAnimationFrame(this.animateRafId);
};



module.exports = Editor;
