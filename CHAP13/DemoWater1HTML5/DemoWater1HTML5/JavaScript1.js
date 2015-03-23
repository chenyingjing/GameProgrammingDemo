var SCREEN_WIDTH = 800;
var SCREEN_HEIGHT = 600;

var PARTICLE_TYPE_FLICKER = 0;
var PARTICLE_TYPE_FADE = 1;

// color of particle
var PARTICLE_COLOR_RED = 0;
var PARTICLE_COLOR_GREEN = 1;
var PARTICLE_COLOR_BLUE = 2;
var PARTICLE_COLOR_WHITE = 3;

// defines for particle system
var PARTICLE_STATE_DEAD = 0;
var PARTICLE_STATE_ALIVE = 1;

// color ranges
var COLOR_RED_START = 32;
var COLOR_RED_END = 47;

var COLOR_GREEN_START = 96;
var COLOR_GREEN_END = 111

var COLOR_BLUE_START = 214;
var COLOR_BLUE_END = 217;

var COLOR_WHITE_START = 16;
var COLOR_WHITE_END = 31;

var BALL_RADIUS = 5;


var PARTICLE_TYP = {
    state: 0,           // state of the particle
    type: 0,            // type of particle effect
    x: 0, y: 0,           // world position of particle
    xv: 0, yv: 0,         // velocity of particle
    curr_color: 0,      // the current rendering color of particle
    start_color: 0,     // the start color or range effect
    end_color: 0,       // the ending color of range effect
    counter: 0,         // general state transition timer
    max_count: 0       // max value for counter

};
var MAX_PARTICLES = 256;
var particles = new Array(MAX_PARTICLES); // the particles for the particle engine



var Point = {
    x: 0,
    y: 0
};

var LineSegment = {
    startPoint: { x: 0, y: 0 },
    endPoint: { x: 0, y: 0 }
}
var lineSegments = new Array();

var ParticleInitStatus
{
    ang: 0;
    vel: 0;
};
var PARTICLEINITCOUNT = 10;
var particleInitStatus = new Array(PARTICLEINITCOUNT);

var particle_wind = 0;    // assume it operates in the X direction
var particle_gravity = .5; // assume it operates in the Y direction




Init_Reset_Particles();

InitCollisionLineSegments();

///////////////////////////////////////


var POLYGON2D = {
    x0: 0, y0: 0,        // position of center of polygon  
    vlist: new Array()
};

var how2use = document.getElementById("how2use");
//var text = "<A> and <S> - Scale    <Z> and <X> - Rotate     <Arrows> - Translate";
var text = "<G>, <B> adjusts particle gravity, <W>, <E> adjusts particle wind.";
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
    cxt.closePath();
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

var KEY_W = 87;
var KEY_E = 69;
var KEY_G = 71;
var KEY_B = 66;


var KEYDOWN_LEFT = false;
var KEYDOWN_UP = false;
var KEYDOWN_RIGHT = false;
var KEYDOWN_DOWN = false;
var KEYDOWN_Z = false;
var KEYDOWN_X = false;
var KEYDOWN_A = false;
var KEYDOWN_S = false;

var KEYDOWN_W = false;
var KEYDOWN_E = false;
var KEYDOWN_G = false;
var KEYDOWN_B = false;


function drawItOnCanvas() {
    cxt.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // test for wind force
    if (KEYDOWN_W) {
        if (particle_wind < 2) particle_wind += 0.01;
    } // end if
    else if (KEYDOWN_E) {
        if (particle_wind > -2) particle_wind -= 0.01;
    } // end if

    // test for gravity force
    if (KEYDOWN_G) {
        if (particle_gravity < 5) particle_gravity += 0.01;
    } // end if
    else if (KEYDOWN_B) {
        if (particle_gravity > -5) particle_gravity -= 0.01;
    } // end if
    var windforceValue = document.getElementById("WindforceValue");
    windforceValue.innerHTML = particle_wind;
    var gravityForceValue = document.getElementById("GravityForceValue");
    gravityForceValue.innerHTML = particle_gravity;

    DrawCollisionObject();

    Process_Particles();
    Compute_Collisions();

    InitparticleStatus();
    Start_Particle_Water(50,
        SCREEN_WIDTH / 2, SCREEN_HEIGHT / 4,
        0, 0, PARTICLEINITCOUNT);

    Draw_Particles();
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

        case KEY_W:
            KEYDOWN_W = true;
            break;
        case KEY_E:
            KEYDOWN_E = true;
            break;
        case KEY_G:
            KEYDOWN_G = true;
            break;
        case KEY_B:
            KEYDOWN_B = true;
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

        case KEY_W:
            KEYDOWN_W = false;
            break;
        case KEY_E:
            KEYDOWN_E = false;
            break;
        case KEY_G:
            KEYDOWN_G = false;
            break;
        case KEY_B:
            KEYDOWN_B = false;
            break;

    }
}

