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

        // this.createFrontPointer();

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
        this._transformModelSceleton.blockDiv = {
            x: opt.blockDivX,
            y: opt.blockDivY,
            z: opt.blockDivZ
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

        this._pick = p._pick.bind(this);
        $(opt.goo.renderer.domElement).on('mousedown', this._pick);

        if (Editor._helpCount++ < 3) {

            var help = $('<div>')
                .html('Let\'s edit the cube!<br>Blueprints on the right ->')
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
                    pointerEvents: 'none'
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

        state.dimensions = {
            x: state.length,
            y: state[0].length,
            z: state[0][0].length
        };

        state.blockDiv = {
            x: this.opt.blockDivX,
            y: this.opt.blockDivY,
            z: this.opt.blockDivZ
        };

        return state;
    }

    p.testSolusion = function () {

        var mState = JSON.parse(JSON.stringify(this._getState())), mTemp;

        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');

        mState = this._transformModel(mState, 'y');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');

        mState = this._transformModel(mState, 'y');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');

        mState = this._transformModel(mState, 'y');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');

        mState = this._transformModel(mState, 'x');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');

        mState = this._transformModel(mState, 'x');
        mState = this._transformModel(mState, 'x');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;
        mState = this._transformModel(mState, 'z');
        if (test(mState, this._solusion)) return true;

        return false;

        function test(mM, mK) {


            if (mM.dimensions.x !== mK.length ||
                mM.dimensions.y !== mK[0].length ||
                mM.dimensions.z !== mK[0][0].length) {

                console.log('wrong dimensions');
                return false;
            }


            var good = true, x, y, z, mCidx, kCidx;

            for (x = 0; x < mM.dimensions.x; ++x) {

                for (y = 0; y < mM.dimensions.y; ++y) {

                    for (z = 0; z < mM.dimensions.z; ++z) {

            // mM.forEach(function (bx, x) {

            //     bx.forEach(function (by, y) {

            //         by.forEach(function (bz, z) {

                        mTemp = mM[x][y][z].concat();

                        for (mCidx = 0; mCidx < 8; ++mCidx) {

                        // bz.forEach(function (mCorner, mCidx) {

                            for (kCidx = 0; kCidx < 8; ++kCidx) {

                            // mK[x][y][z].forEach( function (kCorner) {

                                if(same(mM[x][y][z][mCidx], mK[x][y][z][kCidx])) {

                                    mTemp.splice(mTemp.indexOf(mM[x][y][z][mCidx]), 1);
                                }
                            };
                        };

                        if (mTemp.length !== 0) {

                            good = false;
                        }
                    };
                };
            };

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
        var that = this, tms = this._transformModelSceleton, ncl, block, dim, t, x, y, z, cList;

        dim = m.dimensions;
        m = JSON.parse(JSON.stringify(m));
        m.dimensions = dim;

        tms.dimensions = JSON.parse(JSON.stringify(dim));

        switch (way) {

            case 'x':
            t = tms.dimensions.z;
            tms.dimensions.z = tms.dimensions.y;
            tms.dimensions.y = t;

            t = tms.blockDiv.z;
            tms.blockDiv.z = tms.blockDiv.y;
            tms.blockDiv.y = t;
            break;

            case 'y':
            t = tms.dimensions.x;
            tms.dimensions.x = tms.dimensions.z;
            tms.dimensions.z = t;

            t = tms.blockDiv.x;
            tms.blockDiv.x = tms.blockDiv.z;
            tms.blockDiv.z = t;
            break;

            case 'z':
            t = tms.dimensions.y;
            tms.dimensions.y = tms.dimensions.x;
            tms.dimensions.x = t;

            t = tms.blockDiv.y;
            tms.blockDiv.y = tms.blockDiv.x;
            tms.blockDiv.x = t;
            break;
        }

        for (x = 0; x < m.dimensions.x; ++x) {

            for (y = 0; y < m.dimensions.y; ++y) {

                for (z = 0; z < m.dimensions.z; ++z) {

                    cList = m[x][y][z];

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
                }
            }
        }

        return tms;

        function copy(target, source) {

            switch (way) {

                case 'x':
                target[0] = source[0];
                target[1] = source[2];
                target[2] = that.opt.blockDivZ - source[1];
                break;

                case 'y':
                target[0] = that.opt.blockDivX - source[2];;
                target[1] = source[1];
                target[2] = source[0];
                break;

                case 'z':
                target[0] = source[1];
                target[1] = that.opt.blockDivY - source[0];;
                target[2] = source[2];
                break;
            }
        }
    }

    p.changeMaterial = function () {

        this._lBlock.forEach(function (block) {

            block.changeMaterial();
        });
    }

    // p.createFrontPointer = function () {

    //     var meshData = ShapeCreator.createQuad(1, 2);
    //     var entity = EntityUtils.createTypicalEntity(this.opt.goo.world, meshData);
    //     var material = Material.createMaterial(ShaderLib.simpleLit);
    //     material.uniforms.materialAmbient = [1, 0, 0, -1];


    //     entity.transformComponent.setRotation(-Math.PI/2, 0, 0);
    //     entity.transformComponent.setTranslation(0, -3, 5);

    //     entity.meshDataComponent.meshData.dataViews.POSITION[3] = 0
    //     entity.meshDataComponent.meshData.dataViews.POSITION[6] = 0
    //     entity.meshDataComponent.meshData.vertexData._dataNeedsRefresh = true;

    //     this.entity.transformComponent.attachChild(entity.transformComponent);

    //     entity.meshRendererComponent.materials.push(material);
    //     entity.addToWorld();
    // };

    p.calcBlueprint = function (name) {

        glog.clear();//debug

        var oMap = this._getState(), i, j, eMap = [], lineList = [], dashedList = [],
            surfaceVidxList = [
                [0, 1, 2, 3],
                [4, 5, 6, 7],
                [7, 6, 2, 3],
                [4, 7, 3, 0],
                [5, 1, 0, 4],
                [6, 5, 1, 2]
            ],
            lineVidxList = [
                [0, 1], [1, 2], [2, 3], [3, 0],
                [0, 4], [1, 5], [2, 6], [3, 7],
                [4, 5], [5, 6], [6, 7], [7, 4]
            ],
            ret = {
                name: name || 'test',
                divX: oMap.dimensions.x * oMap.blockDiv.x,
                divY: oMap.dimensions.y * oMap.blockDiv.y,
                continuous: [],
                dashed: []
            };

        // oMap = this._transformModel(oMap, 'x');
        var blockId = 0; //debug
        //build the working view
        oMap.forEach(function (dx, x) {

            eMap[x] = [];

            dx.forEach(function (dy, y) {

                eMap[x][y] = [];

                dy.forEach(function (oBlock, z) {

                    var eBlock = eMap[x][y][z] = {
                        vertexList: [],
                        lineList: [],
                        surfaceList: [],
                        coords: [x,y,z],//debug
                        pos: [x * oMap.blockDiv.x, y * oMap.blockDiv.y, z * oMap.blockDiv.z],
                        id: blockId++//debug
                    };

                    oBlock.forEach(function (corner, vidx) {

                        eBlock.vertexList[vidx] = corner.concat();
                        eBlock.vertexList[vidx].id = vidx;
                    });

                    lineVidxList.forEach(function (vidxList, lidx) {

                        var line, lp, i, sx, sy, sz, dx, dy, dz, div = 1;

                        eBlock.lineList[lidx] = line = [
                            eBlock.vertexList[vidxList[0]],
                            eBlock.vertexList[vidxList[1]]
                        ];

                        sx = line[0][0];
                        sy = line[0][1];
                        sz = line[0][2];
                        dx = line[1][0] - sx;
                        dy = line[1][1] - sy;
                        dz = line[1][2] - sz;
                        div = Math.abs(gcd(gcd(dx, dy), dz));

                        //split line
                        line.partList = [];

                        glog.line3d(line, 'rgba(255,255,255,.2)', 1, eBlock.pos);//debug

                        if (!(line[0][0] === line[1][0] && line[0][1] === line[1][1])) {//skip invisible (one point) lines

                            for (i = 0; i < div; ++i) {

                                lp = [
                                    [sx + (dx/div)*i, sy + (dy/div)*i, sz + (dz/div)*i],
                                    [sx + (dx/div)*(i+1), sy + (dy/div)*(i+1), sz + (dz/div)*(i+1)]
                                ];
                                lp.dasheds = [];

                                line.partList.push(lp);
                            }
                        }

                    });

                    surfaceVidxList.forEach(function (vidxList, sidx) {

                        eBlock.surfaceList[sidx] = [
                            eBlock.vertexList[vidxList[0]],
                            eBlock.vertexList[vidxList[1]],
                            eBlock.vertexList[vidxList[2]],
                            eBlock.vertexList[vidxList[3]]
                        ];
                    });
                });
            });
        });



        //mark lineparts hidden by an edge
        eMap.forEach(function (eMapY, x) {
            eMapY.forEach(function (eMapZ, y) {
                eMapZ.forEach(function (aBlock, az) {

                    aBlock.lineList.forEach(function (aLine3d) {

                        for (var ai = 0; ai < aLine3d.partList.length; ++ai) {

                            var aLp3d = aLine3d.partList[ai];

                            eMapZ.forEach(function (bBlock, bz) {

                                bBlock.lineList.forEach(function (bLine3d) {

                                    if (aLine3d === bLine3d) {
                                        return;
                                    }

                                    for (var bi = 0; bi < bLine3d.partList.length; ++bi) {

                                        var bLp3d = bLine3d.partList[bi];

                                        if (
                                           (aLp3d[0][0] === bLp3d[0][0] &&
                                            aLp3d[0][1] === bLp3d[0][1] &&
                                            aLp3d[1][0] === bLp3d[1][0] &&
                                            aLp3d[1][1] === bLp3d[1][1])
                                           ||
                                           (aLp3d[0][0] === bLp3d[1][0] &&
                                            aLp3d[0][1] === bLp3d[1][1] &&
                                            aLp3d[1][0] === bLp3d[0][0] &&
                                            aLp3d[1][1] === bLp3d[0][1]))
                                        {
                                            var azVal0 = aLp3d[0][2] + (az * oMap.blockDiv.z),
                                                azVal1 = aLp3d[1][2] + (az * oMap.blockDiv.z),
                                                bzVal0 = bLp3d[0][2] + (bz * oMap.blockDiv.z),
                                                bzVal1 = bLp3d[1][2] + (bz * oMap.blockDiv.z);

                                            if (azVal0 > bzVal0 || azVal1 > bzVal1) {

                                                bLp3d.dasheds.push([0, 1]);
                                            }
                                        }
                                    }
                                });
                            });
                        }
                    });
                });
            });
        });


        //"merge" cubes (by remove matching lineparts)
        eachBlock(function (aBlock) {

            var m;

            aBlock.lineList.forEach(function (aLine3d) {

                for (var ai = 0; ai < aLine3d.partList.length; ++ai) {


                    var matches = [];

                    eachBlock(function (bBlock) {

                        bBlock.lineList.forEach(function (bLine3d) {

                            if (aLine3d === bLine3d) {
                                return;
                            }

                            for (var bi = 0; bi < bLine3d.partList.length; ++bi) {

                                if (isMatchingLineparts3d(aLine3d.partList[ai], aBlock, bLine3d.partList[bi], bBlock)) {

                                    // var color = '#' + parseInt(0xffffff * Math.random()).toString(16).substr(-3);
                                    // glog.line3d(aLine3d.partList[ai], color, 1, aBlock.pos);//debug
                                    // glog.line3d(bLine3d.partList[bi], color, 1, bBlock.pos);//debug

                                    matches.push(prepareMatch(aBlock, aLine3d, aLine3d.partList[ai]));
                                }
                            }
                        });
                    });

                    if (matches.length) {

                        for (var i = 0; i < matches.length; ++i) {
                            for (var j = 0; j < matches.length; ++j) {

                                if (i === j) {
                                    continue;
                                }

                                if (matches[i].block === matches[j].block) {

                                    var im = matches[i],
                                        jm = matches.splice(j--, 1)[0];

                                    if (im.oLineA === jm.line) {
                                        im.oLineA = jm.line
                                    }
                                    else if (im.oLineB === jm.line) {
                                        im.oLineB = jm.line
                                    }
                                }
                                else if (mergeMaches(matches[i], matches[j])) {
                                    --j;
                                }
                            }
                        }
                    }

                    if (matches.length === 1) {

                        m = matches[0];

                        if (isPointsInTheSamePlane(m.line[0], m.line[1], m.oLineA[0], m.oLineB[0]) ||
                            isPointsInTheSamePlane(m.line[0], m.line[1], m.oLineA[0], m.oLineB[1]) ||
                            isPointsInTheSamePlane(m.line[0], m.line[1], m.oLineA[1], m.oLineB[0]) ||
                            isPointsInTheSamePlane(m.line[0], m.line[1], m.oLineA[1], m.oLineB[1]))
                        {
                            matches[0].clear();
                        }
                    }
                    else if (matches.length > 1) {

                        matches.slice(1).forEach(function (match) {
                            match.clear();
                        });
                    }
                }
            });

            function prepareMatch(block, line, lp) {

                var oLines = getOppositeLines(block, line);

                return {
                    lp: lp,
                    oLineA: oLines[0],
                    oLineB: oLines[1],
                    clear: function () {
                        
                        var idx = line.partList.indexOf(lp);

                        glog.line3d(lp, 'rgba(23, 45, 234, .43)', 1, block);//debug
                        
                        if (idx !== -1) {
                            line.partList.splice(idx, 1);
                        }
                    }
                };
            }

            function mergeMatches(m0, m1) {

                // if (m0[0][0] === m1[1][0] && m0[1][0] === m1[0][0] && m0[0][0] === m1[1][0] &&
                //     m0.coord[0] ===  m1.coord[0])

                return (la[0][0] === la[1][0] && la[1][0] === lb[0][0] && lb[0][0] === lb[1][0]) ||
                       (la[0][1] === la[1][1] && la[1][1] === lb[0][1] && lb[0][1] === lb[1][1]) ||
                       (la[0][2] === la[1][2] && la[1][2] === lb[0][2] && lb[0][2] === lb[1][2]);
            }

            function isMatchingLineparts3d(lpa, aBlock, lpb, bBlock) {

                var aPos = aBlock.pos,
                    bPos = bBlock.pos;

                return (lpa[0][0] + aPos[0] === lpb[0][0] + bPos[0] &&
                        lpa[0][1] + aPos[1] === lpb[0][1] + bPos[1] &&
                        lpa[0][2] + aPos[2] === lpb[0][2] + bPos[2] &&
                        lpa[1][0] + aPos[0] === lpb[1][0] + bPos[0] &&
                        lpa[1][1] + aPos[1] === lpb[1][1] + bPos[1] &&
                        lpa[1][2] + aPos[2] === lpb[1][2] + bPos[2])
                       ||
                       (lpa[0][0] + aPos[0] === lpb[1][0] + bPos[0] &&
                        lpa[0][1] + aPos[1] === lpb[1][1] + bPos[1] &&
                        lpa[0][2] + aPos[2] === lpb[1][2] + bPos[2] &&
                        lpa[1][0] + aPos[0] === lpb[0][0] + bPos[0] &&
                        lpa[1][1] + aPos[1] === lpb[0][1] + bPos[1] &&
                        lpa[1][2] + aPos[2] === lpb[0][2] + bPos[2]);
            }

            function getOppositeLines(block, line) {

                var ret = [], lineVertexes = [], oVertexes = [];

                block.surfaceList.forEach(function (surface) {

                    lineVertexes.length = 0;
                    oVertexes.length = 0;

                    surface.forEach(function (v) {

                        if(line.indexOf(v) !== -1) {
                            lineVertexes.push(v);
                        }
                        else {
                            oVertexes.push(v);
                        }
                    });

                    if (lineVertexes.length === 2) {

                        ret.push(getLine(block, oVertexes[0].id, oVertexes[1].id))
                    }
                });

                if (ret.length !== 2) debugger;//delMe

                return ret;
            }

            function getLine(block, vidx0, vidx1) {

                for (var line, i = 0, l = block.lineList.length; i < l; ++i) {

                    line = block.lineList[i];

                    if ((line[0].id === vidx0 && line[1].id === vidx1) ||
                        (line[0].id === vidx1 && line[1].id === vidx0))
                    {
                        return line;
                    }                    
                }
            }
        });


        //remove the overlapping lineparts (but the first)
        eMap.forEach(function (eMapY, x) {
            eMapY.forEach(function (eMapZ, y) {
                eMapZ.forEach(function (aBlock, az) {

                    aBlock.lineList.forEach(function (aLine3d) {

                        for (var ai = 0; ai < aLine3d.partList.length; ++ai) {

                            var aLp3d = aLine3d.partList[ai];

                            eMapZ.forEach(function (bBlock, bz) {

                                bBlock.lineList.forEach(function (bLine3d) {

                                    if (aLine3d === bLine3d) return;

                                    for (var bi = 0; bi < bLine3d.partList.length; ++bi) {

                                        var bLp3d = bLine3d.partList[bi];

                                        if (
                                           (aLp3d[0][0] === bLp3d[0][0] &&
                                            aLp3d[0][1] === bLp3d[0][1] &&
                                            aLp3d[1][0] === bLp3d[1][0] &&
                                            aLp3d[1][1] === bLp3d[1][1])
                                           ||
                                           (aLp3d[0][0] === bLp3d[1][0] &&
                                            aLp3d[0][1] === bLp3d[1][1] &&
                                            aLp3d[1][0] === bLp3d[0][0] &&
                                            aLp3d[1][1] === bLp3d[0][1]))
                                        {
                                            var azVal0 = aLp3d[0][2] + (az * oMap.blockDiv.z),
                                                azVal1 = aLp3d[1][2] + (az * oMap.blockDiv.z),
                                                bzVal0 = bLp3d[0][2] + (bz * oMap.blockDiv.z),
                                                bzVal1 = bLp3d[1][2] + (bz * oMap.blockDiv.z);

                                            if (azVal0 >= bzVal0 && azVal1 >= bzVal1) {

                                                bLine3d.partList.splice(bi--, 1);
                                            }
                                        }
                                    }
                                });
                            });
                        }
                    });
                });
            });
        });



        //mark the hidden lineparts
        eMap.forEach(function (eMapY, x) {
            eMapY.forEach(function (eMapZ, y) {
                eMapZ.forEach(function (aBlock, az) {

                    aBlock.lineList.forEach(function (line) {

                        line.partList.forEach(function (lp) {

                            for (var bz = az; bz < oMap.dimensions.z; ++bz) {

                                var zOffA = az * oMap.blockDiv.z,
                                    zOffB = bz * oMap.blockDiv.z;

                                eMapZ[bz].surfaceList.forEach(function (bSurf) {

                                    lp.dasheds.push(markHidden([bSurf[0], bSurf[1], bSurf[2]], lp, zOffB, zOffA));
                                    lp.dasheds.push(markHidden([bSurf[1], bSurf[2], bSurf[3]], lp, zOffB, zOffA));
                                    lp.dasheds.push(markHidden([bSurf[2], bSurf[3], bSurf[0]], lp, zOffB, zOffA));
                                    lp.dasheds.push(markHidden([bSurf[3], bSurf[0], bSurf[1]], lp, zOffB, zOffA));
                                });
                            }

                            lp.dasheds = lp.dasheds.filter(function (d) {
                                return d !== undefined;
                            });

                            lp.dasheds.map(function (d) {
                                return d[0] < d[1] ? d : d.reverse();
                            });

                            //merge

                            for (var i0 = 0; i0 < lp.dasheds.length; ++i0) {

                                var d0 = lp.dasheds[i0];

                                for (var i1 = i0 + 1; i1 < lp.dasheds.length; ++i1) {

                                    var d1 = lp.dasheds[i1];

                                    if ((d1[0] <= d0[1] && d1[1] >= d0[0]))
                                    {
                                        var t = Math.min(d0[0], d0[1], d1[0], d1[1]);
                                        d0[1] = Math.max(d0[0], d0[1], d1[0], d1[1]);
                                        d0[0] = t;

                                        lp.dasheds.splice(i1, 1);
                                        i1 = i0;
                                    }
                                }
                            }
                        });
                    });
                });
            });
        });


        //get all lines in 2d in a flat array
        eMap.forEach(function (eMapY, x) {
            eMapY.forEach(function (eMapZ, y) {
                eMapZ.forEach(function (aBlock, z) {
                    aBlock.lineList.forEach(function (line3d, z) {

                        line3d.partList.forEach(function (lp3d, z) {

                            var pos = 0, solids = [], dasheds = [],
                                dx = lp3d[1][0] - lp3d[0][0],
                                dy = lp3d[1][1] - lp3d[0][1];

                            lp3d.dasheds.sort(function (a, b) {
                                return a[0] - b[0]
                            });


                            for (var i = 0; i < lp3d.dasheds.length; ++i) {

                                if (lp3d.dasheds[i][0] > pos) {

                                    lineList.push(getPart(pos, lp3d.dasheds[i][0]));
                                }
                                dashedList.push(getPart(lp3d.dasheds[i][0], lp3d.dasheds[i][1]));

                                pos = lp3d.dasheds[i][1];
                            }

                            if (pos < 1) {

                                lineList.push(getPart(pos, 1));
                            }

                            function getPart(a, b) {

                                var tempX, tempY, line = [
                                    lp3d[0][0] + (dx * a) + (oMap.blockDiv.x * x),
                                    lp3d[0][1] + (dy * a) + (oMap.blockDiv.y * y),
                                    lp3d[0][0] + (dx * b) + (oMap.blockDiv.x * x),
                                    lp3d[0][1] + (dy * b) + (oMap.blockDiv.y * y)
                                ];

                                line[1] = (oMap.blockDiv.y * oMap.dimensions.y) - line[1];
                                line[3] = (oMap.blockDiv.y * oMap.dimensions.y) - line[3];

                                if (line[0] > line[2]) {//pointing left

                                    // line.flippedX = true;

                                    tempX = line[0],
                                    tempY = line[1];

                                    line[0] = line[2];
                                    line[1] = line[3];
                                    line[2] = tempX;
                                    line[3] = tempY;
                                }
                                else if (line[0] - line[2] === 0 && line[1] > line[3]) {//vertical and pointing up

                                    // line.flippedY = true;

                                    tempY = line[1];

                                    line[1] = line[3];
                                    line[3] = tempY;
                                }

                                return line;
                            }
                        });
                    });
                });
            });
        });
        mergeLines(lineList);
        mergeLines(dashedList);

        ret.continuous = lineList;
        ret.dashed = dashedList;

        return ret;

        //------------------------------------------------------------------------------------------



        function eachBlock(cb) {
            eMap.forEach(function (eMapY, x) {
                eMapY.forEach(function (eMapZ, y) {
                    eMapZ.forEach(function (block, z) {

                        cb(block, x, y, z);
                    });
                });
            });
        }

        function removeMathcingLineparts(aBlock, bBlock, direction, fullSize, cb) {

            aBlock.surfaceList.forEach(function (aSurface) {

                if (aSurface[0][direction] === fullSize &&
                    aSurface[1][direction] === fullSize &&
                    aSurface[2][direction] === fullSize &&
                    aSurface[3][direction] === fullSize)
                {
                    bBlock.surfaceList.forEach(function (bSurface) {

                        if (bSurface[0][direction] === 0 &&
                            bSurface[1][direction] === 0 &&
                            bSurface[2][direction] === 0 &&
                            bSurface[3][direction] === 0)
                        {
                            earseMatchingLines(aBlock, bBlock, aSurface, bSurface, direction);
                        }
                    });
                }
            });
        }

        function earseMatchingLines(aBlock, bBlock, aSurface, bSurface, direction) {

            var aLineList = [], bLineList = [], aoLineList = [], boLineList = [],
                i, j, ia, ib, aLine, bLine, aoLine, boLine, aPart, bPart, bLineM, bLineMList = [],
                offset = oMap.blockDiv[['x', 'y', 'z'][direction]];

            aSurface.forEach(function (v, idx) {

                aLineList.push(getLine(aBlock, v.id, aSurface[(idx+1) % 4].id));
                aoLineList.push(getOppositeLine(aBlock, aSurface, aLineList[idx]));
            });

            bSurface.forEach(function (v, idx) {

                bLine = getLine(bBlock, v.id, bSurface[(idx+1) % 4].id);
                boLine = getOppositeLine(bBlock, bSurface, bLine);
                bLineM = [bLine[0].slice(0), bLine[1].slice(0)];
                boLine = [boLine[0].slice(0), boLine[1].slice(0)];
                bLineM[0][direction] += offset;
                bLineM[1][direction] += offset;
                boLine[0][direction] += offset;
                boLine[1][direction] += offset;
                bLineList.push(bLine);
                boLineList.push(boLine);
                bLineMList.push(bLineM);
            });

            for (i = 0; i < 4; ++i) {

                aLine = aLineList[i];
                aoLine = aoLineList[i];

                for (j = 0; j < 4; ++j) {

                    bLine = bLineList[j];
                    boLine = boLineList[j];
                    bLineM = bLineMList[j];

                    // glog.clear()
                    //     .style('#fff', 2, 0)
                    //     .line3d([[0,0,0],[3,0,0]])
                    //     .line3d([[3,0,0],[3,0,3]])
                    //     .line3d([[3,0,3],[0,0,3]])
                    //     .line3d([[0,0,3],[0,0,0]])
                    //     .line3d([[0,3,0],[3,3,0]])
                    //     .line3d([[3,3,0],[3,3,3]])
                    //     .line3d([[3,3,3],[0,3,3]])
                    //     .line3d([[0,3,3],[0,3,0]])
                    //     .line3d([[0,0,0],[0,3,0]])
                    //     .line3d([[3,0,0],[3,3,0]])
                    //     .line3d([[3,0,3],[3,3,3]])
                    //     .line3d([[0,0,3],[0,3,3]])
                    //     .line3d(aLine, '#FFFF00', 3, 0)
                    //     .line3d(aoLine, '#FF9900', 3, 2)
                    //     .line3d(bLineM, '#0066FF', 3, 4)
                    //     .line3d(boLine, '#CC66FF', 3, 6);

                    // var test = [
                    //     isPointsInTheSamePlane(aLine[0], aLine[1], aoLine[0], boLine[0]),
                    //     isPointsInTheSamePlane(aLine[0], aLine[1], aoLine[0], boLine[1]),
                    //     isPointsInTheSamePlane(aLine[0], aLine[1], aoLine[1], boLine[0]),
                    //     isPointsInTheSamePlane(aLine[0], aLine[1], aoLine[1], boLine[1])
                    // ];

                    if (isPointsInTheSamePlane(aLine[0], aLine[1], aoLine[0], boLine[0]) ||
                        isPointsInTheSamePlane(aLine[0], aLine[1], aoLine[0], boLine[1]) ||
                        isPointsInTheSamePlane(aLine[0], aLine[1], aoLine[1], boLine[0]) ||
                        isPointsInTheSamePlane(aLine[0], aLine[1], aoLine[1], boLine[1]))
                    {
                        // glog.line3d([[2,0,0],[2.3,-.2,0]], '#2bff42', 3, 0)
                        // glog.line3d([[2.3,-.2,0],[2.8,.3,0]], '#2bff42', 3, 0)

                        for (ia = 0; ia < aLine.partList.length; ++ia) {

                            aPart = line2d(aLine.partList[ia], direction);

                            for (ib = 0; ib < bLine.partList.length; ++ib) {

                                bPart = line2d(bLine.partList[ib], direction);


                                if ((aPart[0] === bPart[0] &&
                                     aPart[1] === bPart[1] &&
                                     aPart[2] === bPart[2] &&
                                     aPart[3] === bPart[3])
                                    ||
                                    (aPart[0] === bPart[2] &&
                                     aPart[1] === bPart[3] &&
                                     aPart[2] === bPart[0] &&
                                     aPart[3] === bPart[1]))
                                {
                                    // glog.line3d([[4,0,0],[4.3,-.2,0]], '#2bff42', 3, 0)
                                    // glog.line3d([[4.3,-.2,0],[4.8,.3,0]], '#2bff42', 3, 0)

                                    // console.log('earse', aBlock.id, bBlock.id, direction, aLine.toString(), '|',bLine.toString(), aPart.toString(), '|',bPart.toString());
                                    aLine.partList.splice(ia--, 1);
                                    bLine.partList.splice(ib--, 1);
                                }
                            }
                        }
                    }
                }
            };

            function line2d(line3d, direction) {

                switch (direction) {

                    case 0: return [ line3d[0][1], line3d[0][2], line3d[1][1], line3d[1][2] ];
                    case 1: return [ line3d[0][2], line3d[0][0], line3d[1][2], line3d[1][0] ];
                    case 2: return [ line3d[0][0], line3d[0][1], line3d[1][0], line3d[1][1] ];
                }
            }

            function getOppositeLine (aBlock, aSurface, aLine) {

                var ret, bLine;

                aBlock.surfaceList.forEach(function (bSurface) {

                    if (aSurface !== bSurface) {

                        bSurface.forEach(function (v0, idx) {

                            bLine = getLine(aBlock, v0.id, bSurface[(idx+1)%4].id);

                            if (aLine === bLine) {

                                ret = getLine(aBlock, bSurface[(idx+2)%4].id, bSurface[(idx+3)%4].id);
                            }
                        });
                    }
                });

                return ret;
            }
        }

        function getLine(block, vidx0, vidx1) {

            var ret;

            block.lineList.forEach(function (line) {

                if ((line[0].id === vidx0 && line[1].id === vidx1) ||
                    (line[0].id === vidx1 && line[1].id === vidx0))
                {
                    ret = line;
                }
            });

            return ret;
        }

        function isOverlapping2DLines(l0, l1) {

            var d0x = l0[2] - l0[0],
                d0y = l0[3] - l0[1],
                d1x = l1[2] - l1[0],
                d1y = l1[3] - l1[1],
                slope0 = d0y/d0x;

            return ((l0[0] <= l1[0] && l0[2] >= l1[0]) ||
                 (l0[2] >= l1[2] && l0[0] <= l1[2])) //lines are overlapping horizontally

                &&

                (d0y !== 0 || //not vertical
                    ((l0[1] <= l1[1] && l0[3] >= l1[1]) ||
                    (l0[3] >= l1[3] && l0[1] <= l1[3])) //lines are overlapping vertically
                )

                &&

                ((d0x === 0 && d1x === 0 && l0[0] === l1[0]) ||
                (d0y === 0 && d1y === 0 && l0[1] === l1[1]) ||
                (
                    (d0x !== 0 && d0y !== 0 && d1x !== 0 && d1y !== 0) &&
                    (l0[1] + (slope0 * (l1[0] - l0[0])) === l1[1]) &&
                    (l0[1] + (slope0 * (l1[2] - l0[0])) === l1[3])
                ));
        }

        function mergeLines(lineList) {

            var i, j, l0, l1, slope0;

            for (i = 0; i < lineList.length; ++i) {

                l0 = lineList[i];
                slope0 = (l0[3]-l0[1]) / (l0[2]-l0[0]);

                for (j = 0; j < lineList.length; ++j) {

                    l1 = lineList[j];

                    if (i !== j) {

                        if (isOverlapping2DLines (l0, l1))
                        {
                            if (l0[2] - l0[0] === 0) {//is horisontal
                                l0[1] = Math.min(l0[1], l1[1], l0[3], l1[3]);
                                l0[3] = Math.max(l0[1], l1[1], l0[3], l1[3]);
                            }
                            else {
                                l0[0] = Math.min(l0[0], l1[0]);
                                l0[2] = Math.max(l0[2], l1[2]);

                                if (slope0 > 0) {
                                    l0[1] = Math.min(l0[1], l1[1]);
                                    l0[3] = Math.max(l0[3], l1[3]);
                                }
                                else if (slope0 < 0) {
                                    l0[1] = Math.max(l0[1], l1[1]);
                                    l0[3] = Math.min(l0[3], l1[3]);
                                }
                            }

                            lineList.splice(j, 1);
                            if (i > j) {
                                --i;
                            }
                            --j;
                        }
                    }
                }
            }
        }
    }



    function mv(v0, v1) { //matchingVertexes

        return v0[0] === v1[0] && v0[1] === v1[1] && v0[2] === v1[2];
    }

    function isPointsInTheSamePlane (p0, p1, p2, p3) {

        var a0 = areaOfTriangle(distance3d(p0, p2), distance3d(p2, p3), distance3d(p3, p0))
                + areaOfTriangle(distance3d(p0, p2), distance3d(p2, p1), distance3d(p1, p0)),
            a1 = areaOfTriangle(distance3d(p1, p3), distance3d(p3, p2), distance3d(p2, p1))
                + areaOfTriangle(distance3d(p0, p1), distance3d(p1, p3), distance3d(p3, p0));

        return epsEqu(a0, a1);
    }
    // window.isPointsInTheSamePlane = isPointsInTheSamePlane;

    function areaOfTriangle(edge1, edge2, edge3) {

        var s = 0.5 * ( edge1 + edge2 + edge3);
        var ret = Math.sqrt( s * ( s - edge1) * ( s - edge2) * ( s - edge3));
        return ret;
    }

    function distance3d(v0, v1) {

        var xd = v1[0]-v0[0];
        var yd = v1[1]-v0[1];
        var zd = v1[2]-v0[2];
        var cd = Math.sqrt(xd*xd + yd*yd);
        return Math.sqrt(cd*cd + zd*zd);
    }

    function gcd(a, b) {
        if ( ! b) {
            return a;
        }

        return gcd(b, a % b);
    };

    p.destroy = function () {
        $(this.opt.goo.renderer.domElement).off('mousedown', this._pick);
    }

    return Editor;
});

