'use strict';

var Editor = require('./editor/Editor'),
    blueprint = require('./editor/blueprint'),
    pager = require('./pager'),
    back = require('./back'),
    navbar = require('./navbar'),
    modelSettings = require('./modals/modelSettings'),
    template = require('../templates/gamepage.html');

var gamepage = {

    $root: $(template),
    $navbarAddon: $(
        '<li><a class="_btn-undo">undo</a></li>' +
        '<li><a class="_btn-redo">redo</a></li>' +
        '<li><a class="_btn-reset">reset</a></li>'
    ),

    setup: function (_opt) {
// console.log(JSON.stringify(_opt));//debug
        var opt = gamepage._setupOpt = _.merge({}, {
            mode: 'editor',
            initModel: {
                name: 'Unnamed model',
                div: {x: 2, y: 3, z: 4},
                boxDiv: {x: 3, y: 3, z: 3},
                blueprintSides: []
            }
        }, _opt);

        navbar.setDynamicContent(gamepage.$navbarAddon);

        gamepage.editor = new Editor(opt.initModel);
        gamepage.editor.setSize(window.innerWidth, window.innerHeight);
        gamepage.$root.append(gamepage.editor.domElement);

        if (opt.mode === 'editor') {

            gamepage.editor.on('change', refreshBlueprints);
            gamepage.editor.showGeometry(opt.initModel.geometry);

            modelSettings.setName(opt.initModel.name);
            modelSettings.setBlueprintSides(opt.initModel.blueprintSides);
        }

        refreshBlueprints();

        this.$root.find('._btn-settings ._btn-save')[opt.mode === 'editor' ? 'show' : 'hide']();
        this.$root.find('._btn-finish')[opt.mode === 'game' ? 'show' : 'hide']();
    },

    close: function () {

        navbar.setDynamicContent('');

        if (gamepage.editor) {

            $(gamepage.editor.domElement).remove();
        }
    }
};

function init () {

    gamepage.$root.find('._btn-test').click(testSolusion);

    gamepage.$root.find('._btn-settings').click(function () {

        pager.openModal('modelSettings');
    });

    gamepage.$root.find('._btn-save').click(function () {

        back.saveModel(gamepage.editor.getModel());
    });

    modelSettings.on('change-blueprint-sides', function (sides) {

        gamepage.editor.getOriginModel().blueprintSides = sides;

        refreshBlueprints();
    });

    gamepage.$navbarAddon.find('._btn-undo').click(function () {gamepage.editor.undo();});
    gamepage.$navbarAddon.find('._btn-redo').click(function () {gamepage.editor.redo();});
    gamepage.$navbarAddon.find('._btn-reset').click(function () {gamepage.editor.reset();});
}

function testSolusion() {

    var model = gamepage.editor.getModel(gamepage._setupOpt);

    if (blueprint.testSolusion(model, gamepage.setupOpt.targetModel)) {

        handleWin();
    }
}

function saveModel() {

    var model = gamepage.editor.getModel();
    back.saveModel(model);
}

function handleWin() {

    pager.openModal('win');
}

function refreshBlueprints() {

    var model = gamepage.editor.getModel(), prints = [], fullH,
        $blueprintCont = gamepage.$root.find('._blueprint-cont').empty();

    model.blueprintSides.forEach(function (sideName) {

        prints.push(blueprint.print({
            model: model,
            side: sideName,
            name: sideName.charAt(0).toUpperCase() + sideName.substr(1)
        }));
    });

    fullH = prints.reduce(function (a, b) {return a + b.height;}, 0);

    prints.forEach(function (print) {

        print.style.right = '0';
        print.style.height = ((print.height / fullH) * 100) + '%';
        print.style.width = 'auto';
        $blueprintCont.append(print);
    });
}


init();
module.exports = gamepage;
