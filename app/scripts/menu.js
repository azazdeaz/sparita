'use strict';

var fs = require('fs'),
	$ = require('jquery'),
	pager = require('./pager');

var menu = {
	$root: $(fs.readFileSync('app/templates/menu.html', 'utf8'))
};

menu.$root.find('#btn-levels').click(function () {
	pager.open('levels');
});

menu.$root.find('#btn-challenge').click(function () {
	pager.open('challenge');
});

menu.$root.find('#btn-design').click(function () {
	pager.open('design');
});

module.exports = menu;
