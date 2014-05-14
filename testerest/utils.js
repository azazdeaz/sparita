function removeVisibles() {
    
    surfaces.forEach(function (surface) {

        otherLines.forEach(function () {

            
        });
    });
}

function markHidden(tri, line) {

    var lis0 = checkLineIntersection(tri[0], tri[1], line[0], line[1]),
        lis1 = checkLineIntersection(tri[1], tri[2], line[0], line[1]),
        lis2 = checkLineIntersection(tri[2], tri[0], line[0], line[1]),
        edgeA = (lis0.onLine0 && lis0) || (lis1.onLine0 && lis1) || (lis2.onLine0 && lis2), 
        edgeB = (lis1.onLine0 && lis1 !== edgeA && lis1) || (lis2.onLine0 && lis2 !== edgeA && lis2),
        dashed = [], cpos, oea, oeb;

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

    edgeA.isZ0 = zInPoint(edgeA.line0, edgeA.x, edgeA.y);
    edgeA.isZ1 = zInPoint(line, edgeA.x, edgeA.y);
    edgeB.isZ0 = zInPoint(edgeB.line0, edgeB.x, edgeB.y);
    edgeB.isZ1 = zInPoint(line, edgeB.x, edgeB.y);

    edgeA.hide = edgeA.isZ1 <= edgeA.isZ0;
    edgeB.hide = edgeB.isZ1 <= edgeB.isZ0;

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
    var EPSILON = Math.pow(2, -53);
    return function epsEqu(x, y) {
        return Math.abs(x - y) < EPSILON;
    };
}();