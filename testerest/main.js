require.config({
    paths: {
        underscore: 'vendor/underscore'
    },
    shim: {
        "underscore": {
            exports: "_"
        }
    }
});

require([
    'Editor',
    'LevelList',
    'goo/entities/EntityUtils',
    'goo/entities/GooRunner',
    'goo/renderer/Camera',
    'goo/renderer/Material',
    'goo/renderer/TextureCreator',
    'goo/renderer/light/PointLight',
    'goo/renderer/shaders/ShaderLib',
    'goo/scripts/OrbitCamControlScript',
    'goo/shapes/ShapeCreator'
], function (
    Editor,
    LevelList,
    EntityUtils,
    GooRunner,
    Camera,
    Material,
    TextureCreator,
    PointLight,
    ShaderLib,
    OrbitCamControlScript,
    ShapeCreator
) {
    "use strict";

    var aPage, aEditor, wireList = [], inGame = false;

    var goo = new GooRunner({alpha: true, stencil: true});
    document.body.appendChild(goo.renderer.domElement);
    $(goo.renderer.domElement).attr('id', 'goo-canvas')
    // goo.renderer.setSize(800, 450);
    goo.renderer.setClearColor(0, 0, 0);

    var light = new PointLight();
    light.color.set(1,1,0);
    var lightEntity = EntityUtils.createTypicalEntity( goo.world, light);
    lightEntity.addToWorld();

    var camera = new Camera(45, 1, 0.1, 1000);
    var cameraEntity =  EntityUtils.createTypicalEntity(goo.world, camera, [0,0,5]);
    cameraEntity.addToWorld();

    var pageMenu = createMenuPage();
    var pageGame = createGamePage();
    var pageLevels = createLevelsPage();

    CSSPlugin.defaultTransformPerspective = 1200;


    // changePage(pageMenu);
    changePage(pageGame, {levelNo: undefined});

    // new Editor({goo:goo, camera:camera});

    window.changeEditor = changeEditor;
    window.goo = goo;
    window.camera = camera;
    window.blueprint = function() {
        setTimeout(function () {
            if (window.removeblueprint) window.removeblueprint();
            var wire = aEditor.calcBlueprint();
            console.log(wire);
            // $('body').empty();
            var cWire = renderWire(wire, 75*wire.divX, 75*wire.divY);
            console.log(cWire);
            $('body').append(cWire.css({position:'absolute', zIndex: 98767}));
            window.removeblueprint = function () {cWire.remove()};
        }, 1);
    };
    window.blueprint()




    function loadLevel(levelNo) {

        var level;

        if (levelNo !== undefined) {
            level = JSON.parse(LevelList[levelNo]);
        }
        else {
            level =  {"editorOpt":{"blockSizeX":1,"blockSizeY":1,"blockSizeZ":1,"blockDivX":3,"blockDivY":3,"blockDivZ":3,"divX":1,"divY":1,"divZ":2},"solusion":[[[[[1,0,0],[3,0,0],[2,0,3],[0,0,3],[1,3,0],[3,3,0],[2,3,3],[0,3,3]]]],[[[[0,0,0],[2,0,0],[3,0,3],[1,0,3],[0,3,0],[2,3,0],[3,3,3],[1,3,3]]]]],
            wireList: [
                {
                    name: 'front',
                    divX: 6,
                    divY: 3,
                    continuous: [
                        [0, 0, 6, 0],
                        [6, 0, 6, 3],
                        [6, 3, 0, 3],
                        [0, 3, 0, 0],
                        [3, 0, 3, 3],
                        [2, 0, 2, 3],
                        [4, 0, 4, 3],
                    ],
                    dashed: [
                        [1, 0, 1, 3],
                        [5, 0, 5, 3],
                    ]
                },
                {
                    name: 'right',
                    divX: 3,
                    divY: 3,
                    continuous: [
                        [0, 0, 3, 0],
                        [3, 0, 3, 3],
                        [3, 3, 0, 3],
                        [0, 3, 0, 0],
                    ],
                    dashed: [
                    ]
                }
            ]};
        }

        level.editorOpt.goo = goo;
        level.editorOpt.camera = camera;

        changeEditor(level.editorOpt, level.solusion);

        wireList.forEach(function (wire) {
            $(wire).remove();
        });
        wireList.length = 0;

        if (level.wireList) {

            level.wireList.forEach(function (wire) {

                var h = Math.min(240, $(window).height()),
                    w = wire.divX/wire.divY * h;

                wireList.push(renderWire(wire, w, h));
            });
        }

        inGame = true;
    }

    function changeEditor(opt, solusion) {

        if (aEditor) {
            aEditor.destroy();
            aEditor.entity.removeFromWorld();
        }

        aEditor = new Editor(opt, solusion);
    }

    function renderWire(wire, w, h) {

        var c = document.createElement('canvas'),
            ctx = c.getContext('2d'),
            m = 8,
            sx = (w - 2*m) / wire.divX,
            sy = (h - 2*m) / wire.divY;

        c.width = w;
        c.height = h;

        // ctx.fillStyle = 'rgba(0, 0, 0, .23)';
        // ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.shadowBlur = m;
        ctx.shadowColor = '#000';
        ctx.translate(m, m);

        wire.continuous.forEach(function (l) {

            ctx.moveTo(k(l[0]*sx), k(l[1]*sy));
            ctx.lineTo(k(l[2]*sx), k(l[3]*sy));
        });

        //debug, delMe
        ctx.stroke();
        ctx.beginPath();
        ctx.lineWidth = 6;

        wire.dashed.forEach(function (l) {

            var dx = (l[2] - l[0]) * sx,
                dy = (l[3] - l[1]) * sy,
                d = Math.abs(Math.sqrt(dx*dx + dy*dy)),
                steps = Math.round(d / 23) * 2 + 1,
                stepX = dx / steps,
                stepY = dy / steps,
                startX = l[0] * sx,
                startY = l[1] * sy;

            for (var i = 0; i <= steps; ++i) {

                if(i % 2 === 0) {
                    ctx.moveTo(startX + stepX * i, startY + stepY * i);
                } else {
                    ctx.lineTo(startX + stepX * i, startY + stepY * i);
                }
            }
        });

        function k(lp) {
            return (~~lp + .5);
        }

        ctx.stroke();

        var $name = $('<div>')
            .css({
                position: 'absolute',
                fontFamily: 'Arvo, serif',
                fontWeight: 700,
                fontSize: '32px',
                color: '#fff',
                textAlign: 'center',
                opacity: 0,
                left: 15,
                top: 12,
                // backgroundColor: 'rgba(0, 0, 0, .43)'
            })
            .text(wire.name)
            .addClass('name');

        var $cont = $('<div>')
            .css({
                position: 'absolute',
                width: w,
                height: h
            })
            .addClass('wire')
            .append(c, $name);

        $cont.width = w;
        $cont.height = h;

        return $cont;
    }

    function createButton (opt) {

        opt.color = opt.color || '#0280C4';//'#a5f';
        opt.rotAxis = opt.rotAxis || 'rotationY';

        var btn = $('<div>')
            .css({
                position: 'absolute',
                top: opt.top,
                left: opt.left,
                width: opt.w,
                height: opt.h,
                fontFamily: 'Arvo, serif',
                fontWeight: 700,
                fontSize: opt.fontSize + 'px',
                color: opt.color,
                textAlign: 'center',
                borderStyle: 'solid',
                borderColor: opt.color,
                borderWidth: 2,
                // backgroundColor: 'rgba(0, 0, 0, .3)',
                cursor: 'pointer',
                visibility: 'hidden'
            })
            .text(opt.caption)
            .appendTo(opt.parent)
            .click(opt.click);

        var optShow = {
            delay: opt.animDelay,
            autoAlpha: 1,
            ease: Sine.easeOut,
            transformOrigin: opt.transformOrigin,
            // z: -123
        }
        optShow[opt.rotAxis] = 0;

        var optHide = {
            delay: opt.animDelay,
            autoAlpha: 0,
            ease: Sine.easeOut,
            transformOrigin: opt.transformOrigin,
            // z: 0
        };
        optHide[opt.rotAxis] = opt.outDeg;

        TweenMax.set(btn, optHide);

        btn.show = function () {

            TweenMax.to(btn, .67, optShow)
        }

        btn.hide = function () {

            TweenMax.to(btn, .67, optHide)
        }

        return btn;
    }

    function changePage(newPage, opt) {

        var oldPage = aPage;
        aPage = newPage;

        if (oldPage) {

            oldPage.close(open)
        }
        else {
            open();
        }

        function open() {

            aPage.open(opt);
        }
    }







    function createMenuPage () {

        var page = {}, inited = false, btnPlay, btnResume, title;

        function init() {

            btnPlay = createButton({
                caption: 'Play',
                w: 234,
                h: 76,
                top: 10,
                left: 20,
                fontSize: 67,
                parent: 'body',
                rotAxis: 'rotationY',
                transformOrigin: '0px 0px',
                outDeg: 90,
                click: function () {
                    changePage(pageLevels)
                }
            });

            btnResume = createButton({
                caption: 'Resume',
                w: 294,
                h: 76,
                top: 10,
                left: 20,
                fontSize: 67,
                parent: 'body',
                rotAxis: 'rotationY',
                transformOrigin: '0px 0px',
                outDeg: 90,
                click: function () {
                    changePage(pageGame, {resume: true})
                }
            });

            title = $('<div>')
                .html('Sparita <small>- alpha</small>')
                .css({
                    position: 'absolute',
                    fontFamily: 'Arvo, serif',
                    fontWeight: 700,
                    fontSize: '52px',
                    color: '#a7f',
                    // textAlign: 'center',
                    width: 400,
                    left: 23,
                    top: 12,
                    opacity: 0,
                    visibility: 'hidden'
                })
                .appendTo('body');

            resize();
            $(window).resize(resize);

            inited = true;
        }

        page.open = function (opt) {

            if (!inited) {
                init();
            }

            resize();

            btnPlay.show();
            TweenMax.to(title, .7, {autoAlpha: 1, ease:Sine.easeOut});

            if (inGame) {
                btnResume.show();
            }
        }

        page.close = function (onComplete) {

            btnPlay.hide();
            btnResume.hide();
            TweenMax.to(title, .7, {autoAlpha: 0, ease:Sine.easeOut});

            onComplete();
        }

        function resize() {

            btnPlay.css({
                left: ($(window).width() - btnPlay.width()) / 2,
                top: ($(window).height() - btnPlay.height()) / 2
            });

            if(inGame) {

                btnResume.css({
                    left: ($(window).width() - btnPlay.width()) / 2,
                    top: ($(window).height() - btnPlay.height()) / 2
                });
                var delMe = btnResume.css('top');
                btnPlay.css('top', parseInt(btnResume.css('top')) + 89);
            }
        }

        return page;
    }




    function createLevelsPage () {

        var page = {}, inited = false, btnW = 62, btnH = 54, m = 12, divX = 4, divY = 4,
            btnList = [], btnBack;

        var $root = $('<div>')
            .css({
                position: 'absolute'
            })
            .appendTo('body');

        btnBack = createButton({
            caption: 'back to menu',
            w: 234,
            h: 32,
            top: 10,
            left: 20,
            fontSize: 28,
            parent: 'body',
            click: function () {
                changePage(pageMenu);
            }
        });

        function init() {

            for (var i = 0; i < LevelList.length; ++i) {

                var btn = createButton({
                    caption: LevelList[i] ? (i+1) : 'X',
                    w: btnW + 4 * Math.random(),
                    h: btnH + 4 * Math.random(),
                    left: (i % divX) * (btnW + m) + 4 * Math.random(),
                    top: ~~(i/divX) * (btnH + m) + 4 * Math.random(),
                    fontSize: 44 + 8 * Math.random(),
                    parent: $root,
                    rotAxis: 'rotationY',
                    transformOrigin: '0px 0px',
                    outDeg: 90,
                    animDelay: ((i % divX) + (i/divX)) * .06,
                    click: function (i) {
                        changePage(pageGame, {levelNo: (LevelList[i] ? i : undefined)});
                        inGame = true;
                    }.bind(null, i)
                });

                btnList.push(btn);
            }

            resize();
            $(window).resize(resize);

            inited = true;
        }

        page.open = function (opt) {

            if (!inited) {
                init();
            }

            btnBack.show();

            btnList.forEach(function (btn, idx) {
                if (LevelList.isSolved(idx)) {
                    btn.text('X');
                }
                btn.show();
            });
        }

        page.close = function (onComplete) {

            btnList.forEach(function (btn) {
                btn.hide();
            });

            btnBack.hide();

            onComplete();
        }

        function resize() {

            $root.css({
                left: ($(window).width() - (btnW*divX + m*(divX-1))) / 2,
                top: ($(window).height() - (btnH*divY + m*(divY-1))) / 2
            });

            btnBack.css({
                top: $(window).height() - 53
            });
        }

        return page;
    }






    function createGamePage () {

        var page = {}, inited = false, btnVerify, btnBack, wireHit, btnSuccess, btnMistake,
            btnMCSetT, openOpt, btnUndo, btnRedo, btnReset, btnMaterial,
            tweenOptWireActive = { rotationY: 0, autoAlpha: 1, ease: Sine.easeOut },
            tweenOptWireInactive = { rotationY: -56, autoAlpha:.7, ease: Sine.easeOut },
            tweenOptWireClose = { rotationY: -90, autoAlpha: 1, ease: Sine.easeOut };

        function init() {

            btnVerify = createButton({
                caption: 'Verify',
                w: 234,
                h: 76,
                top: 10,
                left: 20,
                fontSize: 67,
                parent: 'body',
                click: function () {
                    if (aEditor.testSolusion()) {
                        btnSuccess.show();
                        btnMistake.hide();
                        LevelList.setSolved(openOpt.levelNo)
                    }
                    else {
                        clearInterval(btnMCSetT);
                        btnSuccess.hide();
                        btnMistake.show();
                        btnMCSetT = setTimeout(function () {
                            btnMistake.hide();
                        }, 800);
                    };
                }
            });

            btnUndo = createButton({
                caption: '<',
                w: 23,
                h: 23,
                top: 100,
                left: 20,
                fontSize: 20,
                parent: 'body',
                click: function () {
                    aEditor.undo();
                }
            });

            btnRedo = createButton({
                caption: '>',
                w: 23,
                h: 23,
                top: 100,
                left: 45,
                fontSize: 20,
                parent: 'body',
                click: function () {
                    aEditor.redo();
                }
            });

            btnReset = createButton({
                caption: 'reset',
                w: 93,
                h: 23,
                top: 100,
                left: 70,
                fontSize: 20,
                parent: 'body',
                click: function () {
                    while(aEditor.undo()){};
                    btnSuccess.hide();
                }
            });

            btnMaterial = createButton({
                caption: 'material',
                w: 143,
                h: 23,
                top: 125,
                left: 20,
                fontSize: 20,
                parent: 'body',
                click: function () {
                    aEditor.changeMaterial();
                }
            });

            btnBack = createButton({
                caption: 'back to menu',
                w: 234,
                h: 32,
                top: 10,
                left: 20,
                fontSize: 28,
                parent: 'body',
                click: function () {
                    changePage(pageMenu);
                }
            });
            btnBack.addClass('back');

            btnSuccess = createButton({
                caption: 'Prefect!\nnext level! ->',
                w: 234,
                h: 90,
                top: 10,
                left: 20,
                fontSize: 36,
                parent: 'body',
                color: '#4f9',
                click: function () {
                    if (LevelList[openOpt.levelNo+1]) {
                        changePage(pageGame, {levelNo: openOpt.levelNo+1});
                    }
                    else {
                        changePage(pageLevels);
                    }
                }
            });

            btnMistake = createButton({
                caption: 'Not yet!',
                w: 234,
                h: 39,
                top: 10,
                left: 20,
                fontSize: 36,
                parent: 'body',
                color: '#f27',
                click: function () {
                    btnMistake.hide();
                }
            });

            wireHit = $('<div>')
                .css({
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    width: 136,
                    height: $(window).height(),
                    visibility: 'hidden'
                })
                .appendTo('body')
                .mouseover(function () {
                    TweenMax.to('.wire', .5, tweenOptWireActive);
                    TweenMax.to('.wire .name', .6, {autoAlpha: 1, textShadow:"0px 0px 15px black", ease:Sine.easeOut});
                })
                .mouseout(function () {
                    TweenMax.to('.wire', .7, tweenOptWireInactive);
                    TweenMax.to('.wire .name', .6, {autoAlpha: 0, textShadow:"", ease:Sine.easeOut});
                });

            resize();
            $(window).resize(resize);

            inited = true;
        }

        page.open = function (opt) {

            openOpt = opt;

            if (!inited) {
                init();
            }

            btnBack.show();
            btnVerify.show();
            btnUndo.show();
            btnRedo.show();
            btnReset.show();
            btnMaterial.show();
            wireHit.css('visibility', 'visible');

            if (!opt.resume) {
                loadLevel(opt.levelNo);
            }
            resize();

            TweenMax.set('.wire', tweenOptWireClose);
            TweenMax.to('.wire', .7, tweenOptWireInactive);

        }

        page.close = function (onComplete) {

            btnBack.hide();
            btnVerify.hide();
            btnSuccess.hide();
            btnMistake.hide();
            btnUndo.hide();
            btnRedo.hide();
            btnReset.hide();
            btnMaterial.hide();
            wireHit.css('visibility', 'hidden');

            TweenMax.to('.wire', .7, tweenOptWireClose);

            onComplete();
        }

        function resize() {

            btnBack.css({
                top: $(window).height() - 53
            });

            var whSum = 0, ws = 1, hs = 0;
            wireList.forEach(function (wire) {
                whSum += wire.height
            });

            if (whSum > $(window).height()) {
                ws = $(window).height() / whSum;
            }

            hs = ($(window).height() - (whSum * ws)) / 2;

            wireList.forEach(function (wire) {

                var w = wire.width * ws, h = wire.height * ws;

                $(wire)
                    .css({
                        position: 'absolute',
                        left: $(window).width() - wire.width,
                        top: hs,
                        width: w,
                        height: h
                    })
                    .appendTo('body');

                hs += h;

                TweenMax.set(wire, {transformOrigin: 'right top'});
            });

            wireHit.appendTo('body');


            btnSuccess.css({
                left: ($(window).width() - btnSuccess.width()) / 2,
                top: ($(window).height() - btnSuccess.height()) / 2
            });

            btnMistake.css({
                left: ($(window).width() - btnMistake.width()) / 2,
                top: ($(window).height() - btnMistake.height()) / 2
            });
        }

        return page;
    }
});
