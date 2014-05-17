'use strict';

var $ = require('jquery'),
	$pageCont = $('#page-cont'),
	pages = {
		'menu': function () { return require('./menu.js'); },
		'levels': function () { return require('./levels.js'); },
		'challenge': function () { return require('./challenge.js'); }
	};

	

module.exports = {

	open: function (pageId) {

		$pageCont.children().hide();
		$pageCont.append( pages[pageId]().$root.show() );
		$(document).foundation();
	}
};

// for (var i in pages) {


// }