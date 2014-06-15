'use strict';

var fs = require('fs'),
	Editor = require('./editor/Editor');

var gamepage = {
	$root: $(fs.readFileSync('app/templates/gamepage.html', 'utf8'))
};

gamepage.editor = new Editor({div: [2, 3, 4], boxDiv: [3, 3, 3]});
gamepage.editor.setSize(window.innerWidth, window.innerHeight);
gamepage.$root.append(gamepage.editor.domElement);

module.exports = gamepage;
