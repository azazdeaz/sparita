define([
    'underscore',
    'goo/entities/EntityUtils',
    'goo/entities/GooRunner',
    'goo/entities/components/MeshRendererComponent',
    'goo/renderer/Camera',
    'goo/renderer/Material',
    'goo/renderer/TextureCreator',
    'goo/renderer/light/PointLight',
    'goo/renderer/shaders/ShaderLib',
    'goo/scripts/MouseLookControlScript',
    'goo/shapes/ShapeCreator',
    'goo/renderer/RenderQueue',
    'goo/math/Vector3'
], function (
    _,
    EntityUtils,
    GooRunner,
    MeshRendererComponent,
    Camera,
    Material,
    TextureCreator,
    PointLight,
    ShaderLib,
    MouseLookControlScript,
    ShapeCreator,
    RenderQueue,
    Vector3
) {
    "use strict";

    var defOpt = {
        divX: 3,
        divY: 3,
        divZ: 3,
        sizeX: 1,
        sizeY: 1,
        sizeZ: 1
    }

    function EdiBlock (opt) {

        var that = this;
        window.eb = this;

        _.defaults(opt, defOpt);
        this.opt = opt;

        opt.fullSizeX = opt.sizeX * opt.divX;
        opt.fullSizeY = opt.sizeY * opt.divY;
        opt.fullSizeZ = opt.sizeZ * opt.divZ;

        this._cornerList = [
            [0, 0, 0],
            [1, 0, 0],
            [1, 0, 1],
            [0, 0, 1],
            [0, 1, 0],
            [1, 1, 0],
            [1, 1, 1],
            [0, 1, 1]
        ];
        this._cornerList.forEach(function (v) {
            v[0] *= opt.divX;
            v[1] *= opt.divY;
            v[2] *= opt.divZ;
        });

        this._pickerDict = {};

        this._ci2vp = [ //corner index to vertex pointers
            [0, 13, 20],
            [1, 4, 23],
            [5, 8, 22],
            [9, 12, 21],
            [3, 14, 19],
            [2, 7, 16],
            [6, 11, 17],
            [10, 15, 18]
        ];

        this._neighbors = [
            [-1,  1, -1,  4, -1,  3],
            [ 0, -1, -1,  5, -1,  2],
            [ 3, -1, -1,  6,  1, -1],
            [-1,  2, -1,  7,  0, -1],
            [-1,  5,  0, -1, -1,  7],
            [ 4, -1,  1, -1,  6, -1],
            [ 7, -1,  2, -1,  5, -1],
            [-1,  6,  3, -1,  4, -1]
        ];

        var meshData = ShapeCreator.createBox(opt.fullSizeX, opt.fullSizeY, opt.fullSizeZ);

        var mrc = new MeshRendererComponent();
        var material = Material.createMaterial(ShaderLib.uber);
        material.uniforms.materialAmbient = [Math.random(),Math.random(),Math.random(),0];
        // material.uniforms.materialAmbient = [0, 0, 0, 1];
        material.uniforms.materialDiffuse = [.5,.5,.5,1];
        mrc.materials.push(material);

        var box = EntityUtils.createTypicalEntity( opt.goo.world, meshData, material);
        box.setComponent(mrc);
        box.addToWorld();

        this.entity = window.box = box;

        var pickerMaterial = (function () {
            // var tc = new TextureCreator();
            // var tex = tc.loadTexture2D('0.png');
            var material = window.MMM = Material.createMaterial(ShaderLib.uber);
            // material.setTexture('DIFFUSE_MAP', tex);
            // material.blendState.blending = 'CustomBlending';
            // material.renderQueue = RenderQueue.OVERLAY;
            material.dualTransparency = true;
            return material;
        })();
        
        //make corner pickers
        this._cornerList.forEach(function (a, cidx) {

            var meshData = ShapeCreator.createSphere(8, 8, .32);
            
            var entity = EntityUtils.createTypicalEntity(opt.goo.world, meshData);
            
            box.transformComponent.attachChild(entity.transformComponent);
            entity.meshRendererComponent.materials.push(pickerMaterial);
            // entity.addToWorld();

            that._pickerDict[entity.id] = {
                type: 'corner',
                entity: entity,
                a: a,
                cornerIdxList: [cidx]
            };
        });

        //make edge pickers
        [
            [0, 1], [1, 2], [2, 3], [3, 0],
            [0, 4], [1, 5], [2, 6], [3, 7],
            [4, 5], [5, 6], [6, 7], [7, 4]
        ].forEach(function (ab) {

            var meshData = ShapeCreator.createBox(.23, .23, 3);
            var entity = EntityUtils.createTypicalEntity(opt.goo.world, meshData);

            box.transformComponent.attachChild(entity.transformComponent);
            entity.meshRendererComponent.materials.push(pickerMaterial);
            // entity.addToWorld();

            that._pickerDict[entity.id] = {
                type: 'edge',
                entity: entity,
                ab: ab,
                cornerIdxList: ab
            }
        }); 

        //make surface pickers
        [
            // [0, 1, 2, 3],
            // [4, 5, 6, 7],
            // [7, 6, 2, 3],
            // [4, 7, 3, 0],
            // [5, 1, 0, 4],
            // [6, 5, 1, 2]
        ].forEach(function (abcd) {

            var meshData = ShapeCreator.createQuad();
            var entity = EntityUtils.createTypicalEntity(opt.goo.world, meshData);
            
            box.transformComponent.attachChild(entity.transformComponent);
            entity.meshRendererComponent.materials.push(pickerMaterial);
            // entity.addToWorld();

            that._pickerDict[entity.id] = {
                type: 'surface',
                entity: entity,
                abcd: abcd,
                cornerIdxList: abcd
            }
        }); 

        this._fitPickers();
        this.hidePickers();

        this._pointer3d = EntityUtils.createTypicalEntity(goo.world, ShapeCreator.createQuad(0, 0), material, [0, 0, 0]);
        box.transformComponent.attachChild(this._pointer3d.transformComponent);
        this._pointer3d.addToWorld();

        window._cornerList = this._cornerList
        window._moveCorner = this._moveCorner.bind(this)
    }

    var p = EdiBlock.prototype;

    p.selectPicker = function (pickerEntityId, mdx, mdy, onFinish) {

        $('.greenMarker').remove();
        
        var that = this, picker, center2d, offsetList3d, targetList2d = [], cl = this._cornerList;

        if (!this._pickerDict.hasOwnProperty(pickerEntityId)) {
            return;
        }

        picker = this._pickerDict[pickerEntityId];

        center2d = this._get2d(this._cornerList[picker.cornerIdxList[0]]);
        offsetList3d = this._getTargetPositions(picker.cornerIdxList);

        offsetList3d.concat().forEach(function (offset3d, idx) {

            var offsetList = [], offset;

            picker.cornerIdxList.forEach(function (cidx) {

                var cOri = that._get2d(cl[cidx]),
                    cOff = that._get2d([
                        cl[cidx][0] + offset3d[0],
                        cl[cidx][1] + offset3d[1],
                        cl[cidx][2] + offset3d[2]
                    ]);

                    offsetList.push([
                        cOff[0] - cOri[0],
                        cOff[1] - cOri[1]
                    ]);
            });

            offset = offsetList.reduce(function (off, curr) {
                curr[0] += off[0];
                curr[1] += off[1];
                return curr;
            }, [0, 0]);

            if (diff(0, 0, offset[0], offset[1]) < 12) {

                offsetList3d.splice(targetList2d.length, 1);
            }
            else {
                offset[0] = mdx + (offset[0] / picker.cornerIdxList.length);
                offset[1] = mdy + (offset[1] / picker.cornerIdxList.length);
                
                targetList2d.push(offset);
            }

            // var deMarker = document.createElement('div');
            // deMarker.style.width = '3px';
            // deMarker.style.height = '3px';
            // deMarker.style.left = offset[0]+'px';
            // deMarker.style.top = offset[1]+'px';
            // deMarker.style.position = 'absolute';
            // deMarker.style.backgroundColor = '#82f';
            // $(deMarker).addClass('greenMarker gm'+idx);
            // document.body.appendChild(deMarker);
        });

        goo.renderer.domElement.addEventListener('mousemove', movePicker);
        window.addEventListener('mouseup', moveEnd);

        return true;

        //------------------------------------------------------------------------------------------

        function movePicker(e) {

            var mx = e.clientX, 
                my = e.clientY,
                dc = diff(mdx, mdy, mx, my),
                mRad = Math.atan2(my-mdy, mx-mdx),
                tragetRadDiff, targetIdx, target2d;

            targetList2d.forEach(function (p, idx) {

                var rad = Math.atan2(p[1]-mdy, p[0]-mdx),
                    rd = radDiff(mRad, rad);

                if (targetIdx === undefined || rd < tragetRadDiff) {

                    tragetRadDiff = rd;
                    targetIdx = idx;
                    target2d = p;
                }
            });

            if (diff(target2d[0], target2d[1], mx, my) < dc) {
                moveEnd(true);

                picker.cornerIdxList.forEach(function (cidx) {
                    that._moveCorner(cidx, offsetList3d[targetIdx])
                })

                that.selectPicker(pickerEntityId, target2d[0], target2d[1], onFinish);
            }
        }

        function moveEnd(noCallback) {

            goo.renderer.domElement.removeEventListener('mousemove', movePicker);
            window.removeEventListener('mouseup', moveEnd);

            if (!noCallback) {
                
                if (onFinish) {
                    onFinish();
                }
            }
        }

        function diff(ax, ay, bx, by) {

            var dx = bx - ax, dy = by - ay;

            return Math.abs(Math.sqrt(dx*dx + dy*dy)); 
        }

        function radDiff(r1, r2) {

            return Math.abs(r2 - r1) % Math.PI
        }
    }

    p.showPickers = function () {

        for (var i in this._pickerDict) {
            this._pickerDict[i].entity.addToWorld();
            this.entity.transformComponent.attachChild(this._pickerDict[i].entity.transformComponent);
            this._pickerDict[i].entity.transformComponent.setUpdated(false)
        }
    }
    
    p.hidePickers = function () {

        for (var i in this._pickerDict) {
            this._pickerDict[i].entity.removeFromWorld();
        }
    }

    p.getCornerList = function () {

        return  this._cornerList; 
    }
      
    p._moveCorner = function(cidx, v, noHistory) {

        if (!noHistory) {
            this.opt.saveHistory({
                undo: [this._moveCorner, this, cidx, v.map(function (n) {return -n}), true],
                redo: [this._moveCorner, this, cidx, v, true],
            });
        }

        this._cornerList[cidx][0] += v[0];
        this._cornerList[cidx][1] += v[1];
        this._cornerList[cidx][2] += v[2];

        this.refreshModel([cidx]);
    };

    p.refreshModel = function (changedCorners) {

        changedCorners = changedCorners || [0, 1, 2, 3, 4, 5, 6, 7];

        var that = this, position = this.entity.meshDataComponent.meshData.dataViews.POSITION;

        changedCorners.forEach(function (cidx) {

            setVertex(that._cornerList[cidx], that._ci2vp[cidx][0] * 3);
            setVertex(that._cornerList[cidx], that._ci2vp[cidx][1] * 3);
            setVertex(that._cornerList[cidx], that._ci2vp[cidx][2] * 3);
        });
        
        this.entity.meshDataComponent.meshData.vertexData._dataNeedsRefresh = true;

        this._fitPickers();

        function setVertex (corner, p) {

            position[p]   = (corner[0] - that.opt.divX/2) * that.opt.sizeX;
            position[p+1] = (corner[1] - that.opt.divY/2) * that.opt.sizeY;
            position[p+2] = (corner[2] - that.opt.divZ/2) * that.opt.sizeZ;
        }
    }

    p._fitPickers = function () {

        var that = this, cl = that._cornerList;

        _.each(this._pickerDict, function (picker, id) {
            
            var ax, ay, az, bx, by, bz, dx, dy, dz, va, vb, fx, fy, fz, meshData;

            switch (picker.type) {

                case 'corner':
                    picker.entity.transformComponent.setTranslation(
                        (picker.a[0] - that.opt.divX/2) * that.opt.sizeX, 
                        (picker.a[1] - that.opt.divY/2) * that.opt.sizeY, 
                        (picker.a[2] - that.opt.divZ/2) * that.opt.sizeZ);
                    break;

                case 'edge':
                    ax = (cl[picker.ab[0]][0] - that.opt.divX/2) * that.opt.sizeX;
                    ay = (cl[picker.ab[0]][1] - that.opt.divY/2) * that.opt.sizeY;
                    az = (cl[picker.ab[0]][2] - that.opt.divZ/2) * that.opt.sizeZ;
                    bx = (cl[picker.ab[1]][0] - that.opt.divX/2) * that.opt.sizeX;
                    by = (cl[picker.ab[1]][1] - that.opt.divY/2) * that.opt.sizeY;
                    bz = (cl[picker.ab[1]][2] - that.opt.divZ/2) * that.opt.sizeZ;
                    dx = bx - ax;
                    dy = by - ay;
                    dz = bz - az;
                    va = new Vector3([ax, ay, az]);
                    vb = new Vector3([bx, by, bz]);
                
                    picker.entity.transformComponent.setTranslation(
                        ax + dx / 2, 
                        ay + dy / 2, 
                        az + dz / 2);

                    picker.entity.transformComponent.setScale(1, 1, va.distance(vb)*.33);
                    picker.entity.transformComponent.lookAt(va, Vector3.UNIT_X);
                    break;

                case 'surface':
                    meshData = picker.entity.meshDataComponent.meshData;

                    fx = cl[picker.abcd[0]][0] === cl[picker.abcd[2]][0];
                    fy = cl[picker.abcd[0]][1] === cl[picker.abcd[2]][1];
                    fz = cl[picker.abcd[0]][2] === cl[picker.abcd[2]][2];

                    setVertex(0, cl[picker.abcd[0]], meshData, fx, fy, fz);
                    setVertex(3, cl[picker.abcd[1]], meshData, fx, fy, fz);
                    setVertex(6, cl[picker.abcd[2]], meshData, fx, fy, fz);
                    setVertex(9, cl[picker.abcd[3]], meshData, fx, fy, fz);
                    meshData.vertexData._dataNeedsRefresh = true;
                    break;
            }

        });

        function setVertex (p, corner, meshData, fx, fy, fz) {

            meshData.dataViews.POSITION[p]   = (corner[0] - that.opt.divX/2) * that.opt.sizeX * (fx ? 1.01 : .83);
            meshData.dataViews.POSITION[p+1] = (corner[1] - that.opt.divY/2) * that.opt.sizeY * (fy ? 1.01 : .83);
            meshData.dataViews.POSITION[p+2] = (corner[2] - that.opt.divZ/2) * that.opt.sizeZ * (fz ? 1.01 : .83);
        };
    }

    p._debugCorner = function (p) {
        var position = this.entity.meshDataComponent.meshData.dataViews.POSITION;
        var basePos = [position[p],position[p+1], position[p+2]];
        var diff = 0;
        var s = .34;
        var that = this;
        setInterval(function () {
            diff += .112;
            position[p]   = basePos[0] + Math.sin(diff)*s; 
            position[p+1] = basePos[1] + Math.sin(diff)*s; 
            position[p+2] = basePos[2] + Math.sin(diff)*s;
            that.entity.meshDataComponent.meshData.vertexData._dataNeedsRefresh = true; 
        }, 33);

        // box.meshDataComponent.meshData.dataViews.POSITION[3] = 2
        // box.meshDataComponent.meshData.vertexData._dataNeedsRefresh = true;
    };

    p._getTargetPositions = function (cidxList) {

        var that = this, ret = [], freeMoveList = [], cl = this._cornerList;

        cidxList.forEach(function (cidx) {

            var corner = cl[cidx], n = that._neighbors[cidx], fm = [];
            
            if (corner[0] > 0              && !hit(cidx, n[0] )) fm[0] = 1;
            if (corner[0] < that.opt.divX  && !hit(cidx, n[1] )) fm[1] = 1;
            if (corner[1] > 0              && !hit(cidx, n[2] )) fm[2] = 1;
            if (corner[1] < that.opt.divY  && !hit(cidx, n[3] )) fm[3] = 1;
            if (corner[2] > 0              && !hit(cidx, n[4] )) fm[4] = 1;
            if (corner[2] < that.opt.divZ  && !hit(cidx, n[5] )) fm[5] = 1;

            freeMoveList.push(fm)
        });

        add(0, -1,  0,  0);
        add(1,  1,  0,  0);
        add(2,  0, -1,  0);
        add(3,  0,  1,  0);
        add(4,  0,  0, -1);
        add(5,  0,  0,  1);

        return ret;

        function hit(aCidx, bCidx) {

            return bCidx !== -1 &&
                ( cl[aCidx][0] === cl[bCidx][0] && 
                   cl[aCidx][1] === cl[bCidx][1] && 
                   cl[aCidx][2] === cl[bCidx][2]);
        }

        function add(wid, x, y, z) {

            for (var i = 0; i < freeMoveList.length; ++i) {
                if(freeMoveList[i][wid] !== 1) {
                    return;
                } 
            }

            ret.push([x, y, z])
        }
    }

    // p._getTargetPositions = function (id) {

    //     var ret = [], corner = this._cornerList[id];
    //     if (corner[0] > 0)             add(-1, 0, 0);
    //     if (corner[0] < this.opt.divX) add(1, 0, 0);
    //     if (corner[1] > 0)             add(0, -1, 0);
    //     if (corner[1] < this.opt.divY) add(0, 1, 0);
    //     if (corner[2] > 0)             add(0, 0, -1);
    //     if (corner[2] < this.opt.divZ) add(0, 0, 1);

    //     return ret;

    //     function add(x, y, z) {

    //         ret.push([corner[0] + x, corner[1] + y, corner[2] + z])
    //     }
    // }

    p._get2d = function (v) {

        this._pointer3d.transformComponent.setTranslation(
            (v[0] - this.opt.divX/2) * this.opt.sizeX,
            (v[1] - this.opt.divY/2) * this.opt.sizeY,
            (v[2] - this.opt.divZ/2) * this.opt.sizeZ);
        
        this.opt.goo.world.process();

        var pos = camera.getScreenCoordinates(
            this._pointer3d.transformComponent.worldTransform.translation,
            this.opt.goo.renderer.viewportWidth, 
            this.opt.goo.renderer.viewportHeight);

        // this.deMarker.style.left = pos.x + 'px';
        // this.deMarker.style.top = (this.opt.goo.renderer.viewportHeight - pos.y) + 'px';

        return [pos.x, this.opt.goo.renderer.viewportHeight - pos.y];
    };

    return EdiBlock;
});