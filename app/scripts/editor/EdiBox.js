'use strict';

function EdiBox(div, size, renderer, camera) {

	this.renderer = renderer;
	this.camera = camera;

	this.mesh =  new THREE.Mesh(
		new THREE.BoxGeometry(size[0], size[1], size[2]),
		new THREE.MeshLambertMaterial({ color: 0x0000FF })
	);

	// console.log(this.mesh);

	this.handlers = [
		this.createCornerHandler(this.mesh.geometry.vertices[0])
	];
}

var p = EdiBox.prototype;

p.showHandlers = function () {

	this.handlers.forEach(function (handler) {

		handler.show();
	});
};

p.createCornerHandler = function (vertex) {

	var that = this;

	var de = document.createElement('div');
	de.style.position = 'absolute';
	de.style.width = '3px';
	de.style.height = '3px';
	de.style.backgroundColor = 'red';
	de.style.visibility = 'hidden';
	
	var handler = {domElement: de};
	
	handler.setPos = function (x, y) {
		
		
	};

	handler.show = function () {
		
		var pos = that._vertexTo2d(vertex);
		de.style.left = pos.x + 'px';
		de.style.top = pos.y + 'px';
		de.style.visibility = 'visible';
		that.renderer.domElement.parentNode.appendChild(de);
	};

	return handler;
};

p._vertexTo2d = (function () {

	var vector = new THREE.Vector3(),
		projector = new THREE.Projector();

	return function (vertex) {

		vector.setFromMatrixPosition(this.mesh.matrixWorld);
		vector.x += vertex.x;
		vector.y += vertex.y;
		vector.z += vertex.z;

	    var vector2d = projector.projectVector( vector, this.camera );

	    return {
	      x: Math.round((1+vector2d.x) * (this.renderer.domElement.width/2)),
	      y: Math.round((1-vector2d.y) * (this.renderer.domElement.height/2))
	  	};
	}
}());

module.exports = EdiBox;