var glog = (function () {

    var c = document.createElement('canvas'),
        ctx = c.getContext('2d'), color = '#fff', off = 0, lineWidth = 3;

    c.width = c.height = 500;

    ctx.fillStyle = '#f41';
    ctx.fillRect(0,0,12,12);

    $(c).css({
            position: 'absolute',
            zIndex: '99999',
            pointerEvents: 'none'
        })
        .appendTo('body');

    var glog = {

        style: function (_color,  _strokeWidth) {

            color = _color === undefined ? color : _color;
            strokeWidth = _strokeWidth === undefined ? strokeWidth : _strokeWidth;

            return glog;
        },

        clear: function () {
            ctx.clearRect(0, 0, c.width, c.height);

            return glog;
        },

        line3d: function (line, _color,  _strokeWidth, cubeCoord) {
            glog.style(_color,  _strokeWidth);

            var s = 30, bottom = 0, zvx = .23, zvy = .4;

            ctx.beginPath();
            ctx.save();
            ctx.translate(200, 300);
            if (cubeCoord) {
                ctx.translate(
                    (cubeCoord[0] + cubeCoord[2] * zvx)*s*1.32, 
                    (-cubeCoord[1] + cubeCoord[2] * zvy)*s*1.32);
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.shadowBlur = color;
            ctx.shadowColor = '#000';
            ctx.moveTo((line[0][0] + line[0][2]*zvx)*s, (-line[0][1] + line[0][2]*zvy)*s);
            ctx.lineTo((line[1][0] + line[1][2]*zvx)*s, (-line[1][1] + line[1][2]*zvy)*s);
            ctx.stroke();
            ctx.restore();

            return glog;
        }
    }

    return glog;
}());

