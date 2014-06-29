'use strict';

var fs = require('fs'),
	Editor = require('./editor/Editor');

var gamepage = {
	$root: $(fs.readFileSync('app/templates/gamepage.html', 'utf8'))
};

gamepage.editor = new Editor({div: {x: 2, y: 3, z: 4}, boxDiv: {x: 3, y: 3, z: 3}});
gamepage.editor.setSize(window.innerWidth, window.innerHeight);
gamepage.$root.append(gamepage.editor.domElement);

module.exports = gamepage;
