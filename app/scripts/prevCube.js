'use strict';


var lastRender, uSize = 12,
    opt = _.extend({
        div: {x: 2, y: 3, z: 4},
        boxDiv: {x: 3, y: 3, z: 3}
    }, opt);

// set the scene size
var WIDTH = 400,
    HEIGHT = 300;

// set some camera attributes
var VIEW_ANGLE = 45,
    ASPECT = WIDTH / HEIGHT,
    NEAR = 0.1,
    FAR = 10000;


var scene = new THREE.Scene();

var renderer = new THREE.WebGLRenderer({alpha: true});
renderer.setSize(WIDTH, HEIGHT);

var camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
camera.position.z = 300;
scene.add(camera);

var cube = new THREE.Mesh();
cube.rotation.x = -12;
cube.rotation.y = 23;
scene.add(cube);


function refreshCube() {

    var materials = [], material, texture;

    texture = new THREE.Texture(getTexture(opt.div.x, opt.div.y, opt.boxDiv.z, opt.boxDiv.y));
    texture.needsUpdate = true;
    material = new THREE.MeshBasicMaterial({map: texture});
    materials.push(material, material);

    texture = new THREE.Texture(getTexture(opt.div.x, opt.div.z, opt.boxDiv.x, opt.boxDiv.z));
    texture.needsUpdate = true;
    material = new THREE.MeshBasicMaterial({map: texture});
    materials.push(material, material);

    texture = new THREE.Texture(getTexture(opt.div.x, opt.div.y, opt.boxDiv.x, opt.boxDiv.y));
    texture.needsUpdate = true;
    material = new THREE.MeshBasicMaterial({map: texture});
    materials.push(material, material);

    cube.material = new THREE.MeshFaceMaterial(materials.concat(materials));

    cube.geometry = new THREE.BoxGeometry(
        uSize * opt.div.x * opt.boxDiv.x,
        uSize * opt.div.y * opt.boxDiv.y,
        uSize * opt.div.z * opt.boxDiv.z);

    cube.needsUpdate = true;
}


renderer.render(scene, camera);

function animSpin () {

    window.requestAnimationFrame(animSpin);

    var now = window.performance.now();

    cube.rotation.y += 0.00067 * (now - lastRender);
    renderer.render(scene, camera);

    lastRender = now;
}

function startSpin() {

    lastRender = window.performance.now();
    window.requestAnimationFrame(animSpin);
}

function stopSpin() {

    window.cancelAnimationFrame(animSpin);
}

startSpin();

module.exports = {

    domElement: renderer.domElement,
    startSpin: startSpin,
    stopSpin: stopSpin,
    refresh: function (_opt) {

        _.extend(_opt);
        refreshCube();
    }
};


function getTexture(cubesX, cubesY, divX, divY) {

    var bitmap = document.createElement('canvas'),
        ctx = bitmap.getContext('2d'), pos;

    bitmap.width = cubesX * divX * uSize;
    bitmap.height = cubesY * divY * uSize;
    ctx.fillStyle =  'eeeded';
    ctx.fillRect(0, 0, bitmap.width, bitmap.height);
    ctx.strokeStyle =  'a0a0a0';

    for (var cx = 0; cx <= cubesX; ++cx) {

        pos = cx * divX * uSize;
        line(pos, 0, pos, bitmap.height, 2);

        for (var dx = 0; cx < cubesX && dx < divX; ++dx) {

            pos = (cx * divX + dx) * uSize;
            line(pos, 0, pos, bitmap.height, 1);
        }
    }

    for (var cy = 0; cy <= cubesY; ++cy) {

        pos = cy * divY * uSize;
        line(0, pos, bitmap.width, pos, 2);

        for (var dy = 0; cy < cubesY && dy < divY; ++dy) {

            pos = (cy * divY + dy) * uSize;
            line(0, pos, bitmap.width, pos, 1);
        }
    }

    // document.body.appendChild(bitmap);
    return bitmap;

    function line(sx, sy, ex, ey, lineWidth) {

        ctx.beginPath();
        ctx.lineWidth = lineWidth;
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
    }
}
