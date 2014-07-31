var blueprint = module.exports = {};

blueprint.generate = function(model, side, name) {

  // return {"name":"front","divX":3,"divY":3,"continuous":[[0,0,0,3],[0,3,3,3],[3,3,3,0],[3,0,0,0],[0,1,3,1]],"dashed":[]};


    glog.clear();//debug

    var oMap, i, j, eMap = [], lineList = [], dashedList = [], ret,
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
        ];

    model = blueprint.transformModelToSide(model, side);
    oMap = model.geometry;
    oMap.div = model.div;
    oMap.boxDiv = model.boxDiv;


    ret = {
        name: name || 'test',
        divX: oMap.div.x * oMap.boxDiv.x,
        divY: oMap.div.y * oMap.boxDiv.y,
        continuous: [],
        dashed: []
    }

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
                    pos: [x * oMap.boxDiv.x, y * oMap.boxDiv.y, z * oMap.boxDiv.z],
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
                                        var azVal0 = aLp3d[0][2] + (az * oMap.boxDiv.z),
                                            azVal1 = aLp3d[1][2] + (az * oMap.boxDiv.z),
                                            bzVal0 = bLp3d[0][2] + (bz * oMap.boxDiv.z),
                                            bzVal1 = bLp3d[1][2] + (bz * oMap.boxDiv.z);

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


                var matches = [prepareMatch(aBlock, aLine3d, aLine3d.partList[ai])];

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

                                matches.push(prepareMatch(bBlock, bLine3d, bLine3d.partList[bi]));
                            }
                        }
                    });
                });
var sml = matches.length//debug

                //merge matches on the same blocks
                for (var i = 0; i < matches.length; ++i) {
                    for (var j = 0; j < matches.length; ++j) {

                        if (i === j) {
                            continue;
                        }

                        if (matches[i].block === matches[j].block) {//on the same cube

                            var im = matches[i],
                                jm = matches.splice(j--, 1)[0];

                            jm.clear();

                            if (im.oLineA === jm.line) {

                                im.oLineA = im.line === jm.oLineA ? jm.oLineB : jm.oLineA;
                            }
                            else if (im.oLineB === jm.line) {
                                im.oLineB = im.line === jm.oLineA ? jm.oLineB : jm.oLineA;
                            }
                            else {//debug
                                throw Error()//debug
                            }
                        }
                    }

                    //merge the matches on different blocks
                    for (var k = 0; k < matches.length; ++k) {

                        mergeMatches(matches[k], 'oLineA', matches);
                    }

                    for (var l = 0; l < matches.length; ++l) {

                        mergeMatches(matches[l], 'oLineB', matches);
                    }
                }
