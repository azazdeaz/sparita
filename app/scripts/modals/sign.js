'use strict';

var template = require('../../templates/modals/sign.html'),
    domready = require('domready'),
	back = require('../back'),
    inited = false;

var sign = {

	$root: $(template),

	open: function (opt) {

        opt = opt || {};

        this.init();
        this.$root.foundation().foundation('reveal', 'open');

        this.selectTab(opt.tab || 'register');
    },

    init: function () {

        if (inited) {
            return;
        }
        inited = true;

        var that = this;

        $('body').append(sign.$root);

        this.$root.find('.content.register .send').click(function () {

            var $cont = that.$root.find('.content.register'),
                email = $cont.find('input.email').val(),
                username = $cont.find('input.username').val(),
                password = $cont.find('input.password').val();

            back.register(username, password, email)
                .done(function () {
                    that.$root.foundation().foundation('reveal', 'close');
                })
                .fail(function () {

                });
        });

        this.$root.find('.content.login .send').click(function () {

            var $cont = that.$root.find('.content.login'),
                username = $cont.find('input.username').val(),
                password = $cont.find('input.password').val();

            back.login(username, password)
                .done(function () {
                    that.$root.foundation().foundation('reveal', 'close');
                })
                .fail(function () {

                });
        });
    }
};

domready(sign.init.bind(sign));


module.exports = sign;
