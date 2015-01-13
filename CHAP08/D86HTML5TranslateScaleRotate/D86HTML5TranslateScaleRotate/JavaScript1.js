var POLYGON2D = {
    x0: 0, y0: 0,        // position of center of polygon  
    vlist: new Array()
};

var how2use = document.getElementById("how2use");
var text = "<A> and <S> - Scale    <Z> and <X> - Rotate     <Arrows> - Translate";
text = text.replace(/</g, "&lt;");
text = text.replace(/>/g, "&gt;");
how2use.innerHTML = text;

var c = document.getElementById("myCanvas");
var cxt = c.getContext("2d");

var ship_vertices = new Array(
    { x: 1, y: 11 },
    { x: 2, y: 8 },
    { x: 1, y: 7 },
    { x: 1, y: -1 },
    { x: 3, y: -1 },
    { x: 3, y: -2 },
    { x: 11, y: -3 },
    { x: 11, y: -6 },
    { x: 3, y: -7 },
    { x: 2, y: -8 },
    { x: 1, y: -8 },
    { x: 1, y: -7 },
    { x: -1, y: -7 },
    { x: -1, y: -8 },
    { x: -2, y: -8 },
    { x: -3, y: -7 },
    { x: -11, y: -6 },
    { x: -11, y: -3 },
    { x: -3, y: -2 },
    { x: -3, y: -1 },
    { x: -1, y: -1 },
    { x: -1, y: 7 },
    { x: -2, y: 8 },
    { x: -1, y: 11 }
    );
/*
var simpleploy = new Array(
    { x: 10, y: 110 },
    { x: 20, y: 80 },
    { x: 10, y: 70 }
    );
var simplyployObj = {
    x0: 0, y0: 0,        // position of center of polygon  
    vlist: simpleploy
};
*/

var ship = {
    x0: 0, y0: 0,        // position of center of polygon  
    vlist: ship_vertices
};
//Translate_Polygon2D_Mat(ship_vertices, 100, 100);
Translate_Polygon2D_Mat(ship, 100, 100);
Draw_Polygon2D(ship);

var MA = new Array(1, 2);
var MB = new Array(
    new Array(3, 4),
    new Array(5, 6),
    new Array(7, 8)
    );
var MP = new Array(0, 0);

Mat_Mul1X2_3X2(MA, MB, MP);
document.onkeydown = onKeyDown;
document.onkeyup = onKeyUp;
window.setInterval(drawItOnCanvas, 33);
console.log('ok');

function Draw_Polygon2D(poly) {
    cxt.beginPath();
    cxt.moveTo(poly.x0 + poly.vlist[0].x, poly.y0 + poly.vlist[0].y);
    for (var i = 1; i < poly.vlist.length; i++) {
        cxt.lineTo(poly.x0 + poly.vlist[i].x, poly.y0 + poly.vlist[i].y);
    }
    cxt.lineTo(poly.x0 + poly.vlist[0].x, poly.y0 + poly.vlist[0].y);
    cxt.stroke();
}

function Mat_Mul1X2_3X2(ma, mb, mprod) {
    // this function multiplies a 1x2 matrix against a 
    // 3x2 matrix - ma*mb and stores the result
    // using a dummy element for the 3rd element of the 1x2 
    // to make the matrix multiply valid i.e. 1x3 X 3x2

    for (var col = 0; col < 2; col++) {
        // compute dot product from row of ma 
        // and column of mb

        var sum = 0; // used to hold result
        var index = 0;
        for (; index < 2; index++) {
            // add in next product pair
            sum += (ma[index] * mb[index][col]);
        } // end for index

        // add in last element * 1 
        sum += mb[index][col];

        // insert resulting col element
        mprod[col] = sum;

    } // end for col
}

function Mat_Init_3X2(ma,
                    m00, m01,
                    m10, m11,
                    m20, m21) {
    // this function fills a 3x2 matrix with the sent data in row major form
    ma[0][0] = m00; ma[0][1] = m01;
    ma[1][0] = m10; ma[1][1] = m11;
    ma[2][0] = m20; ma[2][1] = m21;
}

// these are the matrix versions, note they are more inefficient for
// single transforms, but their power comes into play when you concatenate
// multiple transformations, not to mention that all transforms are accomplished
// with the same code, just the matrix differs
function Translate_Polygon2D_Mat(poly, dx, dy) {
    // this function translates the center of a polygon by using a matrix multiply
    // on the the center point, this is incredibly inefficient, but for educational purposes
    // if we had an object that wasn't in local coordinates then it would make more sense to
    // use a matrix, but since the origin of the object is at x0,y0 then 2 lines of code can
    // translate, but lets do it the hard way just to see :)

    // test for valid pointer
    if (!poly)
        return (0);

    var mt = new Array(
        new Array(0, 0),
        new Array(0, 0),
        new Array(0, 0)
        );; // used to hold translation transform matrix

    // initialize the matrix with translation values dx dy
    Mat_Init_3X2(mt, 1, 0, 0, 1, dx, dy);

    // create a 1x2 matrix to do the transform
    var p0 = new Array(poly.x0, poly.y0);
    var p1 = new Array(0, 0); // this will hold result

    // now translate via a matrix multiply
    Mat_Mul1X2_3X2(p0, mt, p1);

    // now copy the result back into polygon
    poly.x0 = p1[0];
    poly.y0 = p1[1];

    // return success
    return (1);

} // end Translate_Polygon2D_Mat

