'use strict';

function EdiBox(div, size, renderer, camera) {

	this.mesh =  new THREE.Mesh(
		new THREE.BoxGeometry(size[0], size[1], size[2]),
		new THREE.MeshLambertMaterial({ color: 0x0000FF }));

	function calc2Dpoint(x,y,z) {

	    var projector = new THREE.Projector();

	    var vector = projector.projectVector( new THREE.Vector3( x, y, z ), camera );

	    var result = {
	      x: Math.round(vector.x * (renderer.domElement.width/2));
	      y: Math.round(vector.y * (renderer.domElement.height/2));
      };

	    return result;

	}
}

module.exports = EdiBox;