function DrawCollisionObject() {
    cxt.beginPath();
    var l;
    var len = lineSegments.length;
    for (var i = 0; i < len; i++) {
        l = lineSegments[i];
        //Draw_Clip_Line(l.startPoint.x, l.startPoint.y, l.endPoint.x, l.endPoint.y,
        //	COLLISION_COLOR, back_buffer, back_lpitch);
        cxt.moveTo(l.startPoint.x, l.startPoint.y);
        cxt.lineTo(l.endPoint.x, l.endPoint.y);
    }
    cxt.stroke();

}

function InitCollisionLineSegments() {

    var p1 = { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 };
    var p2 = { x: SCREEN_WIDTH / 2 + 100, y: SCREEN_HEIGHT / 2 + 100 };
    var p3 = { x: SCREEN_WIDTH / 2 - 50, y: SCREEN_HEIGHT / 2 + 100 };

    var l1 = { startPoint: p1, endPoint: p2 };
    var l2 = { startPoint: p2, endPoint: p3 };
    var l3 = { startPoint: p3, endPoint: p1 };

    lineSegments.push(l1);
    lineSegments.push(l2);
    lineSegments.push(l3);
}

function Start_Particle_Water(count,
	x, y, xv, yv, num_particles) {
    // this function starts a particle explosion at the given position and velocity

    var ang = 0;

    // compute random trajectory velocity
    var vel = 0;

    while (--num_particles >= 0) {
        // compute random trajectory angle
        ang = particleInitStatus[num_particles].ang;

        // compute random trajectory velocity
        vel = particleInitStatus[num_particles].vel;

        Start_Particle(PARTICLE_TYPE_FADE, PARTICLE_COLOR_BLUE, count,
            x + RAND_RANGE(-4, 4), y + RAND_RANGE(-4, 4),
            xv + Math.cos(ang) * vel, yv + Math.sin(ang) * vel);

    } // end while

}

function InitparticleStatus() {
    for (var i = 0; i < PARTICLEINITCOUNT; i++) {
        particleInitStatus[i] = { ang: Math.random() * 1000 % 360, vel: 2 + Math.random() * 1000 % 4 };
    }

}

function Start_Particle(type, color, count, x, y, xv, yv) {
    // this function starts a single particle

    var pindex = -1; // index of particle

    // first find open particle
    var index = 0;
    for (; index < MAX_PARTICLES; index++)
        if (particles[index].state == PARTICLE_STATE_DEAD) {
            // set index
            pindex = index;
            break;
        } // end if    

    // did we find one
    if (pindex == -1)
        return;

    // set general state info
    particles[pindex].state = PARTICLE_STATE_ALIVE;
    particles[pindex].type = type;
    particles[pindex].x = x;
    particles[pindex].y = y;
    particles[pindex].xv = xv;
    particles[pindex].yv = yv;
    particles[pindex].counter = 0;
    particles[pindex].max_count = count;

    // set color ranges, always the same
    switch (color) {
        case PARTICLE_COLOR_RED:
            {
                particles[pindex].start_color = COLOR_RED_START;
                particles[pindex].end_color = COLOR_RED_END;
            } break;

        case PARTICLE_COLOR_GREEN:
            {
                particles[pindex].start_color = COLOR_GREEN_START;
                particles[pindex].end_color = COLOR_GREEN_END;
            } break;

        case PARTICLE_COLOR_BLUE:
            {
                particles[pindex].start_color = COLOR_BLUE_START;
                particles[pindex].end_color = COLOR_BLUE_END;
            } break;

        case PARTICLE_COLOR_WHITE:
            {
                particles[pindex].start_color = COLOR_WHITE_START;
                particles[pindex].end_color = COLOR_WHITE_END;
            } break;

            break;

    } // end switch

    // what type of particle is being requested
    if (type == PARTICLE_TYPE_FLICKER) {
        // set current color
        particles[index].curr_color = RAND_RANGE(particles[index].start_color, particles[index].end_color);

    } // end if
    else {
        // particle is fade type
        // set current color
        particles[index].curr_color = particles[index].start_color;
    } // end if

} // end Start_Particle

