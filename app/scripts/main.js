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

    // pager.open('menu');
    pager.open('gamepage', {"mode":"editor","initModel":{"div":{"x":"2","y":"1","z":"2"},"boxDiv":{"x":"3","y":"3","z":"3"},"blueprintSides": ["front"], "name":"model-x"}});
    $('body').css('opacity', 0);


    back.testSession();
});