if (sml === 4) console.log('x', matches)
                if (matches.length === 1) {

                    m = matches[0];

                    if (sml === 4) {

                        console.log(m)
                        glog.line3d(m.lp, 'rgba(23, 45, 234, .43)', 1, m.block.pos);//debug
                        glog.line3d(m.oLineA, 'rgba(23, 245, 34, .43)', 1, m.block.pos);//debug
                        glog.line3d(m.oLineB, 'rgba(234, 45, 4, .43)', 1, m.block.pos);//debug
                    }
                    if (isPointsInTheSamePlane(m.lp[0], m.oLineA[0], m.lp[1], m.oLineB[0]) ||
                        isPointsInTheSamePlane(m.lp[0], m.oLineA[0], m.lp[1], m.oLineB[1]) ||
                        isPointsInTheSamePlane(m.lp[0], m.oLineA[1], m.lp[1], m.oLineB[0]) ||
                        isPointsInTheSamePlane(m.lp[0], m.oLineA[1], m.lp[1], m.oLineB[1]))
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
                line: line,
                block: block,
                oLineA: oLines[0],
                oLineB: oLines[1],
                clear: function () {

                    glog.line3d(lp, 'rgba(23, 45, 234, .43)', 1, block.pos)

                    var idx = line.partList.indexOf(lp);

                    if (idx !== -1) {
                        line.partList.splice(idx, 1);
                    }
                }
            };
        }

        function mergeMatches(m0, m0oLineName, matches) {

            var neighbourMatch,
                commonSideIndex,
                nextOLineName;

            if (getNeighbour()) {

                neighbourMatch.clear();
                matches.splice(matches.indexOf(neighbourMatch), 1);

                mergeMatches(neighbourMatch, nextOLineName, matches);

                m0[m0oLineName] = translateLine(neighbourMatch[nextOLineName], neighbourMatch.block, m0.block);
            }

            function getNeighbour() {

                for (var i = 0; i < matches.length; ++i) {

                    var neighbourSides, m1 = matches[i];

                    if (m0 === m1) {

                        continue;
                    }

                    neighbourSides = [
                        Math.abs(m0.block.coords[0] - m1.block.coords[0]),
                        Math.abs(m0.block.coords[1] - m1.block.coords[1]),
                        Math.abs(m0.block.coords[2] - m1.block.coords[2])
                    ];

                    if (neighbourSides.reduce(function (a, b) {return a + b}) === 1) {
                        //cubes are next to each other
                        neighbourMatch = m1;
                        commonSideIndex = neighbourSides.indexOf(1);

                        if (getNextOppositeLine()) {

                            return true;
                        }
                    }
                }
            }

            function getNextOppositeLine() {

                var cs = commonSideIndex,
                    m1 = neighbourMatch,
                    m0oLine = m0[m0oLineName],
                    b0 = m0.block.pos[cs],
                    b1 = m1.block.pos[cs],
                    l0 = [m0oLine[0][cs] + b0, m0oLine[1][cs] + b0],
                    l1a = [m1.oLineA[0][cs] + b1, m1.oLineA[1][cs] + b1],
                    l1b = [m1.oLineB[0][cs] + b1, m1.oLineB[1][cs] + b1];

                l0 = l0[0] === l0[1] ? l0[0] : false; //check whether the line is on the common side
                l1a = l1a[0] === l1a[1] ? l1a[0] : false;
                l1b = l1b[0] === l1b[1] ? l1b[0] : false;

                if (l0 !== false) {

                    if (l0 === l1a) {

                        nextOLineName = 'oLineB';
                        return true;
                    }

                    if (l0 === l1b) {

                        nextOLineName = 'oLineA';
                        return true;
                    }
                }
            }
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

        function translateLine(aLine, aBlock, bBlock) {

            var offX = aBlock.pos[0] - bBlock.pos[0],
                offY = aBlock.pos[1] - bBlock.pos[1],
                offZ = aBlock.pos[2] - bBlock.pos[2];


            return [
                [aLine[0][0] + offX, aLine[0][1] + offY, aLine[0][2] + offZ],
                [aLine[1][0] + offX, aLine[1][1] + offY, aLine[1][2] + offZ]
            ];
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
                                        var azVal0 = aLp3d[0][2] + (az * oMap.boxDiv.z),
                                            azVal1 = aLp3d[1][2] + (az * oMap.boxDiv.z),
                                            bzVal0 = bLp3d[0][2] + (bz * oMap.boxDiv.z),
                                            bzVal1 = bLp3d[1][2] + (bz * oMap.boxDiv.z);

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

                        for (var bz = az; bz < oMap.div.z; ++bz) {

                            var zOffA = az * oMap.boxDiv.z,
                                zOffB = bz * oMap.boxDiv.z;

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
                                lp3d[0][0] + (dx * a) + (oMap.boxDiv.x * x),
                                lp3d[0][1] + (dy * a) + (oMap.boxDiv.y * y),
                                lp3d[0][0] + (dx * b) + (oMap.boxDiv.x * x),
                                lp3d[0][1] + (dy * b) + (oMap.boxDiv.y * y)
                            ];

                            line[1] = (oMap.boxDiv.y * oMap.div.y) - line[1];
                            line[3] = (oMap.boxDiv.y * oMap.div.y) - line[3];

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
            offset = oMap.boxDiv[['x', 'y', 'z'][direction]];

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


                            if (matching2dLines(aPart, bPart))
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
};













blueprint.render = function(wire, w, h) {

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
      return (parseInt(lp) + 0.5);
  }

  ctx.stroke();

  var $name = $('<div>')
    .css({
      position: 'absolute',
      fontFamily: '"Helvetica Neue", Helvetica, Helvetica, Arial, sans-serif',
      fontWeight: 700,
      fontSize: '32px',
      color: '#fff',
      textAlign: 'center',
      opacity: 1,
      left: 15,
      top: 12,
      // backgroundColor: 'rgba(0, 0, 0, .43)'
    })
    .text(wire.name)
    .addClass('name');

  var $cont = $('<div>')
    .css({
      position: 'relative',
      width: w,
      height: h
    })
    .addClass('wire')
    .append(c, $name);

  $cont.width = w;
  $cont.height = h;

  return $cont.get(0);
}




