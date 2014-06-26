'use strict';

var EdiBox = require('./EdiBox');
  // calcBlueprint = require('./calcBlueprint');

function Editor(model) {

  var that = this,
    x, y, z, ediBoxes = [],
    boxSize = [30, 30, 30],
    camera, scene, renderer, controls,
    projector, raycaster,
    currEdiBox;

  this._renderW = 400;
  this._renderH = 300;

  this.initModel = model;

  this.scene = scene = new THREE.Scene({antialias: true});

  this.camera = camera = new THREE.PerspectiveCamera(45, this._renderW / this._renderH, 0.1, 1000);
  camera.position.z = 300;
  this.scene.add(camera);


  this.renderer = renderer = new THREE.WebGLRenderer({alpha: false});
  renderer.setSize(this._renderW, this._renderH);
  this.domElement = renderer.domElement;

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.addEventListener('change', this.render.bind(this));

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
          render: this.render.bind(this),
          recordHistory: this.recordHistory.bind(this)
        });
        this.scene.add(ediBox.mesh);
        ediBox.mesh.position.x = (((model.div[0]-1) / -2) + x) * boxSize[0];
        ediBox.mesh.position.y = (((model.div[1]-1) / -2) + y) * boxSize[1];
        ediBox.mesh.position.z = (((model.div[2]-1) / -2) + z) * boxSize[2];
        ediBox.onChange = this.render.bind(this);
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

          if (currEdiBox) {
            currEdiBox.hideHandlers();
          }
          currEdiBox = ediBox;
          currEdiBox.showHandlers();
        }
      });
    }
  });

  this.render();
}

var p = Editor.prototype;

p.render = function () {
console.log('render')
  this.renderer.render(this.scene, this.camera);
};

p.setSize = function(w, h) {

  this._renderW = w;
  this._renderH = h;
  this.camera.aspect = this._renderW / this._renderH;
  this.camera.updateProjectionMatrix();

  this.renderer.setSize(this._renderW, this._renderH);

  this.render();
};

p.getModel = function () {

  var model = [];

  this.ediBoxes.forEach(function (bx, x) {

    model.push([]);

    bx.forEach(function (by, y) {

      model[x].push([]);

      by.forEach(function (bz, z) {

        model[x][y][z] = bz.getCornerList();
      });
    });
  });

  model.div = this.initModel.div.slice();
  model.boxDiv = this.initModel.boxDiv.slice();

  return model;
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



function renderBlueprint(wire, w, h) {

  var c = document.createElement('canvas'),
    ctx = c.getContext('2d'),
    m = 8,
    sx = (w - 2*m) / wire.divX,
    sy = (h - 2*m) / wire.divY;

  c.width = w;
  c.height = h;

  // ctx.fillStyle = 'rgba(0, 0, 0, .23)';
  // ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.shadowBlur = m;
  ctx.shadowColor = '#000';
  ctx.translate(m, m);

  wire.continuous.forEach(function (l) {

    ctx.moveTo(k(l[0]*sx), k(l[1]*sy));
    ctx.lineTo(k(l[2]*sx), k(l[3]*sy));
  });

  //debug, delMe
  ctx.stroke();
  ctx.beginPath();
  ctx.lineWidth = 6;

  wire.dashed.forEach(function (l) {

    var dx = (l[2] - l[0]) * sx,
      dy = (l[3] - l[1]) * sy,
      d = Math.abs(Math.sqrt(dx*dx + dy*dy)),
      steps = Math.round(d / 23) * 2 + 1,
      stepX = dx / steps,
      stepY = dy / steps,
      startX = l[0] * sx,
      startY = l[1] * sy;

    for (var i = 0; i <= steps; ++i) {

      if(i % 2 === 0) {
          ctx.moveTo(startX + stepX * i, startY + stepY * i);
      } else {
          ctx.lineTo(startX + stepX * i, startY + stepY * i);
      }
    }
  });

  function k(lp) {
      return (parseInt(lp) + 0.5);
  }

  ctx.stroke();

  var $name = $('<div>')
      .css({
          position: 'absolute',
          fontFamily: 'Arvo, serif',
          fontWeight: 700,
          fontSize: '32px',
          color: '#fff',
          textAlign: 'center',
          opacity: 0,
          left: 15,
          top: 12,
          // backgroundColor: 'rgba(0, 0, 0, .43)'
      })
      .text(wire.name)
      .addClass('name');

  var $cont = $('<div>')
      .css({
          position: 'absolute',
          width: w,
          height: h
      })
      .addClass('wire')
      .append(c, $name);

  $cont.width = w;
  $cont.height = h;

  return $cont;
}



module.exports = Editor;
