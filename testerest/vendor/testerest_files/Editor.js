define([
    'EdiBlock',
    'underscore',
    'goo/entities/EntityUtils',
    'goo/entities/GooRunner',
    'goo/renderer/Camera',
    'goo/renderer/Material',
    'goo/renderer/TextureCreator',
    'goo/renderer/light/PointLight',
    'goo/renderer/shaders/ShaderLib',
    'goo/scripts/MouseLookControlScript',
    'goo/shapes/ShapeCreator',
    'goo/util/Grid'
], function (
    EdiBlock,
    _,
    EntityUtils,
    GooRunner,
    Camera,
    Material,
    TextureCreator,
    PointLight,
    ShaderLib,
    MouseLookControlScript,
    ShapeCreator,
    Grid
) {
    "use strict";

    var defOpt = {

        blockSizeX: 1,
        blockSizeY: 1,
        blockSizeZ: 1,
        blockDivX: 3,
        blockDivY: 3,
        blockDivZ: 3,
        divX: 2,
        divY: 1,
        divZ: 1
    };

    function Editor (opt, solusion) {

        var that = this;

        _.defaults(opt, defOpt);
        this.opt = opt;

        this._history = [];
        this._historyPointer = 0;

        var xi, yi, zi, ci;
        var maxDiv = Math.max(opt.divX, opt.divY, opt.divZ);
        opt.blockSizeX = 2 / maxDiv; 
        opt.blockSizeY = 2 / maxDiv; 
        opt.blockSizeZ = 2 / maxDiv; 

        this._solusion = solusion;

        this._mBlock = [];
        this._mTemp = [];
        this._lBlock = [];
        this._aBlock = undefined;
        this._blockEntityIdList = [];

        window.editor = this;

        var controlScript = window.cs = new MouseLookControlScript();
        this.entity = EntityUtils.createTypicalEntity(opt.goo.world, controlScript, [0, 0, -10]);
        this.entity.addToWorld();

        this.createFrontPointer();

        this._onEditFinish = function () {
            controlScript.turnSpeedHorizontal = 0.01;
            controlScript.turnSpeedVertical = 0.01;
        };

        this._onEditStart = function () {
            controlScript.turnSpeedHorizontal = 0;
            controlScript.turnSpeedVertical = 0;
        };




        this._transformModelSceleton = [];

        for (xi = 0; xi < maxDiv; ++xi) {

            this._transformModelSceleton[xi] = [];
            
            for (yi = 0; yi < maxDiv; ++yi) {

                this._transformModelSceleton[xi][yi] = [];
                
                for (zi = 0; zi < maxDiv; ++zi) {

                    this._transformModelSceleton[xi][yi][zi] = [];

                    for (ci = 0; ci < 8; ++ci) {

                        this._transformModelSceleton[xi][yi][zi][ci] = [];
                    }
                }
            }
        }
        this._transformModelSceleton.dimensions = {
            x: opt.divX,
            y: opt.divY,
            z: opt.divZ
        };





        for (xi = 0; xi < opt.divX; ++xi) {

            this._mBlock[xi] = [];
            
            for (yi = 0; yi < opt.divY; ++yi) {

                this._mBlock[xi][yi] = [];
                
                for (zi = 0; zi < opt.divZ; ++zi) {

                    var block = new EdiBlock({
                        sizeX: opt.blockSizeX,
                        sizeY: opt.blockSizeY,
                        sizeZ: opt.blockSizeZ,
                        divX: opt.blockDivX,
                        divY: opt.blockDivY,
                        divZ: opt.blockDivZ,
                        goo: opt.goo,
                        camera: opt.camera,
                        saveHistory: function (reg) {

                            if (that._historyPointer < that._history.length) {
                                that._history = that._history.splice(0, that._historyPointer)
                            }

                            that._history.push(reg);
                            that._historyPointer = that._history.length;
                        }
                    });

                    this._mBlock[xi][yi][zi] = block;
                    this._lBlock.push(block);
                    this._blockEntityIdList.push(block.entity.id)

                    block.entity.transformComponent.setTranslation(
                        ((.5 + xi) - (opt.divX / 2)) * opt.blockSizeX * opt.blockDivX,
                        ((.5 + yi) - (opt.divY / 2)) * opt.blockSizeY * opt.blockDivY,
                        ((.5 + zi) - (opt.divZ / 2)) * opt.blockSizeZ * opt.blockDivZ
                    );
                    this.entity.transformComponent.attachChild(block.entity.transformComponent);
                }
            }
        }

        opt.goo.renderer.domElement.addEventListener('mousedown', this._pick.bind(this), true);

        if (Editor._helpCount++ < 3) {

            var help = $('<div>')
                .text('Let\'s edit the cube!\nBlueprints on the right ->')
                .css({
                    position: 'absolute',
                    fontFamily: 'Arvo, serif',
                    fontWeight: 700,
                    fontSize: '32px',
                    color: '#a7f',
                    textAlign: 'center',
                    opacity: 0,
                    width: 500,
                    left: ($(window).width() - 500) / 2,
                    top: ($(window).height() - 82) / 2,
                    // backgroundColor: 'rgba(0, 0, 0, .43)'
                })
                .appendTo('body');

            TweenMax.to(help, 1, {autoAlpha: 1, ease:Sine.easeOut, onComplete:function () {
                TweenMax.to(help, 2.3, {delay: 3, autoAlpha: 0, ease:Sine.easeOut, onComplete:function () {
                    help.remove();
                }});
            }});
        }
    }

    var p = Editor.prototype;

    Editor._helpCount = 0;

    p.undo = function () {

        if (this._historyPointer > 0) {

            --this._historyPointer;
            var f = this._history[this._historyPointer].undo;
            f[0].apply(f[1], f.slice(2));

            return true
        }
        else {
            return false
        }
    }

    p.redo = function () {

        if (this._historyPointer < this._history.length) {

            var f = this._history[this._historyPointer].redo;
            f[0].apply(f[1], f.slice(2));

            ++this._historyPointer;

            return true
        }
        else {
            return false
        }
    }

    p._pick = function (e) {

        var that = this, block, blockIdx;


        this.opt.goo.pick(e.clientX, e.clientY, function (id, depth) {

            if (id === -1) {

                if (that._aBlock) {
                    that._aBlock.hidePickers();
                    that._aBlock = undefined;
                };
            }

            blockIdx = that._blockEntityIdList.indexOf(id);
            
            if (blockIdx !== -1 && blockIdx !== that._lBlock.indexOf(that._aBlock)) {

                if (that._aBlock) {
                    that._aBlock.hidePickers();
                }

                that._aBlock = that._lBlock[blockIdx];
                that._aBlock.showPickers();

                return;
            }



            for (var i = 0; i < that._lBlock.length; ++i) {

                block = that._lBlock[i];

                if (block.selectPicker(id, e.clientX, e.clientY)) {
                    that._onEditStart();
                    return;
                }
            }

            //if no hit
            that._onEditFinish();
        });
    }

    p.saveMap = function () {

        var map = {};
        map.editorOpt = {
            blockSizeX: this.opt.blockSizeX,
            blockSizeY: this.opt.blockSizeY,
            blockSizeZ: this.opt.blockSizeZ,
            blockDivX: this.opt.blockDivX,
            blockDivY: this.opt.blockDivY,
            blockDivZ: this.opt.blockDivZ,
            divX: this.opt.divX,
            divY: this.opt.divY,
            divZ: this.opt.divZ
        };
        map.solusion = this._getState();

        console.log(map);
        return JSON.stringify(map);
    }

    p._getState = function () {

        var state = [];

        this._mBlock.forEach(function (bx, x) {

            state.push([]);

            bx.forEach(function (by, y) {

                state[x].push([]);

                by.forEach(function (bz, z) {

                    state[x][y][z] = bz.getCornerList();
                });
            });
        });

        return state;
    }

    p.testSolusion = function () {

        var mState = JSON.parse(JSON.stringify(this._getState())), mTemp;

        return test(mState, this._solusion);
        
        /*if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;

        mState = this._transformModel(mState, 'y');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;

        mState = this._transformModel(mState, 'y');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;

        mState = this._transformModel(mState, 'y');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;

        mState = this._transformModel(mState, 'x');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;

        mState = this._transformModel(mState, 'x');
        mState = this._transformModel(mState, 'x');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;

        return false;*/

        function test(mM, mK) {

            var good = true;

            mM.forEach(function (bx, x) {

                bx.forEach(function (by, y) {

                    by.forEach(function (bz, z) {

                        mTemp = bz.concat();

                        bz.forEach(function (mCorner, mCidx) {

                            mK[x][y][z].forEach( function (kCorner) {

                                if(same(mCorner, kCorner)) {

                                    mTemp.splice(mTemp.indexOf(mCorner), 1);
                                }
                            });
                        });

                        if (mTemp.length !== 0) {

                            good = false;
                        }
                    });
                });
            });

            return good;
        }

        function same(v1, v2) {
            return v1[0] === v2[0] && v1[1] === v2[1] && v1[2] === v2[2];
        }
    }

    p._showSolusion = function () {

        var that = this, mState = this._getState(), solusion = this._solusion;

        mState.forEach(function (bx, x) {

            bx.forEach(function (by, y) {

                by.forEach(function (bz, z) {

                    bz.forEach(function (corner, cidx) {

                        corner[0] = solusion[x][y][z][cidx][0];
                        corner[1] = solusion[x][y][z][cidx][1];
                        corner[2] = solusion[x][y][z][cidx][2];
                    });

                    that._mBlock[x][y][z].refreshModel();
                });
            });
        });



        function same(v1, v2) {
            return v1[0] === v2[0] && v1[1] === v2[1] && v1[2] === v2[2];
        }
    }

    p._transformModel = function(m, way) {
        var tms = this._transformModelSceleton, ncl, block, t;

        switch (way) {

            case 'x':
            t = tms.dimensions.z;
            tms.dimensions.z = tms.dimensions.y;
            tms.dimensions.y = t;
            break;

            case 'y':
            t = tms.dimensions.x;
            tms.dimensions.x = tms.dimensions.z;
            tms.dimensions.z = t;
            break;

            case 'z':
            t = tms.dimensions.y;
            tms.dimensions.y = tms.dimensions.x;
            tms.dimensions.x = t;
            break;
        }

        m.forEach(function (bx, x) {

            bx.forEach(function (by, y) {

                by.forEach(function (cList, z) {
                    
                    //y
                    switch (way) {

                        case 'x':
                        block = tms[x][z][(tms.dimensions.z-1) - y];
                        copy(block[0], cList[4]);
                        copy(block[4], cList[7]);
                        copy(block[7], cList[3]);
                        copy(block[3], cList[0]);
                        copy(block[1], cList[5]);
                        copy(block[5], cList[6]);
                        copy(block[6], cList[2]);
                        copy(block[2], cList[1]);
                        break;

                        case 'y':
                        block = tms[(tms.dimensions.x-1) - z][y][x];
                        copy(block[0], cList[3]);
                        copy(block[1], cList[0]);
                        copy(block[2], cList[1]);
                        copy(block[3], cList[2]);
                        copy(block[4], cList[7]);
                        copy(block[5], cList[4]);
                        copy(block[6], cList[5]);
                        copy(block[7], cList[6]);
                        break;

                        case 'z':
                        block = tms[y][(tms.dimensions.y-1) - x][z];
                        copy(block[0], cList[3]);
                        copy(block[1], cList[0]);
                        copy(block[2], cList[1]);   
                        copy(block[3], cList[2]);
                        copy(block[4], cList[7]);
                        copy(block[5], cList[4]);
                        copy(block[6], cList[5]);
                        copy(block[7], cList[6]);
                        break;
                    }
                });
            });
        });

        return tms;

        function copy(target, source) {
            target[0] = source[0];
            target[1] = source[1];
            target[2] = source[2];
        }
    }

    p.createFrontPointer = function () {

        var meshData = ShapeCreator.createQuad(1, 2);
        var entity = EntityUtils.createTypicalEntity(this.opt.goo.world, meshData);
        var material = Material.createMaterial(ShaderLib.simpleLit);
        material.uniforms.materialAmbient = [1, 0, 0, -1];


        entity.transformComponent.setRotation(-Math.PI/2, 0, 0);
        entity.transformComponent.setTranslation(0, -3, 5);

        entity.meshDataComponent.meshData.dataViews.POSITION[3] = 0
        entity.meshDataComponent.meshData.dataViews.POSITION[6] = 0
        entity.meshDataComponent.meshData.vertexData._dataNeedsRefresh = true; 

        this.entity.transformComponent.attachChild(entity.transformComponent);

        entity.meshRendererComponent.materials.push(material);
        entity.addToWorld();
    };

    return Editor;
});