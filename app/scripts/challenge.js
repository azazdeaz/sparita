'use strict';

var fs = require('fs'),
	$ = require('jquery');


var page = {
	$root: $(fs.readFileSync('app/templates/challenge.html', 'utf8'))
};

module.exports = page;