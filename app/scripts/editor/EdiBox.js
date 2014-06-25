'use strict';

function EdiBox(opt) {

  this._div = opt.div;
  this._size = opt.size;
  this.renderer = opt.renderer;
  this.camera = opt.camera;
  this.recordHistory = opt.recordHistory;

  this._cornerList = [
    [0, 0, 0],
    [1, 0, 0],
    [1, 0, 1],
    [0, 0, 1],
    [0, 1, 0],
    [1, 1, 0],
    [1, 1, 1],
    [0, 1, 1]
  ].map(function (vertex) {

    vertex[0] *= this._div[0];
    vertex[1] *= this._div[1];
    vertex[2] *= this._div[2];

    return vertex;
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

  this.mesh = new THREE.Mesh(
    new THREE.BoxGeometry(this._size[0], this._size[1], this._size[2]),
    new THREE.MeshLambertMaterial({
      color: 0x0000FF
    })
  );

  this.mesh.geometry.dynamic = true;

  this.handlers = [
    this.createCornerHandler(this._cornerList[0]),
    this.createCornerHandler(this._cornerList[1]),
    this.createCornerHandler(this._cornerList[2]),
    this.createCornerHandler(this._cornerList[3]),
    this.createCornerHandler(this._cornerList[4]),
    this.createCornerHandler(this._cornerList[5]),
    this.createCornerHandler(this._cornerList[6]),
    this.createCornerHandler(this._cornerList[7])
  ];
}

var p = EdiBox.prototype;

p.showHandlers = function() {

  this.handlers.forEach(function(handler) {

    handler.show();
  });
};

p._fitHandlers = function () {

  this.handlers.forEach(function (handler) {

    handler.fit();
  });
};

p.createCornerHandler = function(corner) {

  var that = this;

  var de = createCornerHandlerCircle();
  de.onmousedown = function (e) {
    that.selectHandler(handler, e.pageY, e.pageX);
  };

  var handler = {
    domElement: de,
    corners: [corner]
  };

  handler.show = function() {

    handler.fit();
    de.style.visibility = 'visible';
    that.renderer.domElement.parentNode.appendChild(de);
  };

  handler.fit = function () {

    var pos = that._vertexTo2d(that._cornerToVertex(corner));
    de.style.left = pos.x + 'px';
    de.style.top = pos.y + 'px';
  };

  return handler;
};

p.selectHandler = function (handler, mdx, mdy, onFinish) {

  var that = this, picker, offsetList3d, targetList2d = [], cl = this._cornerList;

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
    document.body.appendChild(deMarker);
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

          picker.corners.forEach(function (corner) {
              that._moveCorner(corner, offsetList3d[targetIdx]);
          });

          that.selectPicker(pickerEntityId, target2d[0], target2d[1], onFinish);
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
    this.opt.saveHistory({
      undo: [this._moveCorner, this, corner, offset.map(function (n) {return -n}), true],
      redo: [this._moveCorner, this, corner, offset, true],
    });
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

  this._fitHandlers();
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

    return {
      x: Math.round((1 + vector2d.x) * (this.renderer.domElement.width / 2)),
      y: Math.round((1 - vector2d.y) * (this.renderer.domElement.height / 2))
    };
  };
}());

p._cornerToVertex = function (corner, vertex) {

  vertex = vertex || new THREE.Vector3();

  vertex.x = (corner[0] * (this._size[0] / this._div[0])) - (this._size[0] / 2);
  vertex.y = (corner[1] * (this._size[1] / this._div[1])) - (this._size[1] / 2);
  vertex.z = (corner[2] * (this._size[2] / this._div[2])) - (this._size[2] / 2);

  return vertex;
};

p._getTargetPositions = function (movingCorners) {

  var ret = [], freeMoveList = [], cl = this._cornerList;

  movingCorners.forEach(function (corner) {

    var cidx = cl.indexOf(corner), n = this._neighbors[cidx], fm = [];

    if (corner[0] > 0            && n[0] !== -1 && !hit(corner, cl[n[0]])) {fm[0] = 1;}
    if (corner[0] < this._div[0] && n[1] !== -1 && !hit(corner, cl[n[1]])) {fm[1] = 1;}
    if (corner[1] > 0            && n[2] !== -1 && !hit(corner, cl[n[2]])) {fm[2] = 1;}
    if (corner[1] < this._div[1] && n[3] !== -1 && !hit(corner, cl[n[3]])) {fm[3] = 1;}
    if (corner[2] > 0            && n[4] !== -1 && !hit(corner, cl[n[4]])) {fm[4] = 1;}
    if (corner[2] < this._div[2] && n[5] !== -1 && !hit(corner, cl[n[5]])) {fm[5] = 1;}

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

module.exports = EdiBox;









function createDebugPixel() {

  var de = document.createElement('div');
  de.style.position = 'absolute';
  de.style.width = '3px';
  de.style.height = '3px';
  de.style.backgroundColor = 'red';
  de.style.visibility = 'hidden';

  return de;
}

function createCornerHandlerCircle() {

  var de = document.createElement('div');
  de.style.position = 'absolute';
  de.style.width = '12px';
  de.style.height = '12px';
  de.style.backgroundRadius = '6px';
  de.style.backgroundColor = 'red';
  de.style.visibility = 'hidden';
  de.style.cursor = 'pointer';

  return de;
}
