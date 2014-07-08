'use strict';

var Editor = require('./editor/Editor'),
	template = require('../templates/gamepage.html'),
    ;

var gamepage = {
	$root: $(template),
    $navbarAddon = $('')

    setup: function (opt) {

        opt = _.extend(
            model: {
                div: {x: 2, y: 3, z: 4},
                boxDiv: {x: 3, y: 3, z: 3}
            }
        }, opt);

        gamepage.editor = new Editor(opt.model);
        gamepage.editor.setSize(window.innerWidth, window.innerHeight);
        gamepage.$root.append(gamepage.editor.domElement);

        this.$root.find('.param-settings')[opt.mode === editor ? 'show' : 'hide']();

        if (opt.model.blueprints)
    },
};


module.exports = gamepage;
