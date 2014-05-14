'use strict';

var fs = require('fs'),
	$ = require('jquery'),
	pager = require('./pager.js');

var menu = {
	$root: $(fs.readFileSync('app/templates/menu.html', 'utf8'))
}
console.log("menu.$root.find('btn-levels')", menu.$root.find('btn-levels'))
menu.$root.find('#btn-levels').click(function () {pager.open('levels')});

module.exports = menu;