blueprint.match = function (bp0, bp1) {

    var clone0 = cloneBp(bp0),
        clone1 = cloneBp(bp1);

    removeMatchings(clone0.continuous, clone1.continuous);
    removeMatchings(clone0.dashed, clone1.dashed);

    return (clone0.dashed.length === 0 && clone1.dashed.length === 0 &&
        clone0.continuous.length === 0 && clone1.continuous.length === 0);



    function removeMatchings(a, b) {

        for (var ia = 0; ia < a.length; ++ia) {

            for (var ib = 0; ib < b.length; ++ib) {

                if (matching2dLines(a[ia], b[ib])) {
                    a.splice(ia, 1);
                    a.splice(ib, 1);
                }
            }
        };
    }


    function cloneBp (bp) {

        return {
            continuous: bp.continuous.split().map(function (a) {return a.split()}),
            dashed: bp.dashed.split().map(function (a) {return a.split()})
        }
    }
}






blueprint.print = function (opt) {//opt:{model, side, name, width}

    _.extend(opt, {
        width: 300,
        height: 300
    });

    var bp = blueprint.generate(opt.model, opt.side, opt.name),
        sx = opt.width / bp.divX,
        sy = opt.height / bp.divY,
        rw, rh;

    if (sx < sy) {
        rw = opt.width;
        rh = bp.divY * sx;
    }
    else {
        rw = bp.divX * sy;
        rh = opt.height;
    }

    return blueprint.render(bp, rw, rh);
}


blueprint.transformModelToSide = function (m, side) {

    var ways;

    switch (side) {

        case 'top': ways = ['x']; break;
        case 'bottom': ways = ['x', 'x', 'x']; break;
        case 'right': ways = ['y']; break;
        case 'left': ways = ['y', 'y', 'y']; break;
        case 'back': ways = ['x', 'x']; break;
        case 'front': default: ways = [];
    }

    return ways.reduce(blueprint.transformModel, m);
}

blueprint.transformModel = function(m, way) {
    var that = this, tm = {geometry: []}, oBlock, tBlock, x, y, z, cList;

    switch (way) {

        case 'x':
            tm.div = {
                x: m.div.x,
                y: m.div.z,
                z: m.div.y
            }
            tm.boxDiv = {
                x: m.boxDiv.x,
                y: m.boxDiv.z,
                z: m.boxDiv.y
            }
        break;

        case 'y':
            tm.div = {
                x: m.div.z,
                y: m.div.y,
                z: m.div.x
            }
            tm.boxDiv = {
                x: m.boxDiv.z,
                y: m.boxDiv.y,
                z: m.boxDiv.x
            }
        break;

        case 'z':
            tm.div = {
                x: m.div.y,
                y: m.div.x,
                z: m.div.z
            }
            tm.boxDiv = {
                x: m.boxDiv.y,
                y: m.boxDiv.x,
                z: m.boxDiv.z
            }
        break;
    }

    for (x = 0; x < tm.div.x; ++x) {

        tm.geometry.push([]);

        for (y = 0; y < tm.div.y; ++y) {

            tm.geometry[x].push([]);

            for (z = 0; z < tm.div.z; ++z) {

                tm.geometry[x][y].push([[], [], [], [], [], [], [], []]);
            }
        }
    }

    for (x = 0; x < m.div.x; ++x) {

        for (y = 0; y < m.div.y; ++y) {

            for (z = 0; z < m.div.z; ++z) {

                oBlock = m.geometry[x][y][z];

                switch (way) {

                    case 'x':
                    tBlock = tm.geometry[x][z][(tm.div.z-1) - y];
                    copy(tBlock[0], oBlock[4]);
                    copy(tBlock[4], oBlock[7]);
                    copy(tBlock[7], oBlock[3]);
                    copy(tBlock[3], oBlock[0]);
                    copy(tBlock[1], oBlock[5]);
                    copy(tBlock[5], oBlock[6]);
                    copy(tBlock[6], oBlock[2]);
                    copy(tBlock[2], oBlock[1]);
                    break;

                    case 'y':
                    tBlock = tm.geometry[(tm.div.x-1) - z][y][x];
                    copy(tBlock[0], oBlock[3]);
                    copy(tBlock[1], oBlock[0]);
                    copy(tBlock[2], oBlock[1]);
                    copy(tBlock[3], oBlock[2]);
                    copy(tBlock[4], oBlock[7]);
                    copy(tBlock[5], oBlock[4]);
                    copy(tBlock[6], oBlock[5]);
                    copy(tBlock[7], oBlock[6]);
                    break;

                    case 'z':
                    tBlock = tm.geometry[y][(tm.div.y-1) - x][z];
                    copy(tBlock[0], oBlock[3]);
                    copy(tBlock[1], oBlock[0]);
                    copy(tBlock[2], oBlock[1]);
                    copy(tBlock[3], oBlock[2]);
                    copy(tBlock[4], oBlock[7]);
                    copy(tBlock[5], oBlock[4]);
                    copy(tBlock[6], oBlock[5]);
                    copy(tBlock[7], oBlock[6]);
                    break;
                }
            }
        }
    }

    return tm;

    function copy(target, source) {

        switch (way) {

            case 'x':
            target[0] = source[0];
            target[1] = source[2];
            target[2] = m.boxDiv.z - source[1];
            break;

            case 'y':
            target[0] = m.boxDiv.x - source[2];
            target[1] = source[1];
            target[2] = source[0];
            break;

            case 'z':
            target[0] = source[1];
            target[1] = m.boxDiv.y - source[0];
            target[2] = source[2];
            break;
        }
    }
}










