// demoWater1.cpp - particle demo
// to compile make sure to include DDRAW.LIB
// DINPUT.LIB

// INCLUDES ///////////////////////////////////////////////

#define INITGUID

#define WIN32_LEAN_AND_MEAN  

#include <windows.h>   // include important windows stuff
#include <windowsx.h> 
#include <mmsystem.h>
#include <iostream> // include important C/C++ stuff
#include <conio.h>
#include <stdlib.h>
#include <malloc.h>
#include <memory.h>
#include <string.h>
#include <stdarg.h>
#include <stdio.h> 
#include <math.h>
#include <io.h>
#include <fcntl.h>

#include <vector>

#include <ddraw.h>  // directX includes
#include <dsound.h>
#include <dmksctrl.h>
#include <dinput.h>
#include "T3DLIB1.h" // game library includes
#include "T3DLIB2.h"

using namespace std;

// DEFINES ////////////////////////////////////////////////

// defines for windows 
#define WINDOW_CLASS_NAME "WINXCLASS"  // class name

#define WINDOW_WIDTH    SCREEN_WIDTH  // size of window
#define WINDOW_HEIGHT   SCREEN_HEIGHT

#define WINDOWED_APP      0     // 0 not windowed, 1 windowed

// defines for particle system
#define PARTICLE_STATE_DEAD               0
#define PARTICLE_STATE_ALIVE              1

// types of particles
#define PARTICLE_TYPE_FLICKER             0
#define PARTICLE_TYPE_FADE                1 

// color of particle
#define PARTICLE_COLOR_RED                0
#define PARTICLE_COLOR_GREEN              1
#define PARTICLE_COLOR_BLUE               2
#define PARTICLE_COLOR_WHITE              3

#define MAX_PARTICLES                     256

// color ranges
#define COLOR_RED_START                   32
#define COLOR_RED_END                     47

#define COLOR_GREEN_START                 96
#define COLOR_GREEN_END                   111

//#define COLOR_BLUE_START                  144
//#define COLOR_BLUE_END                    159
#define COLOR_BLUE_START                  214
#define COLOR_BLUE_END                    218

#define COLOR_WHITE_START                 16
#define COLOR_WHITE_END                   31

#define COLLISION_COLOR					100

#define BALL_RADIUS						5


// MACROS ///////////////////////////////////////////////

#define RAND_RANGE(x,y) ( (x) + (rand()%((y)-(x)+1)))

// TYPES ///////////////////////////////////////////////

// a single particle
typedef struct PARTICLE_TYP
{
	int state;           // state of the particle
	int type;            // type of particle effect
	float x, y;           // world position of particle
	float xv, yv;         // velocity of particle
	int curr_color;      // the current rendering color of particle
	int start_color;     // the start color or range effect
	int end_color;       // the ending color of range effect
	int counter;         // general state transition timer
	int max_count;       // max value for counter

} PARTICLE, *PARTICLE_PTR;

struct ParticleInitStatus
{
	int ang;
	float vel;
};

struct Point
{
	float x;
	float y;
};

struct LineSegment
{
	Point startPoint;
	Point endPoint;
};


// PROTOTYPES /////////////////////////////////////////////

// game console
int Game_Init(void *parms = NULL);
int Game_Shutdown(void *parms = NULL);
int Game_Main(void *parms = NULL);

void ShowColorInPalette();
void Draw_Ball_2D(int centreX, int centreY, int radius, int color, UCHAR *dest_buffer, int mempitch);


void Init_Reset_Particles(void);
void Draw_Particles(void);
void Process_Particles(void);
void Start_Particle(int type, int color, int count, int x, int y, int xv, int yv);
void Start_Particle_Water(int color, int count,
	int x, int y, int xv, int yv, int num_particles);
void InitparticleStatus();
void InitCollisionLineSegments();
void DrawCollisionObject();
void Compute_Collisions();

// GLOBALS ////////////////////////////////////////////////

HWND main_window_handle = NULL; // save the window handle
HINSTANCE main_instance = NULL; // save the instance
char buffer[256];                 // used to print text

float particle_wind = 0;    // assume it operates in the X direction
float particle_gravity = .5; // assume it operates in the Y direction

PARTICLE particles[MAX_PARTICLES]; // the particles for the particle engine

#define PARTICLEINITCOUNT  10
ParticleInitStatus particleInitStatus[PARTICLEINITCOUNT];

vector<LineSegment> lineSegments;

