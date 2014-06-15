'use strict';

function EdiBox(div, size) {

	this.mesh =  new THREE.Mesh(
		new THREE.BoxGeometry(size[0], size[1], size[2]),
		new THREE.MeshBasicMaterial({ color: 0x0000FF }));
}

module.exports = EdiBox;