function Rotate_Polygon2D_Mat(poly, theta) {
    // this function rotates the local coordinates of the polygon

    // test for valid pointer
    if (!poly)
        return (0);

    // test for negative rotation angle
    if (theta < 0)
        theta += 360;

    var mr = new Array(
        new Array(0, 0),
        new Array(0, 0),
        new Array(0, 0)
        ); // used to hold translation transform matrix

    theta = theta * (Math.PI / 180);

    // initialize the matrix with translation values dx dy
    Mat_Init_3X2(mr, Math.cos(theta), Math.sin(theta),
                     -Math.sin(theta), Math.cos(theta),
                      0, 0);

    // loop and rotate each point, very crude, no lookup!!!
    for (var curr_vert = 0; curr_vert < poly.vlist.length; curr_vert++) {
        // create a 1x2 matrix to do the transform
        var p0 = new Array(poly.vlist[curr_vert].x, poly.vlist[curr_vert].y);
        var p1 = new Array(0, 0); // this will hold result

        // now rotate via a matrix multiply
        Mat_Mul1X2_3X2(p0, mr, p1);

        // now copy the result back into vertex
        poly.vlist[curr_vert].x = p1[0];
        poly.vlist[curr_vert].y = p1[1];

    } // end for curr_vert

    // return success
    return (1);

} // end Rotate_Polygon2D_Mat

function Scale_Polygon2D_Mat(poly, sx, sy) {
    // this function scalesthe local coordinates of the polygon

    // test for valid pointer
    if (!poly)
        return (0);


    var ms = new Array(
        new Array(0, 0),
        new Array(0, 0),
        new Array(0, 0)
        ); // used to hold translation transform matrix


    // initialize the matrix with translation values dx dy
    Mat_Init_3X2(ms, sx, 0,
                     0, sy,
                     0, 0);


    // loop and scale each point
    for (var curr_vert = 0; curr_vert < poly.vlist.length; curr_vert++) {
        // scale and store result back

        // create a 1x2 matrix to do the transform
        var p0 = new Array(poly.vlist[curr_vert].x, poly.vlist[curr_vert].y);
        var p1 = new Array(0, 0); // this will hold result

        // now scale via a matrix multiply
        Mat_Mul1X2_3X2(p0, ms, p1);

        // now copy the result back into vertex
        poly.vlist[curr_vert].x = p1[0];
        poly.vlist[curr_vert].y = p1[1];

    } // end for curr_vert

    // return success
    return (1);

} // end Scale_Polygon2D_Mat


var KEY_LEFT = 37;
var KEY_UP = 38;
var KEY_RIGHT = 39;
var KEY_DOWN = 40;
var KEY_X = 88;
var KEY_Z = 90;
var KEY_A = 65;
var KEY_S = 83;

var KEYDOWN_LEFT = false;
var KEYDOWN_UP = false;
var KEYDOWN_RIGHT = false;
var KEYDOWN_DOWN = false;
var KEYDOWN_Z = false;
var KEYDOWN_X = false;
var KEYDOWN_A = false;
var KEYDOWN_S = false;

function drawItOnCanvas() {
    if (KEYDOWN_LEFT)
        Translate_Polygon2D_Mat(ship, -5, 0);

    if (KEYDOWN_UP)
        Translate_Polygon2D_Mat(ship, 0, -5);

    if (KEYDOWN_RIGHT)
        Translate_Polygon2D_Mat(ship, 5, 0);

    if (KEYDOWN_DOWN)
        Translate_Polygon2D_Mat(ship, 0, 5);

    ///////////////////////////

    if (KEYDOWN_Z)
        Rotate_Polygon2D_Mat(ship, -5);

    if (KEYDOWN_X)
        Rotate_Polygon2D_Mat(ship, 5);

    ////////////////////////

    if (KEYDOWN_A)
        Scale_Polygon2D_Mat(ship, 1.1, 1.1);

    if (KEYDOWN_S)
        Scale_Polygon2D_Mat(ship, 0.9, 0.9);

    cxt.clearRect(0, 0, 800, 500);
    Draw_Polygon2D(ship);

    var xValue = document.getElementById("xValue");
    xValue.innerHTML = ship.x0;
    var yValue = document.getElementById("yValue");
    yValue.innerHTML = ship.y0;
}

function onKeyDown(e) {
    e = e || event;
    console.log(e.keyCode);
    switch (e.keyCode) {
        case KEY_LEFT:
            KEYDOWN_LEFT = true;
            break;
        case KEY_UP:
            KEYDOWN_UP = true;
            break;
        case KEY_RIGHT:
            KEYDOWN_RIGHT = true;
            break;
        case KEY_DOWN:
            KEYDOWN_DOWN = true;
            break;
        case KEY_X:
            KEYDOWN_X = true;
            break;
        case KEY_Z:
            KEYDOWN_Z = true;
            break;
        case KEY_A:
            KEYDOWN_A = true;
            break;
        case KEY_S:
            KEYDOWN_S = true;
            break;
    }
}

function onKeyUp(e) {
    e = e || event;
    console.log(e.keyCode);
    switch (e.keyCode) {
        case KEY_LEFT:
            KEYDOWN_LEFT = false;
            break;
        case KEY_UP:
            KEYDOWN_UP = false;
            break;
        case KEY_RIGHT:
            KEYDOWN_RIGHT = false;
            break;
        case KEY_DOWN:
            KEYDOWN_DOWN = false;
            break;
        case KEY_X:
            KEYDOWN_X = false;
            break;
        case KEY_Z:
            KEYDOWN_Z = false;
            break;
        case KEY_A:
            KEYDOWN_A = false;
            break;
        case KEY_S:
            KEYDOWN_S = false;
            break;
    }
}
