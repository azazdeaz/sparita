'use strict';

var fs = require('fs'),
	$ = require('jquery'),
	pager = require('./pager.js');
	
var levels = {
	$root: $(fs.readFileSync('app/templates/levels.html', 'utf8'))
}

module.exports = levels;