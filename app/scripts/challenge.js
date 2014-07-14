'use strict';

var template = require('../templates/challenge.html')
    pager = require('./pager');


var page = {
    $root: $(template),

    setup: function () {

        var $list = this.$root.find('.challenge-list').empty();

        back.getModelList().done(function (modelList) {

            modelList.forEach(function (modelData) {

                $('<li class="button expand"></li>')
                    .text(modelData.model.name)
                    .css({ marginBottom: 0 })
                    .click(function () {
                        pager.open('gamepage', {
                            mode: 'play',
                            initModel: modelData.model,
                        })
                    })
                    .appendTo($list);
            });
        });
    }
};

module.exports = page;
