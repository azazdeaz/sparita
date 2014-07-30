'use strict';

function EdiBox(opt) {

  this._opt = opt;

  this._div = opt.div;
  this._size = opt.size;
  this.renderer = opt.renderer;
  this.camera = opt.camera;
  this.render = opt.render;
  this.recordHistory = opt.recordHistory;

  var geometry = new THREE.Geometry();
  geometry.dynamic = true;

  this._cornerList = [
    [0, 0, 0],
    [1, 0, 0],
    [1, 0, 1],
    [0, 0, 1],
    [0, 1, 0],
    [1, 1, 0],
    [1, 1, 1],
    [0, 1, 1]
  ].map(function (corner) {

    geometry.vertices.push(new THREE.Vector3(
      (corner[0] - 0.5) * this._size.x,
      (corner[1] - 0.5) * this._size.y,
      (corner[2] - 0.5) * this._size.z
    ));

    corner[0] *= this._div.x;
    corner[1] *= this._div.y;
    corner[2] *= this._div.z;

    return corner;

  }, this);

  this._neighbors = [
    [-1,  1, -1,  4, -1,  3],
    [ 0, -1, -1,  5, -1,  2],
    [ 3, -1, -1,  6,  1, -1],
    [-1,  2, -1,  7,  0, -1],
    [-1,  5,  0, -1, -1,  7],
    [ 4, -1,  1, -1,  6, -1],
    [ 7, -1,  2, -1,  5, -1],
    [-1,  6,  3, -1,  4, -1]
  ];

  geometry.faces.push(new THREE.Face3(0, 1, 2));
  geometry.faces.push(new THREE.Face3(2, 3, 0));
  geometry.faces.push(new THREE.Face3(4, 5, 1));
  geometry.faces.push(new THREE.Face3(1, 0, 4));
  geometry.faces.push(new THREE.Face3(6, 5, 1));
  geometry.faces.push(new THREE.Face3(1, 2, 6));
  geometry.faces.push(new THREE.Face3(7, 4, 0));
  geometry.faces.push(new THREE.Face3(0, 3, 7));
  geometry.faces.push(new THREE.Face3(7, 6, 2));
  geometry.faces.push(new THREE.Face3(2, 3, 7));
  geometry.faces.push(new THREE.Face3(4, 5, 6));
  geometry.faces.push(new THREE.Face3(6, 7, 4));

  // geometry.computeCentroids();
  geometry.computeFaceNormals();
  geometry.computeVertexNormals();

  // geometry = new THREE.BoxGeometry(20, 20, 20);
  // var material = new THREE.MeshLambertMaterial({wireframe: false,color: 0x0000FF});
  var material = new THREE.MeshNormalMaterial();
  // var material = new THREE.MeshBasicMaterial({wireframe: true,color: 'blue'});
  material.side = THREE.DoubleSide;

  this.mesh = new THREE.Mesh(geometry, material);


  this.handlers = [
    this.createCornerHandler(this._cornerList[0]),
    this.createCornerHandler(this._cornerList[1]),
    this.createCornerHandler(this._cornerList[2]),
    this.createCornerHandler(this._cornerList[3]),
    this.createCornerHandler(this._cornerList[4]),
    this.createCornerHandler(this._cornerList[5]),
    this.createCornerHandler(this._cornerList[6]),
    this.createCornerHandler(this._cornerList[7]),
    this.createEdgeHandler(this._cornerList[0], this._cornerList[1]),
    this.createEdgeHandler(this._cornerList[1], this._cornerList[2]),
    this.createEdgeHandler(this._cornerList[2], this._cornerList[3]),
    this.createEdgeHandler(this._cornerList[3], this._cornerList[0]),
    this.createEdgeHandler(this._cornerList[4], this._cornerList[5]),
    this.createEdgeHandler(this._cornerList[5], this._cornerList[6]),
    this.createEdgeHandler(this._cornerList[6], this._cornerList[7]),
    this.createEdgeHandler(this._cornerList[7], this._cornerList[4]),
    this.createEdgeHandler(this._cornerList[0], this._cornerList[4]),
    this.createEdgeHandler(this._cornerList[1], this._cornerList[5]),
    this.createEdgeHandler(this._cornerList[2], this._cornerList[6]),
    this.createEdgeHandler(this._cornerList[3], this._cornerList[7])
  ];
}

var p = EdiBox.prototype;

p.showHandlers = function() {

  this.handlers.forEach(function(handler) {

    handler.show();
  });
};

p.hideHandlers = function() {

  this.handlers.forEach(function(handler) {

    handler.hide();
  });
};

p.fitHandlers = function () {

  this.handlers.forEach(function (handler) {

    handler.fit();
  });
};

