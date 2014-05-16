/**
 * scripts/main.js
 *
 * This is the starting point for your application.
 * Take a look at http://browserify.org/ for more info
 */

'use strict';

var pager = require('./pager.js'),
	$ = require('jquery');
	// foundation = require('foundation');

pager.open('menu');

$('nav #menu').click(pager.open.bind(null, 'menu'));

// $(document).foundation();