'use strict';

var template = require('../templates/challenge.html')
    pager = require('./pager');


var page = {
    $root: $(template),

    setup: function () {

        var $list = this.$root.find('.challenge-list').empty();

        back.getModelList().done(function (modelList) {

            modelList.forEach(function (modelData) {

                var model = modelDat.src;

                $('<li class="button expand"></li>')
                    .text(model.name)
                    .css({ marginBottom: 0 })
                    .click(function () {
                        pager.open('gamepage', {
                            mode: 'game',
                            initModel: model,
                        })
                    })
                    .appendTo($list);
            });
        });
    }
};

module.exports = page;