// FUNCTIONS //////////////////////////////////////////////

LRESULT CALLBACK WindowProc(HWND hwnd,
	UINT msg,
	WPARAM wparam,
	LPARAM lparam)
{
	// this is the main message handler of the system
	PAINTSTRUCT	ps;		   // used in WM_PAINT
	HDC			hdc;	   // handle to a device context

	// what is the message 
	switch (msg)
	{
	case WM_CREATE:
	{
		// do initialization stuff here
		return(0);
	} break;

	case WM_PAINT:
	{
		// start painting
		hdc = BeginPaint(hwnd, &ps);

		// end painting
		EndPaint(hwnd, &ps);
		return(0);
	} break;

	case WM_DESTROY:
	{
		// kill the application			
		PostQuitMessage(0);
		return(0);
	} break;

	default:break;

	} // end switch

	// process any messages that we didn't take care of 
	return (DefWindowProc(hwnd, msg, wparam, lparam));

} // end WinProc

// WINMAIN ////////////////////////////////////////////////

int WINAPI WinMain(HINSTANCE hinstance,
	HINSTANCE hprevinstance,
	LPSTR lpcmdline,
	int ncmdshow)
{
	// this is the winmain function

	WNDCLASS winclass;	// this will hold the class we create
	HWND	 hwnd;		// generic window handle
	MSG		 msg;		// generic message
	HDC      hdc;       // generic dc
	PAINTSTRUCT ps;     // generic paintstruct

	// first fill in the window class stucture
	winclass.style = CS_DBLCLKS | CS_OWNDC |
		CS_HREDRAW | CS_VREDRAW;
	winclass.lpfnWndProc = WindowProc;
	winclass.cbClsExtra = 0;
	winclass.cbWndExtra = 0;
	winclass.hInstance = hinstance;
	winclass.hIcon = LoadIcon(NULL, IDI_APPLICATION);
	winclass.hCursor = LoadCursor(NULL, IDC_ARROW);
	winclass.hbrBackground = (HBRUSH)GetStockObject(BLACK_BRUSH);
	winclass.lpszMenuName = NULL;
	winclass.lpszClassName = WINDOW_CLASS_NAME;

	// register the window class
	if (!RegisterClass(&winclass))
		return(0);

	// create the window, note the use of WS_POPUP
	if (!(hwnd = CreateWindow(WINDOW_CLASS_NAME, // class
		"Collision Demo",	 // title
		(WINDOWED_APP ? (WS_OVERLAPPED | WS_SYSMENU | WS_CAPTION) : (WS_POPUP | WS_VISIBLE)),
		0, 0,	   // x,y
		WINDOW_WIDTH,  // width
		WINDOW_HEIGHT, // height
		NULL,	   // handle to parent 
		NULL,	   // handle to menu
		hinstance,// instance
		NULL)))	// creation parms
		return(0);

	// save the window handle and instance in a global
	main_window_handle = hwnd;
	main_instance = hinstance;

	if (WINDOWED_APP)
	{
		// now resize the window, so the client area is the actual size requested
		// since there may be borders and controls if this is going to be a windowed app
		// if the app is not windowed then it won't matter
		RECT window_rect = { 0, 0, WINDOW_WIDTH - 1, WINDOW_HEIGHT - 1 };


		// make the call to adjust window_rect
		AdjustWindowRectEx(&window_rect,
			GetWindowStyle(main_window_handle),
			GetMenu(main_window_handle) != NULL,
			GetWindowExStyle(main_window_handle));

		// save the global client offsets, they are needed in DDraw_Flip()
		window_client_x0 = -window_rect.left;
		window_client_y0 = -window_rect.top;

		// now resize the window with a call to MoveWindow()
		MoveWindow(main_window_handle,
			0, // x position
			0, // y position
			window_rect.right - window_rect.left, // width
			window_rect.bottom - window_rect.top, // height
			FALSE);

		// show the window, so there's no garbage on first render
		ShowWindow(main_window_handle, SW_SHOW);
	} // end if windowed

	// perform all game console specific initialization
	Game_Init();

	// enter main event loop
	while (1)
	{
		if (PeekMessage(&msg, NULL, 0, 0, PM_REMOVE))
		{
			// test if this is a quit
			if (msg.message == WM_QUIT)
				break;

			// translate any accelerator keys
			TranslateMessage(&msg);

			// send the message to the window proc
			DispatchMessage(&msg);
		} // end if

		// main game processing goes here
		Game_Main();

	} // end while

	// shutdown game and release all resources
	Game_Shutdown();

	// return to Windows like this
	return(msg.wParam);

} // end WinMain

