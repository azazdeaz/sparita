'use strict';

var Editor = require('./editor/Editor'),
	template = require('../templates/gamepage.html'),
    ;

var gamepage = {
	$root: $(template),

    setup: function (opt) {

        opt = _.extend({
            div: {x: 2, y: 3, z: 4}, 
            boxDiv: {x: 3, y: 3, z: 3}
        }, opt);

        gamepage.editor = new Editor({div: opt.div, boxDiv: opt.boxDiv});
        gamepage.editor.setSize(window.innerWidth, window.innerHeight);
        gamepage.$root.append(gamepage.editor.domElement);
    },


};


module.exports = gamepage;