function RAND_RANGE(x, y) {
    return ((x) + (Math.random() * 10000 % ((y) - (x) + 1)));
}

function Init_Reset_Particles() {
    // this function serves as both an init and reset for the particles

    // loop thru and reset all the particles to dead
    for (var index = 0; index < MAX_PARTICLES; index++) {
        particles[index] = {
            state: PARTICLE_STATE_DEAD,
            type: PARTICLE_TYPE_FADE,
            x: 0,
            y: 0,
            xv: 0,
            yv: 0,
            start_color: 0,
            end_color: 0,
            curr_color: 0,
            counter: 0,
            max_count: 0,
        };
    } // end if

} // end Init_Reset_Particles

function Draw_Particles() {
    // this function draws all the particles

    for (var index = 0; index < MAX_PARTICLES; index++) {
        // test if particle is alive
        if (particles[index].state == PARTICLE_STATE_ALIVE) {
            // render the particle, perform world to screen transform
            var x = particles[index].x;
            var y = particles[index].y;

            // test for clip
            if (x >= SCREEN_WIDTH || x < 0 || y >= SCREEN_HEIGHT || y < 0)
                continue;

            // draw the pixel
            //Draw_Pixel(x, y, particles[index].curr_color, back_buffer, back_lpitch);
            //Draw_Ball_2D(x, y, BALL_RADIUS, particles[index].curr_color, back_buffer, back_lpitch);
            cxt.fillStyle = "#99D9EA";//water blue
            cxt.beginPath();
            cxt.arc(x, y, BALL_RADIUS, 0, Math.PI * 2, true);
            cxt.closePath();
            cxt.fill();

        } // end if

    } // end for index

} // end Draw_Particles


function Process_Particles() {
    // this function moves and animates all particles

    for (var index = 0; index < MAX_PARTICLES; index++) {
        // test if this particle is alive
        if (particles[index].state == PARTICLE_STATE_ALIVE) {
            // translate particle
            //particles[index].x += particles[index].xv;
            //particles[index].y += particles[index].yv;

            if (particles[index].y >= SCREEN_HEIGHT) {
                particles[index].state = PARTICLE_STATE_DEAD;
            }

            // update velocity based on gravity and wind
            particles[index].xv += particle_wind;
            particles[index].yv += particle_gravity;

            // now based on type of particle perform proper animation
            if (particles[index].type == PARTICLE_TYPE_FLICKER) {
                // simply choose a color in the color range and assign it to the current color
                particles[index].curr_color = RAND_RANGE(particles[index].start_color, particles[index].end_color);

                // now update counter
                if (++particles[index].counter >= particles[index].max_count) {
                    // kill the particle
                    particles[index].state = PARTICLE_STATE_DEAD;

                } // end if

            } // end if
            else {
                // must be a fade, be careful!
                // test if it's time to update color
                if (++particles[index].counter >= particles[index].max_count) {
                    // reset counter
                    particles[index].counter = 0;

                    // update color
                    if (++particles[index].curr_color > particles[index].end_color) {
                        // transition is complete, terminate particle
                        particles[index].state = PARTICLE_STATE_DEAD;

                    } // end if

                } // end if

            } // end else

        } // end if 

    } // end for index

} // end Process_Particles

