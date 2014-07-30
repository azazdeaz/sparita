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
menu.$root.find('#btn-debug').click(function () {
    pager.open('gamepage', {"mode":"editor","initModel":{"div":{"x":"2","y":"1","z":"2"},"boxDiv":{"x":"3","y":"3","z":"3"},"blueprintSides": ["front"], "name":"model-x"}});
});

module.exports = menu;
