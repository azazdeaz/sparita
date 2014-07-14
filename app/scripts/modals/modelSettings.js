'use strict';

var template = require('../../templates/modals/modelSettings.html'),
    domready = require('domready'),
    EventEmitter = require('events').EventEmitter,
    inited = false;

var modal =  new EventEmitter();

_.extened(modal, {

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

            this.emit('change-blueprint-sides', this.getBlueprintSides());
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

        var ret;

        this.$root.find('.bp-side').each(function () {

            if (this.checked) {

                ret.push(this.getAttribure('data-side'));
            }
        });

        return ret;
    },

    setBlueprintSides: function (sides) {

        this.$root.find('.bp-side').each(function () {

            if (sides.indexOf(this.getAttribure('data-side')) !== -1) {

                this.checked = true;
            }
        });
    }
});

domready(modal.init.bind(modal));


module.exports = modal;
