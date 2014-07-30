'use strict';

var $pageCont = $('#page-cont'),
    currPage,
	pages = {
		'menu': function () { return require('./menu.js'); },
		'levels': function () { return require('./levels.js'); },
		'challenge': function () { return require('./challenge.js'); },
		'design': function () { return require('./design.js'); },
		'gamepage': function () { return require('./gamepage.js'); }
	},
	modals = {
        'sign': function () { return require('./modals/sign.js'); },
		'modelSettings': function () { return require('./modals/modelSettings.js'); }
	};

module.exports = {

	open: function (pageId, opt) {

        if (currPage) {

            if (currPage.close) {

                currPage.close();
            }
        }

		var page = currPage = pages[pageId]();

		$pageCont.children().hide();
		$pageCont.append( page.$root.show() );
		if (page.setup) {

			page.setup(opt);
		}
		$(document).foundation();
	},

	openModal: function (name, opt) {

	   return modals[name]().open(opt);
	}
};
