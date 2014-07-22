'use strict';

var template = require('../templates/navbar.html'),
    pager = require('./pager'),
    back = require('./back');

var navbar = {
    $root: $(template)
}

navbar.$root.find('._brand').click(pager.open.bind(pager, 'menu'));
navbar.$root.find('._register').click(pager.openModal.bind(pager, 'sign', {tab: 'register'}));
navbar.$root.find('._login').click(pager.openModal.bind(pager, 'sign', {tab: 'login'}));
navbar.$root.find('._logout').click(back.logout.bind(back));

back.on('login', function () {

    navbar.$root.find('._sign').hide();
    navbar.$root.find('._user').show();
    navbar.$root.find('._username').text(back.username);
});

back.on('logout', function () {

    navbar.$root.find('._sign').show();
    navbar.$root.find('._user').hide();
    navbar.$root.find('._username').text('');
});

module.exports = navbar;