blueprint.testSolusion = function (mTest, mReference) {

    var referenceBlueprints = getBlueprints(mReference);

    if (test(mTest, mReference)) return true;
    mTest = this._transformModel(mTest, 'z');
    if (test(mTest, mReference)) return true;
    mTest = this._transformModel(mTest, 'z');
    if (test(mTest, mReference)) return true;
    mTest = this._transformModel(mTest, 'z');
    if (test(mTest, mReference)) return true;
    mTest = this._transformModel(mTest, 'z');

    mTest = this._transformModel(mTest, 'y');
    if (test(mTest, mReference)) return true;
    mTest = this._transformModel(mTest, 'z');
    if (test(mTest, mReference)) return true;
    mTest = this._transformModel(mTest, 'z');
    if (test(mTest, mReference)) return true;
    mTest = this._transformModel(mTest, 'z');
    if (test(mTest, mReference)) return true;
    mTest = this._transformModel(mTest, 'z');

    mTest = this._transformModel(mTest, 'y');
    if (test(mTest, mReference)) return true;
    mTest = this._transformModel(mTest, 'z');
    if (test(mTest, mReference)) return true;
    mTest = this._transformModel(mTest, 'z');
    if (test(mTest, mReference)) return true;
    mTest = this._transformModel(mTest, 'z');
    if (test(mTest, mReference)) return true;
    mTest = this._transformModel(mTest, 'z');

    mTest = this._transformModel(mTest, 'y');
    if (test(mTest, mReference)) return true;
    mTest = this._transformModel(mTest, 'z');
    if (test(mTest, mReference)) return true;
    mTest = this._transformModel(mTest, 'z');
    if (test(mTest, mReference)) return true;
    mTest = this._transformModel(mTest, 'z');
    if (test(mTest, mReference)) return true;
    mTest = this._transformModel(mTest, 'z');

    mTest = this._transformModel(mTest, 'x');
    if (test(mTest, mReference)) return true;
    mTest = this._transformModel(mTest, 'z');
    if (test(mTest, mReference)) return true;
    mTest = this._transformModel(mTest, 'z');
    if (test(mTest, mReference)) return true;
    mTest = this._transformModel(mTest, 'z');
    if (test(mTest, mReference)) return true;
    mTest = this._transformModel(mTest, 'z');

    mTest = this._transformModel(mTest, 'x');
    mTest = this._transformModel(mTest, 'x');
    if (test(mTest, mReference)) return true;
    mTest = this._transformModel(mTest, 'z');
    if (test(mTest, mReference)) return true;
    mTest = this._transformModel(mTest, 'z');
    if (test(mTest, mReference)) return true;
    mTest = this._transformModel(mTest, 'z');
    if (test(mTest, mReference)) return true;

    return false;

    function test(mT, mR) {

        if (mT.div.x !== mR.div.x ||
            mT.div.y !== mR.div.y ||
            mT.div.z !== mR.div.z ||
            mT.boxDiv.x !== mR.boxDiv.x ||
            mT.boxDiv.y !== mR.boxDiv.y ||
            mT.boxDiv.z !== mR.boxDiv.z)
        {
            return false;
        }

        var testBlueprints = getBlueprints(mS);

        for (var i = 0; i < testBlueprints.length; ++i) {

            if (!blueprint.match(testBlueprints[i], referenceBlueprints[i])) {

                return false;
            }
        }

        return true;
    }

    getBlueprints = function (model) {

        var ret = [];

        model.blueprintSides.forEach(function (side) {

            ret.push(blueprint.generate(model, side));
        });

        return ret;
    }
}