// T3D GAME PROGRAMMING CONSOLE FUNCTIONS ////////////////

int Game_Init(void *parms)
{
	// this function is where you do all the initialization 
	// for your game

	int index; // looping varsIable

	char filename[80]; // used to build up filenames

	// seed random number generate
	srand(Start_Clock());

	// start up DirectDraw (replace the parms as you desire)
	DDraw_Init(SCREEN_WIDTH, SCREEN_HEIGHT, SCREEN_BPP, WINDOWED_APP);

	// initialize directinput
	DInput_Init();

	// acquire the keyboard only
	DInput_Init_Keyboard();

	// initialize particles
	Init_Reset_Particles();

	// build the 360 degree look ups
	Build_Sin_Cos_Tables();

	// set clipping rectangle to screen extents so objects dont
	// mess up at edges
	RECT screen_rect = { 0, 0, screen_width, screen_height };
	lpddclipper = DDraw_Attach_Clipper(lpddsback, 1, &screen_rect);

	// set clipping region
	min_clip_x = 0;
	max_clip_x = screen_width - 1;
	min_clip_y = 0;
	max_clip_y = screen_height - 1;

	InitCollisionLineSegments();

	// return success
	return(1);

} // end Game_Init

///////////////////////////////////////////////////////////

int Game_Shutdown(void *parms)
{
	// this function is where you shutdown your game and
	// release all resources that you allocated

	// shut everything down

	// shutdown directdraw last
	DDraw_Shutdown();

	// shut down directinput
	DInput_Shutdown();

	// return success
	return(1);

} // end Game_Shutdown

////////////////////////////////////////////////////////////

void Init_Reset_Particles(void)
{
	// this function serves as both an init and reset for the particles

	// loop thru and reset all the particles to dead
	for (int index = 0; index < MAX_PARTICLES; index++)
	{
		particles[index].state = PARTICLE_STATE_DEAD;
		particles[index].type = PARTICLE_TYPE_FADE;
		particles[index].x = 0;
		particles[index].y = 0;
		particles[index].xv = 0;
		particles[index].yv = 0;
		particles[index].start_color = 0;
		particles[index].end_color = 0;
		particles[index].curr_color = 0;
		particles[index].counter = 0;
		particles[index].max_count = 0;
	} // end if

} // end Init_Reset_Particles

/////////////////////////////////////////////////////////////////////////

