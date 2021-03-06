'use strict';

var template = require('../../templates/modals/modelSettings.html'),
    domready = require('domready'),
    EventEmitter = require('events').EventEmitter,
    inited = false;

var modal =  new EventEmitter();

_.assign(modal, {

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

        this.$root.find('.bp-side').change(function () {

            modal.emit('change-blueprint-sides', modal.getBlueprintSides());
        });
    },

    setName: function (val) {

        return this.val('name', val);
    },

    getName: function (val) {

        return this.val('name');
    },

    val: function (name, val) {

        return this.$root.find('.inp-' + name).val(val);
    },

    getBlueprintSides: function () {

        var ret = [];

        this.$root.find('.bp-side').each(function () {

            if (this.checked) {

                ret.push(this.getAttribute('data-side'));
            }
        });

        return ret;
    },

    setBlueprintSides: function (sides) {

        this.$root.find('.bp-side').each(function () {

            if (sides.indexOf(this.getAttribute('data-side')) !== -1) {

                this.checked = true;
            }
        });
    }
});

domready(modal.init.bind(modal));


module.exports = modal;
