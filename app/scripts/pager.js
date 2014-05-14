'use strict';

var $ = require('jquery'),
	pages = {
		'menu': require('./menu.js'),
		'levels': require('./levels.js')
	};
	

module.exports = {

	open: function (pageId) {

		$('#page-cont').append(pages[pageId].$root);
	}
}