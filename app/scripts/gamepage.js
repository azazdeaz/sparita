'use strict';

var Editor = require('./editor/Editor'),
    blueprint = require('./editor/blueprint'),
    pager = require('./pager'),
    modelSettings = require('./modals/modelSettings'),
	template = require('../templates/gamepage.html');

var gamepage = {

	$root: $(template),
    $navbarAddon: $(''),

    setup: function (_opt) {

        var opt = gamepage._setupOpt = _.extend({
            initModel: {
                div: {x: 2, y: 3, z: 4},
                boxDiv: {x: 3, y: 3, z: 3}
            }
        }, _opt);

        modelSettings.setName('Vafasfasadf');

        gamepage.editor = new Editor(opt.initModel);
        gamepage.editor.setSize(window.innerWidth, window.innerHeight);
        gamepage.$root.append(gamepage.editor.domElement);

        this.$root.find('.param-settings')[opt.mode === 'editor' ? 'show' : 'hide']();
    },
};

gamepage.$root.find('.btn-test').click(testSolusion);
gamepage.$root.find('.btn-settings').click(function () {

    pager.openModal('modelSettings');
});

function testSolusion() {

    var model = gamepage.editor.getModel(gamepage._setupOpt);

    if (blueprint.testSolusion(model, gamepage.setupOpt.targetModel)) {

        handleWin();
    }

}

function handleWin() {

    pager.openModal('win');
}


module.exports = gamepage;
