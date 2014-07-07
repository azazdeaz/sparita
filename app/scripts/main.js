/**
 * scripts/main.js
 *
 * This is the starting point for your application.
 * Take a look at http://browserify.org/ for more info
 */

'use strict';

var pager = require('./pager.js'),
    domReady = require('domready'),
	navbar = require('navbar');

domReady(function () {

    $(document)
        .prepend(navbar.$root)
        .foundation();

    pager.open('menu');
});