///////////////////////////////////////////////////////////////
//utils ///////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////


function mv(v0, v1) { //matchingVertexes

    return v0[0] === v1[0] && v0[1] === v1[1] && v0[2] === v1[2];
}

function matching2dLines(lineA, lineB) {

    return (lineA[0] === lineB[0] &&
            lineA[1] === lineB[1] &&
            lineA[2] === lineB[2] &&
            lineA[3] === lineB[3])
           ||
           (lineA[0] === lineB[2] &&
            lineA[1] === lineB[3] &&
            lineA[2] === lineB[0] &&
            lineA[3] === lineB[1]);
}

function isPointsInTheSamePlane (p0, p1, p2, p3) {

    var a0 = areaOfTriangle(distance3d(p0, p2), distance3d(p2, p3), distance3d(p3, p0))
            + areaOfTriangle(distance3d(p0, p2), distance3d(p2, p1), distance3d(p1, p0)),
        a1 = areaOfTriangle(distance3d(p1, p3), distance3d(p3, p2), distance3d(p2, p1))
            + areaOfTriangle(distance3d(p0, p1), distance3d(p1, p3), distance3d(p3, p0));

    var ret = epsEqu(a0, a1);

    // if (ret) {//debug

    //     glog.line3d([p0, p2], 'random', 1);//debug
    //     glog.line3d([p2, p1], 'random', 1);//debug
    //     glog.line3d([p1, p3], 'random', 1);//debug
    //     glog.line3d([p3, p0], 'random', 1);//debug
    //     1+1;
    // }

    return ret;
}

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

function markHidden(tri, line, triZOff, lineZOff) {

    triZOff = triZOff || 0;
    lineZOff = lineZOff || 0;

    var lis0 = checkLineIntersection(tri[0], tri[1], line[0], line[1]),
        lis1 = checkLineIntersection(tri[1], tri[2], line[0], line[1]),
        lis2 = checkLineIntersection(tri[2], tri[0], line[0], line[1]),
        edgeA = (lis0.onLine0 && lis0) || (lis1.onLine0 && lis1) || (lis2.onLine0 && lis2),
        edgeB = (lis1.onLine0 && lis1 !== edgeA && lis1) || (lis2.onLine0 && lis2 !== edgeA && lis2),
        dashed = [], cpos, oea, oeb, zDiffA, zDiffB;

    if (edgeA && !edgeB) {

        oea = edgeA === lis0 ? lis1 : lis0;
        oeb = edgeA === lis0 || edgeA === lis1 ? lis2 : lis1;

        if (oea.x === oeb.x && oea.y === oeb.y) {

            edgeB = oea;
        }
    }

    if (!edgeB) {
        return;
    }

    edgeA.isPos = posOnLine(line, edgeA.x, edgeA.y);
    edgeB.isPos = posOnLine(line, edgeB.x, edgeB.y);

    if (epsEqu(edgeA.isPos, edgeB.isPos)) {

        return;
    }

    edgeA.isZ0 = zInPoint(edgeA.line0, edgeA.x, edgeA.y) + triZOff;
    edgeA.isZ1 = zInPoint(line, edgeA.x, edgeA.y) + lineZOff;
    edgeB.isZ0 = zInPoint(edgeB.line0, edgeB.x, edgeB.y) + triZOff;
    edgeB.isZ1 = zInPoint(line, edgeB.x, edgeB.y) + lineZOff;

    zDiffA = edgeA.isZ1 - edgeA.isZ0;
    zDiffB = edgeB.isZ1 - edgeB.isZ0;
    edgeA.hide = zDiffA < 0 ? true : (zDiffA > 0 ? false : (zDiffB < 0 ? true :  false));
    edgeB.hide = zDiffB < 0 ? true : (zDiffB > 0 ? false : (zDiffA < 0 ? true :  false));

    if (edgeA.hide && edgeB.hide) {//if the lines vector is intersect the triangle

        dashed.push(edgeA.isPos, edgeB.isPos);
    }
    else if (edgeA.hide !== edgeB.hide) {

        cpos = checkLineIntersection(
            [edgeA.isPos, edgeA.isZ0], [edgeB.isPos, edgeB.isZ0],
            [edgeA.isPos, edgeA.isZ1], [edgeB.isPos, edgeB.isZ1]);

        if (edgeA.hide) {
            dashed.push(edgeA.isPos, cpos.x);
        }
        else {
            dashed.push(cpos.x, edgeA.isPos);
        }
    }
    else {
        return;
    }

    dashed[0] = Math.min(1, Math.max(0, dashed[0]));
    dashed[1] = Math.min(1, Math.max(0, dashed[1]));

    if (dashed[0] === dashed[1]) {

        return;
    }

    return dashed;
}

