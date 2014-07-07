'use strict';

var template = require('../templates/navbar.html'),
    pager = require('./pager'),
    back = require('./back');

var navbar = {
    $root = $(template);
}

navbar.$root.find('.brand').click(pager.open.bind(pager, 'menu'));
navbar.$root.find('.register').click(pager.openModal.bind(pager, 'sign'));

back.on('login', function () {

    navbar.$root.find('.register, .login').hide();
    navbar.$root.find('.username').show().text(back.username);
    navbar.$root.find('.logout').show();
});

back.on('logout', function () {

    navbar.$root.find('.register, .login').show();
    navbar.$root.find('.username').hide().text('');
    navbar.$root.find('.logout').hide();
});

module.exports = navbar;
