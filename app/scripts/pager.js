'use strict';

var $pageCont = $('#page-cont'),
	pages = {
		'menu': function () { return require('./menu.js'); },
		'levels': function () { return require('./levels.js'); },
		'challenge': function () { return require('./challenge.js'); },
		'design': function () { return require('./design.js'); },
		'gamepage': function () { return require('./gamepage.js'); }
	},
	modals = {
		'sign': function () { return require('./modals/sign.js'); }
	};

module.exports = {

	open: function (pageId, opt) {

		var page = pages[pageId]();

		$pageCont.children().hide();
		$pageCont.append( page.$root.show() );
		if (page.setup) {

			page.setup(opt);
		}
		$(document).foundation();
	},

	openModal: function (name) {

		modals[name]().open();
	}
};