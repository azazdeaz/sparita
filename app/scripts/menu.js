'use strict';


var pager = require('./pager'),
	template = require('../templates/menu.html');

var menu = {
	$root: $(template)
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
