'use strict';

var prevCube = require('./prevCube'),
    pager = require('./pager'),
    back = require('./back'),
	template = require('../templates/design.html');

var modelOpt;


var design = {
	$root: $(template),

    setup: function () {

        back.getModelList().done(function (modelList) {

            var myModels = _.where(modelList, {author: back.username}),
                $list = design.$root.find('.saved-model-list').empty();

            myModels.forEach(function (modelData) {

                $('<li class="button expand"></li>')
                    .text(modelData.model.name)
                    .css({ marginBottom: 0 })
                    .click(function () {
                        modelOpt = modelData.model;
                        prevCube.refres(modelOpt);
                    })
                    .appendTo($list);
            });
        })
    },
    selectTab: function (tab) {

        this.$root.find('[href="#design-tab-'+tab+'"]').click();
    }
};

function init() {

    design.$root.find('.preview').append(prevCube.domElement);

    design.$root.find('input').change(function () {

        modelOpt = {
            model: {
                div: {
                    x: design.$root.find('input.div-x').val(),
                    y: design.$root.find('input.div-y').val(),
                    z: design.$root.find('input.div-z').val()
                },
                boxDiv: {
                    x: design.$root.find('input.box-div-x').val(),
                    y: design.$root.find('input.box-div-y').val(),
                    z: design.$root.find('input.box-div-z').val()
                },
                name: design.$root.find('input.name').val(),
                description: design.$root.find('input.description').val()
            }
        }

        prevCube.refresh(modelOpt);
    });

    design.$root.find('._start').click(function () {

        pager.open('gamepage', {mode: 'editor', initModel: modelOpt});
    });
}

init();

module.exports = design;
