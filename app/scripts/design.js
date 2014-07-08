// 'use strict';

var prevCube = require('./prevCube'),
    pager = require('./pager'),
	template = require('../templates/design.html');

var modelOpt,


var design = {
	$root: $(template)
};

function init() {

    design.$root.find('.preview').append(prevCube.domElement);

    design.$root.find('input').change(function () {

        modelOpt = {
            mode: 'editor',
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

        prevCube.refres(modelOpt);
    });

    design.$root.find('.button.start').click(function () {

        pager.open('gamepage', modelOpt);
    });
}

init();

module.exports = design;
