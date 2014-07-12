'use strict';

var template = require('../../templates/modals/modelSettings.html'),
    domready = require('domready'),
    inited = false;

var modal = {

    $root: $(template),

    open: function () {

        this.init();
        this.$root.foundation().foundation('reveal', 'open');

        return this;
    },

    init: function () {

        if (inited) {
            return;
        }
        inited = true;

        $('body').append(modal.$root);
    },

    setName: function (val) {

        return this.val('name', val);
    },

    getName: function (val) {

        return this.val('name');
    },

    val: function (name, val) {

        return this.$root.find('.inp-' + name).val(val);
    }
};

domready(modal.init.bind(modal));


module.exports = modal;