p.createCornerHandler = function(corner) {

  var that = this;

  var de = createCornerHandlerCircle();
  de.onmousedown = function (e) {
    that.selectHandler(handler, e.pageX, e.pageY);
  };

  var handler = {
    domElement: de,
    corners: [corner]
  };

  handler.show = function() {

    handler.fit();
    de.style.visibility = 'visible';
    that._opt.handlerLayer.appendChild(de);
  };

  handler.hide = function() {

  	if (de.parentNode) {

  		de.parentNode.removeChild(de);
  	}
  };

  handler.fit = function () {

    var pos = that._vertexTo2d(that._cornerToVertex(corner));

    de.style.left = pos[0] + 'px';
    de.style.top = pos[1] + 'px';
  };

  return handler;
};

p.createEdgeHandler = function(cornerA, cornerB) {

  var that = this;

  var de = createEdgeHandlerLine();
  de.onmousedown = function (e) {
    that.selectHandler(handler, e.pageX, e.pageY);
  };

  var handler = {
    domElement: de,
    corners: [cornerA, cornerB]
  };

  handler.show = function() {

    handler.fit();
    de.style.visibility = 'visible';
    that._opt.handlerLayer.appendChild(de);
  };

  handler.hide = function() {

    if (de.parentNode) {

      de.parentNode.removeChild(de);
    }
  };

  handler.fit = function () {

    var posA = that._vertexTo2d(that._cornerToVertex(cornerA)),
      posB = that._vertexTo2d(that._cornerToVertex(cornerB)),
      dx = posB[0] - posA[0],
      dy = posB[1] - posA[1],
      rad = Math.atan2(dy, dx),
      width = Math.sqrt(dx*dx + dy*dy);

    de.style.left = posA[0] + 'px';
    de.style.top = posA[1] + 'px';
    de.firstChild.style.width = width + 'px';
    $(de).css('transform', 'rotate('+rad+'rad)');
  };

  return handler;
};

p.selectHandler = function (handler, mdx, mdy, onFinish) {

  var that = this, offsetList3d, targetList2d = [];

  offsetList3d = this._getTargetPositions(handler.corners);

  offsetList3d.concat().forEach(function (offset3d, idx) {

    var offsetList = [], offset;

    handler.corners.forEach(function (corner) {

      var cOri = that._vertexTo2d(this._cornerToVertex(corner)),
        cOff = that._vertexTo2d(this._cornerToVertex([
          corner[0] + offset3d[0],
          corner[1] + offset3d[1],
          corner[2] + offset3d[2]
        ]));

        offsetList.push([
          cOff[0] - cOri[0],
          cOff[1] - cOri[1]
        ]);
    }, this);

    offset = offsetList.reduce(function (off, curr) {
        curr[0] += off[0];
        curr[1] += off[1];
        return curr;
    }, [0, 0]);

    if (diff(0, 0, offset[0], offset[1]) < 12) {

      offsetList3d.splice(targetList2d.length, 1);
    }
    else {
      offset[0] = mdx + (offset[0] / handler.corners.length);
      offset[1] = mdy + (offset[1] / handler.corners.length);

      targetList2d.push(offset);
    }

    var deMarker = document.createElement('div');
    deMarker.style.width = '3px';
    deMarker.style.height = '3px';
    deMarker.style.left = offset[0]+'px';
    deMarker.style.top = offset[1]+'px';
    deMarker.style.position = 'absolute';
    deMarker.style.backgroundColor = '#82f';
    $(deMarker).addClass('greenMarker gm'+idx);
    that._opt.handlerLayer.appendChild(deMarker);
  }, this);

  window.addEventListener('mousemove', movePicker);
  window.addEventListener('mouseup', moveEnd);

  return true;

  //------------------------------------------------------------------------------------------

  function movePicker(e) {

      var mx = e.pageX,
          my = e.pageY,
          dc = diff(mdx, mdy, mx, my),
          mRad = Math.atan2(my-mdy, mx-mdx),
          tragetRadDiff, targetIdx, target2d;

      targetList2d.forEach(function (p, idx) {

          var rad = Math.atan2(p[1]-mdy, p[0]-mdx),
              rd = radDiff(mRad, rad);

          if (targetIdx === undefined || rd < tragetRadDiff) {

              tragetRadDiff = rd;
              targetIdx = idx;
              target2d = p;
          }
      });

      if (diff(target2d[0], target2d[1], mx, my) < dc) {
          moveEnd(true);

          handler.corners.forEach(function (corner) {
              that._moveCorner(corner, offsetList3d[targetIdx]);
          });

          that.selectHandler(handler, target2d[0], target2d[1], onFinish);
      }
  }

  function moveEnd(noCallback) {

      window.removeEventListener('mousemove', movePicker);
      window.removeEventListener('mouseup', moveEnd);

      if (!noCallback) {

          if (onFinish) {
              onFinish();
          }
      }
  }

  function diff(ax, ay, bx, by) {

      var dx = bx - ax,
        dy = by - ay;

      return Math.abs(Math.sqrt(dx*dx + dy*dy));
  }

  function radDiff(r1, r2) {

      return Math.abs(r2 - r1) % Math.PI;
  }
};

