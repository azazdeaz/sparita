/**
 * scripts/main.js
 *
 * This is the starting point for your application.
 * Take a look at http://browserify.org/ for more info
 */

'use strict';

var pager = require('./pager.js'),
    domReady = require('domready'),
    back = require('./back'),
    navbar = require('./navbar');

domReady(function () {

    $('body').prepend(navbar.$root);
    $(document).foundation();

    pager.open('menu');

    back.testSession();
});
