/**
 * scripts/main.js
 *
 * This is the starting point for your application.
 * Take a look at http://browserify.org/ for more info
 */

'use strict';

var pager = require('./pager.js'),
	domReady = require('domready');

domReady(function () {

    pager.open('menu');

    $('nav #menu').click(pager.open.bind(pager, 'menu'));
    $('nav .register').click(pager.openModal.bind(pager, 'sign'));

    $(document).foundation();
});
