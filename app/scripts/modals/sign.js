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

        this.$root.find('#sign-tab-register ._send').click(function () {

            var $cont = that.$root.find('#sign-tab-register'),
                email = $cont.find('._email').val(),
                username = $cont.find('._username').val(),
                password = $cont.find('._password').val();

            back.register(username, password, email)
                .done(function () {
                    that.$root.foundation().foundation('reveal', 'close');
                    that.clearFields();
                })
                .fail(function () {

                });
        });

        this.$root.find('#sign-tab-login ._send').click(function () {

            var $cont = that.$root.find('#sign-tab-login'),
                username = $cont.find('._username').val(),
                password = $cont.find('._password').val();

            back.login(username, password)
                .done(function () {
                    that.$root.foundation().foundation('reveal', 'close');
                    that.clearFields();
                })
                .fail(function () {

                });
        });
    },
    selectTab: function (tab) {

        this.$root.find('[href="#sign-tab-'+tab+'"]').click();
    },

    clearFields: function () {

        this.$root.find('input').val('')
    }
};

domready(sign.init.bind(sign));


module.exports = sign;
