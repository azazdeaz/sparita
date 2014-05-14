define(function () {
//;
    var LevelList = [
        '{"editorOpt":{"blockSizeX":2,"blockSizeY":2,"blockSizeZ":2,"blockDivX":3,"blockDivY":3,"blockDivZ":3,"divX":1,"divY":1,"divZ":1},"solusion":[[[[[0,0,0],[3,0,0],[3,0,3],[0,0,3],[0,3,0],[3,3,0],[3,2,2],[0,2,2]]]]],"wireList":[{"name":"front","divX":3,"divY":3,"continuous":[[0,0,0,3],[0,3,3,3],[3,3,3,0],[3,0,0,0],[0,1,3,1]],"dashed":[]},{"name":"right","divX":3,"divY":3,"continuous":[[1,1,3,0],[3,0,3,3],[3,3,0,3],[0,3,1,1]],"dashed":[]}]}',
        '{"editorOpt":{"blockSizeX":2,"blockSizeY":2,"blockSizeZ":2,"blockDivX":3,"blockDivY":3,"blockDivZ":3,"divX":1,"divY":1,"divZ":1},"solusion":[[[[[0,0,0],[3,0,0],[3,0,3],[0,0,3],[1,3,1],[2,3,1],[2,3,2],[1,3,2]]]]],"wireList":[{"name":"top","divX":3,"divY":3,"continuous":[[0,0,0,3],[0,3,3,3],[3,3,3,0],[3,0,0,0],[1,1,1,2],[1,2,2,2],[2,2,2,1],[2,1,1,1],[1,1,0,0],[1,2,0,3],[2,2,3,3],[2,1,3,0]],"dashed":[]},{"name":"front","divX":3,"divY":3,"continuous":[[1,0,2,0],[2,0,3,3],[3,3,0,3],[0,3,1,0]],"dashed":[]}]}',
        '{"editorOpt":{"blockSizeX":2,"blockSizeY":2,"blockSizeZ":2,"blockDivX":3,"blockDivY":3,"blockDivZ":3,"divX":1,"divY":1,"divZ":1},"solusion":[[[[[0,0,1],[3,0,1],[3,1,3],[0,1,3],[0,2,0],[3,2,0],[3,3,2],[0,3,2]]]]],"wireList":[{"name":"front","divX":3,"divY":3,"continuous":[[0,0,3,0],[3,0,3,3],[3,3,0,3],[0,3,0,0],[2,3,2,0]],"dashed":[[1,3,1,0]]},{"name":"right","divX":3,"divY":3,"continuous":[[1,0,3,1],[3,1,2,3],[2,3,0,2],[0,2,1,0]],"dashed":[]}]}',
        '{"editorOpt":{"blockSizeX":1,"blockSizeY":1,"blockSizeZ":1,"blockDivX":3,"blockDivY":3,"blockDivZ":3,"divX":2,"divY":1,"divZ":1},"solusion":[[[[[1,0,0],[3,0,0],[2,0,3],[0,0,3],[1,3,0],[3,3,0],[2,3,3],[0,3,3]]]],[[[[0,0,0],[2,0,0],[3,0,3],[1,0,3],[0,3,0],[2,3,0],[3,3,3],[1,3,3]]]]],"wireList":[{"name":"front","divX":6,"divY":3,"continuous":[[0,0,6,0],[6,0,6,3],[6,3,0,3],[0,3,0,0],[3,0,3,3],[2,0,2,3],[4,0,4,3]],"dashed":[[1,0,1,3],[5,0,5,3]]},{"name":"right","divX":3,"divY":3,"continuous":[[0,0,3,0],[3,0,3,3],[3,3,0,3],[0,3,0,0]],"dashed":[]}]}',
        '{"editorOpt":{"blockSizeX":2,"blockSizeY":2,"blockSizeZ":2,"blockDivX":3,"blockDivY":3,"blockDivZ":3,"divX":1,"divY":1,"divZ":1},"solusion":[[[[[0,0,0],[3,1,0],[3,2,3],[0,1,3],[0,3,0],[3,3,0],[3,2,3],[0,2,3]]]]],"wireList":[{"name":"front","divX":3,"divY":3,"continuous":[[0,0,3,0],[3,0,3,2],[3,2,0,3],[0,3,0,0],[0,1,3,1],[3,1,0,2],[0,2,0,1]],"dashed":[]},{"name":"right","divX":3,"divY":3,"continuous":[[0,1,0,2],[3,0,3,3],[0,1,3,0],[0,1,3,2],[0,2,3,3]],"dashed":[]}]}',
        '{"editorOpt":{"blockSizeX":2,"blockSizeY":2,"blockSizeZ":2,"blockDivX":3,"blockDivY":3,"blockDivZ":3,"divX":1,"divY":1,"divZ":1},"solusion":[[[[[0,0,0],[2,0,0],[3,0,3],[1,0,3],[1,3,0],[3,3,0],[2,3,3],[0,3,3]]]]],"wireList":[{"name":"front","divX":3,"divY":3,"continuous":[[0,0,3,0],[2,0,3,3],[3,3,0,3],[1,3,0,0],[0.5,1.5,0,3],[3,0,2.5,1.5]],"dashed":[[1,0,0.5,1.5],[2.5,1.5,2,3]]}]}',
        '{"editorOpt":{"blockSizeX":1,"blockSizeY":1,"blockSizeZ":1,"blockDivX":3,"blockDivY":3,"blockDivZ":3,"divX":2,"divY":2,"divZ":2},"solusion":[[[[[0,0,0],[3,0,0],[3,0,3],[0,0,3],[0,3,0],[3,3,0],[3,3,3],[0,3,3]],[[1,1,0],[3,0,0],[3,0,3],[1,1,3],[0,3,0],[3,3,0],[3,3,3],[0,3,3]]],[[[0,0,0],[3,0,0],[3,0,3],[0,0,3],[0,3,0],[3,3,0],[3,3,3],[0,3,3]],[[0,0,0],[3,0,0],[3,0,3],[0,0,3],[0,3,0],[3,3,0],[3,3,3],[0,3,3]]]],[[[[0,0,0],[3,0,0],[3,0,3],[0,0,3],[0,3,0],[3,3,0],[3,3,3],[0,3,3]],[[0,0,0],[3,0,0],[3,0,3],[0,0,3],[0,3,0],[3,3,0],[3,3,3],[0,3,3]]],[[[0,0,0],[3,0,0],[3,0,3],[0,0,3],[0,3,0],[2,2,0],[2,2,3],[0,3,3]],[[0,0,0],[3,0,0],[3,0,3],[0,0,3],[0,3,0],[3,3,0],[3,3,3],[0,3,3]]]]],"wireList":[{"name":"front","divX":6,"divY":6,"continuous":[[0,0,0,6],[0,6,6,6],[6,6,6,0],[6,0,0,0],[0,3,1,5],[1,5,3,6]],"dashed":[[3,0,5,1],[5,1,6,3]]},{"name":"left","divX":6,"divY":6,"continuous":[[0,0,0,6],[0,6,6,6],[6,6,6,0],[6,0,0,0],[3,1,6,1],[3,0,3,3],[3,3,6,3]],"dashed":[[0,5,3,5],[0,3,3,3],[3,3,3,6]]}]}',
        '{"editorOpt":{"blockSizeX":1,"blockSizeY":1,"blockSizeZ":1,"blockDivX":3,"blockDivY":3,"blockDivZ":3,"divX":2,"divY":2,"divZ":2},"solusion":[[[[[0,0,0],[2,0,0],[3,0,3],[0,0,3],[0,3,0],[3,3,0],[3,3,3],[0,3,3]],[[0,0,0],[3,0,0],[2,0,3],[0,0,3],[0,3,0],[3,3,0],[3,3,3],[0,3,3]]],[[[0,0,0],[3,0,0],[3,0,3],[0,1,3],[0,3,0],[3,3,0],[3,3,3],[0,3,3]],[[0,1,0],[3,0,0],[3,0,3],[0,0,3],[0,3,0],[3,3,0],[3,3,3],[0,3,3]]]],[[[[1,0,0],[3,0,0],[3,0,3],[0,0,3],[0,3,0],[3,3,0],[3,3,3],[0,3,3]],[[0,0,0],[3,0,0],[3,0,3],[1,0,3],[0,3,0],[3,3,0],[3,3,3],[0,3,3]]],[[[0,0,0],[3,0,0],[3,1,3],[0,0,3],[0,3,0],[3,3,0],[3,3,3],[0,3,3]],[[0,0,0],[3,1,0],[3,0,3],[0,0,3],[0,3,0],[3,3,0],[3,3,3],[0,3,3]]]]],"wireList":[{"name":"top","divX":6,"divY":6,"continuous":[[0,0,0,6],[0,6,6,6],[6,6,6,0],[6,0,0,0]],"dashed":[[0,0,3,3],[0,6,3,3],[2,0,3,3],[4,0,3,3],[6,0,3,3],[6,6,3,3],[2,6,3,3],[4,6,3,3]]},{"name":"front","divX":6,"divY":6,"continuous":[[0,0,0,6],[0,6,6,6],[6,6,6,0],[6,0,0,0],[2,6,3,3],[4,6,3,3]],"dashed":[[0,2,3,3],[0,3,3,3],[6,2,3,3],[6,3,3,3]]}]}',
    ];

    LevelList.isSolved = function (levelNo) {

        if (window.localStorage) {

            var solved = window.localStorage['LevelList.solved'];

            if (solved) {
                solved = JSON.parse(solved);
                return solved.indexOf(levelNo) !== -1;
            }
            else {
                return false;
            }
        }
        else {
            return false;
        }
    }

    LevelList.setSolved = function (levelNo) {

        if (window.localStorage) {

            var solved = window.localStorage['LevelList.solved'];

            if (solved) {
                solved = JSON.parse(solved);
                solved.push(levelNo);
            }
            else {
                solved = [levelNo];
            }

            window.localStorage['LevelList.solved'] = JSON.stringify(solved);
        }
    }

    return LevelList;
});