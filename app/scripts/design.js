'use strict';

var fs = require('fs'),
	prevCube = require('./prevCube');


var design = {
	$root: $(fs.readFileSync('app/templates/design.html', 'utf8'))
};

design.$root.prepend(prevCube.domElement);

module.exports = design;