function posOnLine(line, x, y) {

    var lw = line[1][0] - line[0][0],
        lh = line[1][1] - line[0][1],
        ld = Math.sqrt(lw*lw + lh*lh),
        pw = x - line[0][0],
        ph = y - line[0][1],
        pd = Math.sqrt(pw*pw + ph*ph),
        fw = line[1][0] - x,
        fh = line[1][1] - y,
        fd = Math.sqrt(fw*fw + fh*fh),
        pos = pd / ld;

    return epsEqu(ld + pd, fd) ? -pos : pos;
}

function zInPoint(line, x, y) {

    var zDist = line[1][2] - line[0][2];
    var ret = line[0][2] + posOnLine(line, x, y) * zDist;
    return ret;
}

function checkLineIntersection(line0Start, line0End, line1Start, line1End) {
    // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
    var denominator, a, b, numerator1, numerator2, result = {
        x: null,
        y: null,
        onLine0: false,
        onLine1: false,
        line0: [line0Start, line0End],
        line1: [line1Start, line1End]
    };
    denominator = ((line1End[1] - line1Start[1]) * (line0End[0] - line0Start[0])) - ((line1End[0] - line1Start[0]) * (line0End[1] - line0Start[1]));
    if (denominator == 0) {
        return result;
    }
    a = line0Start[1] - line1Start[1];
    b = line0Start[0] - line1Start[0];
    numerator1 = ((line1End[0] - line1Start[0]) * a) - ((line1End[1] - line1Start[1]) * b);
    numerator2 = ((line0End[0] - line0Start[0]) * a) - ((line0End[1] - line0Start[1]) * b);
    a = numerator1 / denominator;
    b = numerator2 / denominator;

    // if we cast these lines infinitely in both directions, they intersect here:
    result.x = line0Start[0] + (a * (line0End[0] - line0Start[0]));
    result.y = line0Start[1] + (a * (line0End[1] - line0Start[1]));
/*
        // it is worth noting that this should be the same as:
        x = line1Start[0] + (b * (line1End[0] - line1Start[0]));
        y = line1Start[0] + (b * (line1End[1] - line1Start[1]));
        */
    // if line0 is a segment and line1 is infinite, they intersect if:
    if (a > 0 && a < 1) {
        result.onLine0 = true;
    }
    // if line1 is a segment and line0 is infinite, they intersect if:
    if (b > 0 && b < 1) {
        result.onLine1 = true;
    }
    // if line0 and line1 are segments, they intersect if both of the above are true
    return result;
};

var epsEqu = function () { // IIFE, keeps EPSILON private
    var EPSILON = Math.pow(2, -23/*-53*/);
    return function epsEqu(x, y) {
        return Math.abs(x - y) < EPSILON;
    };
}();






var glog = (function () {

    var c = document.createElement('canvas'),
        ctx = c.getContext('2d'), color = '#fff', off = 0, lineWidth = 3;

    c.width = c.height = 500;

    ctx.fillStyle = '#f41';
    ctx.fillRect(0,0,12,12);

    $('<div>')
        .css({
            left: 0,
            top: 0,
            position: 'fixed',
            zIndex: '99999',
            pointerEvents: 'none'
        })
        .append(c)
        .appendTo('body');

    var glog = {

        style: function (_color,  _strokeWidth) {

            if (_color === 'random') {
                _color = '#' + parseInt(0xffffffffffff * Math.random()).toString(16).substr(-6);
            }

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