p._moveCorner = function(corner, offset, noHistory) {

  if (!noHistory) {
    // this._recordHistory({
    //   undo: [this._moveCorner, this, corner, offset.map(function (n) {return -n}), true],
    //   redo: [this._moveCorner, this, corner, offset, true],
    // });
  }

  corner[0] += offset[0];
  corner[1] += offset[1];
  corner[2] += offset[2];

  this.refreshMesh();
};

p.refreshMesh = function () {

  this.mesh.geometry.vertices.forEach(function (vertex, idx) {

    this._cornerToVertex(this._cornerList[idx], vertex);
  }, this);

  this.mesh.geometry.verticesNeedUpdate = true;
  this.mesh.geometry.normalsNeedUpdate = true;

  this.render();
  this.fitHandlers();
};

p._vertexTo2d = (function() {

  var vector = new THREE.Vector3(),
    projector = new THREE.Projector();

  return function(vertex) {

    vector.setFromMatrixPosition(this.mesh.matrixWorld);
    vector.x += vertex.x;
    vector.y += vertex.y;
    vector.z += vertex.z;

    var vector2d = projector.projectVector(vector, this.camera);

    return [
      Math.round((1 + vector2d.x) * (this.renderer.domElement.width / 2)),
      Math.round((1 - vector2d.y) * (this.renderer.domElement.height / 2))
    ];
  };
}());

p._cornerToVertex = function (corner, vertex) {

  vertex = vertex || new THREE.Vector3();

  vertex.x = (corner[0] * (this._size.x / this._div.x)) - (this._size.x / 2);
  vertex.y = (corner[1] * (this._size.y / this._div.y)) - (this._size.y / 2);
  vertex.z = (corner[2] * (this._size.z / this._div.z)) - (this._size.z / 2);

  return vertex;
};

p._getTargetPositions = function (movingCorners) {

  var ret = [], freeMoveList = [], cl = this._cornerList;

  movingCorners.forEach(function (corner) {

    var cidx = cl.indexOf(corner), n = this._neighbors[cidx], fm = [];

    if (corner[0] > 0           && n[0] !== -1 && !hit(corner, cl[n[0]])) {fm[0] = 1;}
    if (corner[0] < this._div.x && n[1] !== -1 && !hit(corner, cl[n[1]])) {fm[1] = 1;}
    if (corner[1] > 0           && n[2] !== -1 && !hit(corner, cl[n[2]])) {fm[2] = 1;}
    if (corner[1] < this._div.y && n[3] !== -1 && !hit(corner, cl[n[3]])) {fm[3] = 1;}
    if (corner[2] > 0           && n[4] !== -1 && !hit(corner, cl[n[4]])) {fm[4] = 1;}
    if (corner[2] < this._div.z && n[5] !== -1 && !hit(corner, cl[n[5]])) {fm[5] = 1;}

    freeMoveList.push(fm);
  }, this);

  add(0, -1,  0,  0);
  add(1,  1,  0,  0);
  add(2,  0, -1,  0);
  add(3,  0,  1,  0);
  add(4,  0,  0, -1);
  add(5,  0,  0,  1);

  return ret;

  function hit(aCorner, bCorner) {

    return aCorner[0] === bCorner[0] &&
      aCorner[1] === bCorner[1] &&
      aCorner[2] === bCorner[2];
  }

  function add(wid, x, y, z) {

    for (var i = 0; i < freeMoveList.length; ++i) {
      if(freeMoveList[i][wid] !== 1) {
        return;
      }
    }

    ret.push([x, y, z]);
  }
};

p.getCornerList = function () {

  return this._cornerList.slice().map(function (corner) {return corner.slice();});
};

p.destroy = function () {

}

module.exports = EdiBox;










// function createDebugPixel() {

//   var de = document.createElement('div');
//   de.style.position = 'absolute';
//   de.style.width = '3px';
//   de.style.height = '3px';
//   de.style.backgroundColor = 'red';
//   de.style.visibility = 'hidden';

//   return de;
// }

function createCornerHandlerCircle() {

  var size = 18, half = size/2;

  var cont = document.createElement('div');
  cont.style.position = 'absolute';
  var circ = document.createElement('div');
  cont.appendChild(circ);
  circ.style.position = 'absolute';
  circ.style.left = (-half) + 'px';
  circ.style.top = (-half) + 'px';
  circ.style.width = size + 'px';
  circ.style.height = size + 'px';
  circ.style.borderRadius = half + 'px';
  circ.style.backgroundColor = 'red';
  circ.style.cursor = 'pointer';

  return cont;
}

function createEdgeHandlerLine() {

  var size = 4, half = size/2;

  var cont = document.createElement('div');
  cont.style.position = 'absolute';
  cont.style.width = '0px';
  cont.style.height = '0px';
  cont.style.backgroundColor = 'green';
  var line = document.createElement('div');
  cont.appendChild(line);
  line.style.position = 'absolute';
  line.style.top = (-half) + 'px';
  line.style.width = '100px';
  line.style.height = size + 'px';
  line.style.backgroundColor = 'red';
  line.style.cursor = 'pointer';

  return cont;
}