function Compute_Collisions() {
    // this function computes if any ball has hit one of the edges of the polygon
    // if so the ball is bounced

    var length, s, t, s1x, s1y, s2x, s2y, p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y, xi, yi, npx, npy, Nx, Ny, Fx, Fy;


    for (var index = 0; index < MAX_PARTICLES; index++) {
        if (particles[index].state == PARTICLE_STATE_DEAD) {
            continue;
        }


        // first move particle
        //particles[index].varsF[INDEX_X] += balls[index].varsF[INDEX_XV];
        //particles[index].varsF[INDEX_Y] += balls[index].varsF[INDEX_YV];
        //particles[index].x += particles[index].xv;
        //particles[index].y += particles[index].yv;


        // now project velocity vector forward and test for intersection with all lines of polygon shape

        // build up vector in direction of trajectory
        //p0x = balls[index].varsF[INDEX_X];
        //p0y = balls[index].varsF[INDEX_Y];
        p0x = particles[index].x;
        p0y = particles[index].y;

        //p1x = balls[index].varsF[INDEX_X] + balls[index].varsF[INDEX_XV];
        //p1y = balls[index].varsF[INDEX_Y] + balls[index].varsF[INDEX_YV];
        p1x = particles[index].x + particles[index].xv;
        p1y = particles[index].y + particles[index].yv;

        s1x = p1x - p0x;
        s1y = p1y - p0y;


        var collisionHappen = false;
        var len = lineSegments.length;
        // for each line try and intersect
        //for (int line = 0; line < shape.num_verts; line++)
        for (var line = 0; line < len; line++) {
            // now build up vector based on line
            //p2x = shape.vlist[line].x + shape.x0;
            //p2y = shape.vlist[line].y + shape.y0;
            p2x = lineSegments[line].startPoint.x;
            p2y = lineSegments[line].startPoint.y;

            //p3x = shape.vlist[(line + 1) % (shape.num_verts)].x + shape.x0;
            //p3y = shape.vlist[(line + 1) % (shape.num_verts)].y + shape.y0;
            p3x = lineSegments[line].endPoint.x;
            p3y = lineSegments[line].endPoint.y;

            s2x = p3x - p2x;
            s2y = p3y - p2y;

            // compute s and t, the parameters
            s = (-s1y * (p0x - p2x) + s1x * (p0y - p2y)) / (-s2x * s1y + s1x * s2y);
            t = (s2x * (p0y - p2y) - s2y * (p0x - p2x)) / (-s2x * s1y + s1x * s2y);

            // test for valid range (0..1)
            if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
                collisionHappen = true;

                // find collision point based on s
                xi = p0x + s * s1x;
                yi = p0y + s * s1y;

                // now we know point of intersection, reflect ball at current location

                // N = (-I . N')*N'
                // F = 2*N + I
                npx = -s2y;
                npy = s2x;

                // normalize p
                length = Math.sqrt(npx * npx + npy * npy);
                npx /= length;
                npy /= length;

                // compute N = (-I . N')*N'
                //Nx = -(balls[index].varsF[INDEX_XV] * npx + balls[index].varsF[INDEX_YV] * npy)*npx;
                //Ny = -(balls[index].varsF[INDEX_XV] * npx + balls[index].varsF[INDEX_YV] * npy)*npy;
                Nx = -(particles[index].xv * npx + particles[index].yv * npy) * npx;
                Ny = -(particles[index].xv * npx + particles[index].yv * npy) * npy;

                // compute F = 2*N + I
                //Fx = 2 * Nx + balls[index].varsF[INDEX_XV];
                //Fy = 2 * Ny + balls[index].varsF[INDEX_YV];
                Fx = 2 * Nx + particles[index].xv;
                Fy = 2 * Ny + particles[index].yv;

                // update velocity with results
                //balls[index].varsF[INDEX_XV] = Fx;
                //balls[index].varsF[INDEX_YV] = Fy;
                particles[index].xv = Fx * 2 / 5;
                particles[index].yv = Fy * 2 / 5;

                //balls[index].varsF[INDEX_X] += balls[index].varsF[INDEX_XV];
                //balls[index].varsF[INDEX_Y] += balls[index].varsF[INDEX_YV];
                particles[index].x += particles[index].xv;
                particles[index].y += particles[index].yv;

                // break out of for line
                break;

            } // end if

        } // end for line
        if (!collisionHappen) {
            particles[index].x += particles[index].xv;
            particles[index].y += particles[index].yv;
        }

    } // end for ball index

} // end Collision_Collisions