void Start_Particle(int type, int color, int count, int x, int y, int xv, int yv)
{
	// this function starts a single particle

	int pindex = -1; // index of particle

	// first find open particle
	int index = 0;
	for (; index < MAX_PARTICLES; index++)
		if (particles[index].state == PARTICLE_STATE_DEAD)
		{
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
	switch (color)
	{
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
	if (type == PARTICLE_TYPE_FLICKER)
	{
		// set current color
		particles[index].curr_color = RAND_RANGE(particles[index].start_color, particles[index].end_color);

	} // end if
	else
	{
		// particle is fade type
		// set current color
		particles[index].curr_color = particles[index].start_color;
	} // end if

} // end Start_Particle

////////////////////////////////////////////////////////////////////////////////

void Start_Particle_Water(int count,
	int x, int y, int xv, int yv, int num_particles)
{
	// this function starts a particle explosion at the given position and velocity

	int ang = 0;

	// compute random trajectory velocity
	float vel = 0;

	while (--num_particles >= 0)
	{
		// compute random trajectory angle
		ang = particleInitStatus[num_particles].ang;

		// compute random trajectory velocity
		vel = particleInitStatus[num_particles].vel;

		Start_Particle(PARTICLE_TYPE_FADE, PARTICLE_COLOR_BLUE, count,
			x + RAND_RANGE(-4, 4), y + RAND_RANGE(-4, 4),
			xv + cos_look[ang] * vel, yv + sin_look[ang] * vel);

	} // end while

}

////////////////////////////////////////////////////////////////////////////////

void Draw_Particles(void)
{
	// this function draws all the particles

	// lock back surface
	DDraw_Lock_Back_Surface();

	for (int index = 0; index < MAX_PARTICLES; index++)
	{
		// test if particle is alive
		if (particles[index].state == PARTICLE_STATE_ALIVE)
		{
			// render the particle, perform world to screen transform
			int x = particles[index].x;
			int y = particles[index].y;

			// test for clip
			if (x >= SCREEN_WIDTH || x < 0 || y >= SCREEN_HEIGHT || y < 0)
				continue;

			// draw the pixel
			//Draw_Pixel(x, y, particles[index].curr_color, back_buffer, back_lpitch);
			Draw_Ball_2D(x, y, BALL_RADIUS, particles[index].curr_color, back_buffer, back_lpitch);

		} // end if

	} // end for index

	// unlock the secondary surface
	DDraw_Unlock_Back_Surface();

} // end Draw_Particles

////////////////////////////////////////////////////////////////////

void Process_Particles(void)
{
	// this function moves and animates all particles

	for (int index = 0; index < MAX_PARTICLES; index++)
	{
		// test if this particle is alive
		if (particles[index].state == PARTICLE_STATE_ALIVE)
		{
			// translate particle
			//particles[index].x += particles[index].xv;
			//particles[index].y += particles[index].yv;

			if (particles[index].y >= SCREEN_HEIGHT)
			{
				particles[index].state = PARTICLE_STATE_DEAD;
			}

			// update velocity based on gravity and wind
			particles[index].xv += particle_wind;
			particles[index].yv += particle_gravity;

			// now based on type of particle perform proper animation
			if (particles[index].type == PARTICLE_TYPE_FLICKER)
			{
				// simply choose a color in the color range and assign it to the current color
				particles[index].curr_color = RAND_RANGE(particles[index].start_color, particles[index].end_color);

				// now update counter
				if (++particles[index].counter >= particles[index].max_count)
				{
					// kill the particle
					particles[index].state = PARTICLE_STATE_DEAD;

				} // end if

			} // end if
			else
			{
				// must be a fade, be careful!
				// test if it's time to update color
				if (++particles[index].counter >= particles[index].max_count)
				{
					// reset counter
					particles[index].counter = 0;

					// update color
					if (++particles[index].curr_color > particles[index].end_color)
					{
						// transition is complete, terminate particle
						particles[index].state = PARTICLE_STATE_DEAD;

					} // end if

				} // end if

			} // end else

		} // end if 

	} // end for index

} // end Process_Particles

////////////////////////////////////////////////////////////////////////////////////

int Game_Main(void *parms)
{
	// this is the workhorse of your game it will be called
	// continuously in real-time this is like main() in C
	// all the calls for you game go here!

	int index; // looping var

	// start the timing clock
	Start_Clock();

	// clear out the back buffer
	DDraw_Fill_Surface(lpddsback, 0);

	// read keyboard
	DInput_Read_Keyboard();

	//ShowColorInPalette();
	//DDraw_Lock_Back_Surface();
	//Draw_QuadFP_2D(SCREEN_WIDTH / 4, 400,
	//	SCREEN_WIDTH * 3 / 4, 400,
	//	SCREEN_WIDTH * 3 / 4, 420,
	//	SCREEN_WIDTH / 4, 420,
	//	100, back_buffer, back_lpitch);
	//DDraw_Unlock_Back_Surface();
	DrawCollisionObject();

	Compute_Collisions();

	// test for wind force
	if (keyboard_state[DIK_W])
	{
		if (particle_wind < 2) particle_wind += 0.01;
	} // end if
	else if (keyboard_state[DIK_E])
	{
		if (particle_wind > -2) particle_wind -= 0.01;
	} // end if

	// test for gravity force
	if (keyboard_state[DIK_G])
	{
		if (particle_gravity < 5) particle_gravity += 0.01;
	} // end if
	else if (keyboard_state[DIK_B])
	{
		if (particle_gravity > -5) particle_gravity -= 0.01;
	} // end if

	// move particles
	Process_Particles();

	static int frameIndex = 0;
	if (frameIndex % 33 == 0)
	{
		InitparticleStatus();
		Start_Particle_Water(50,
			SCREEN_WIDTH / 2, SCREEN_HEIGHT / 4,
			0, 0, PARTICLEINITCOUNT);
	}
	frameIndex++;



	// draw the particles
	Draw_Particles();

	//DDraw_Lock_Back_Surface();
	//Draw_Ball_2D(100, 100, 100, COLOR_BLUE_START, back_buffer, back_lpitch);
	//DDraw_Unlock_Back_Surface();

	// draw the title
	Draw_Text_GDI("Particle System DEMO, Press <ESC> to Exit.", 10, 10, RGB(0, 255, 0), lpddsback);
	Draw_Text_GDI("<G>, <B> adjusts particle gravity, <W>, <E> adjusts particle wind.", 10, 40, RGB(255, 255, 255), lpddsback);

	sprintf(buffer, "Particle: Wind force=%f, Gravity Force=%f", particle_wind, particle_gravity);
	Draw_Text_GDI(buffer, 10, 75, RGB(255, 255, 255), lpddsback);

	Compute_Collisions();

	// flip the surfaces
	DDraw_Flip();

	// sync to 30 fps = 1/30sec = 33 ms
	Wait_Clock(33);

	// check of user is trying to exit
	if (KEY_DOWN(VK_ESCAPE) || keyboard_state[DIK_ESCAPE])
	{
		PostMessage(main_window_handle, WM_DESTROY, 0, 0);
	} // end if

	// return success
	return(1);

} // end Game_Main

void ShowColorInPalette()
{
	// lock back surface
	DDraw_Lock_Back_Surface();

	const int WH = 10;
	int dx = 0;
	int dy = 0;
	for (int i = 0; i < MAX_COLORS_PALETTE; i++)
	{
		if (dx >= WINDOW_WIDTH)
		{
			dx = 0;
			dy += WH;
		}
		Draw_QuadFP_2D(0 + dx, 0 + dy,
			WH + dx, 0 + dy,
			WH + dx, WH + dy,
			0 + dx, WH + dy,
			i, back_buffer, back_lpitch);
		dx += WH;
	}

	// unlock the secondary surface
	DDraw_Unlock_Back_Surface();
}

void Draw_Ball_2D(int centreX, int centreY, int radius, int color, UCHAR *dest_buffer, int mempitch)
{
	if (radius < 0)
	{
		return;
	}
	int left = centreX - radius;
	int right = centreX + radius;
	int top = centreY - radius;
	int bottom = centreY + radius;
	for (int y = top; y <= centreY; y++)
	{
		int leftX = left;
		for (int x = left; x <= centreX; x++)
		{
			int circleX = x - centreX;
			int circleY = y - centreY;
			if (circleX * circleX + circleY * circleY < radius * radius)
			{
				leftX = x;
				break;
			}
		}
		int rightX = centreX + (centreX - leftX);
		int bottomY = centreY + (centreY - y);
		if (leftX != rightX && y != top && bottomY != bottom)
		{
			Draw_Clip_Line(leftX, y, rightX, y, color, dest_buffer, mempitch);
			Draw_Clip_Line(leftX, bottomY, rightX, bottomY, color, dest_buffer, mempitch);
		}
	}
}

void InitparticleStatus()
{
	for (int i = 0; i < PARTICLEINITCOUNT; i++)
	{
		particleInitStatus[i].ang = rand() % 360;
		particleInitStatus[i].vel = 2 + rand() % 4;
	}

}

void InitCollisionLineSegments()
{
	Point p1 = { SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 };
	Point p2 = { SCREEN_WIDTH / 2 + 100, SCREEN_HEIGHT / 2 + 100 };
	Point p3 = { SCREEN_WIDTH / 2 - 100, SCREEN_HEIGHT / 2 + 100 };

	LineSegment l1 = { p1, p2 };
	LineSegment l2 = { p2, p3 };
	LineSegment l3 = { p3, p1 };

	lineSegments.push_back(l1);
	lineSegments.push_back(l2);
	lineSegments.push_back(l3);
}

void DrawCollisionObject()
{
	DDraw_Lock_Back_Surface();
	LineSegment l;
	size_t len = lineSegments.size();
	for (size_t i = 0; i < len; i++) {
		l = lineSegments[i];
		Draw_Clip_Line(l.startPoint.x, l.startPoint.y, l.endPoint.x, l.endPoint.y,
			COLLISION_COLOR, back_buffer, back_lpitch);
	}
	DDraw_Unlock_Back_Surface();
}

void Compute_Collisions()
{
	// this function computes if any ball has hit one of the edges of the polygon
	// if so the ball is bounced

	float length, s, t, s1x, s1y, s2x, s2y, p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y, xi, yi, npx, npy, Nx, Ny, Fx, Fy;


	for (int index = 0; index < MAX_PARTICLES; index++)
	{
		if (particles[index].state == PARTICLE_STATE_DEAD)
		{
			continue;
		}
		

		// first move particle
		//particles[index].varsF[INDEX_X] += balls[index].varsF[INDEX_XV];
		//particles[index].varsF[INDEX_Y] += balls[index].varsF[INDEX_YV];
		particles[index].x += particles[index].xv;
		particles[index].y += particles[index].yv;


		// now project velocity vector forward and test for intersection with all lines of polygon shape

		// build up vector in direction of trajectory
		//p0x = balls[index].varsF[INDEX_X];
		//p0y = balls[index].varsF[INDEX_Y];
		p0x = particles[index].x;
		p0y = particles[index].y;

#if 1 // this is the velocity vector used as segment 1
		//p1x = balls[index].varsF[INDEX_X] + balls[index].varsF[INDEX_XV];
		//p1y = balls[index].varsF[INDEX_Y] + balls[index].varsF[INDEX_YV];
		p1x = particles[index].x + particles[index].xv + particle_gravity + BALL_RADIUS * 1.25;
		p1y = particles[index].y + particles[index].yv + particle_gravity + BALL_RADIUS * 1.25;

		//if (p1x > p0x)
		//{
		//	p1x += 1;
		//	p0x -= 1;
		//}
		//else
		//{

		//}

		s1x = p1x - p0x;
		s1y = p1y - p0y;

		// normalize and scale to 1.25*radius
		length = sqrt(s1x*s1x + s1y*s1y);
		s1x = 1.25*BALL_RADIUS*s1x / length;
		s1y = 1.25*BALL_RADIUS*s1y / length;
		p1x = p0x + s1x;
		p1y = p0y + s1y;


#endif
		size_t len = lineSegments.size();
		// for each line try and intersect
		//for (int line = 0; line < shape.num_verts; line++)
		for (int line = 0; line < len; line++)
		{
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

#if 0 // this is the perp vector used as segment 1
			// normalize s2x, s2y to create a perpendicular collision vector from the ball center
			length = sqrt(s2x*s2x + s2y*s2y);
			s1x = BALL_RADIUS*s2y / length;
			s1y = -BALL_RADIUS*s2x / length;
			p1x = p0x + s1x;
			p1y = p0y + s1y;
#endif
			// compute s and t, the parameters
			s = (-s1y*(p0x - p2x) + s1x*(p0y - p2y)) / (-s2x*s1y + s1x*s2y);
			t = (s2x*(p0y - p2y) - s2y*(p0x - p2x)) / (-s2x*s1y + s1x*s2y);

			// test for valid range (0..1)
			if (s >= 0 && s <= 1 && t >= 0 && t <= 1)
			{
				// find collision point based on s
				xi = p0x + s*s1x;
				yi = p0y + s*s1y;

				// now we know point of intersection, reflect ball at current location

				// N = (-I . N')*N'
				// F = 2*N + I
				npx = -s2y;
				npy = s2x;

				// normalize p
				length = sqrt(npx*npx + npy*npy);
				npx /= length;
				npy /= length;

				// compute N = (-I . N')*N'
				//Nx = -(balls[index].varsF[INDEX_XV] * npx + balls[index].varsF[INDEX_YV] * npy)*npx;
				//Ny = -(balls[index].varsF[INDEX_XV] * npx + balls[index].varsF[INDEX_YV] * npy)*npy;
				Nx = -(particles[index].xv * npx + particles[index].yv * npy)*npx;
				Ny = -(particles[index].xv * npx + particles[index].yv * npy)*npy;

				// compute F = 2*N + I
				//Fx = 2 * Nx + balls[index].varsF[INDEX_XV];
				//Fy = 2 * Ny + balls[index].varsF[INDEX_YV];
				Fx = 2 * Nx + particles[index].xv;
				Fy = 2 * Ny + particles[index].yv;

				// update velocity with results
				//balls[index].varsF[INDEX_XV] = Fx;
				//balls[index].varsF[INDEX_YV] = Fy;
				particles[index].xv = Fx * 2 / 3;
				particles[index].yv = Fy * 2 / 3;

				//balls[index].varsF[INDEX_X] += balls[index].varsF[INDEX_XV];
				//balls[index].varsF[INDEX_Y] += balls[index].varsF[INDEX_YV];
				particles[index].x += particles[index].xv;
				particles[index].y += particles[index].yv;

				// break out of for line
				//break;

			} // end if

		} // end for line

	} // end for ball index

} // end Collision_Collisions


//////////////////////////////////////////////////////////
