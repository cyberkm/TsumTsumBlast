#include <emscripten.h>
#include <html5.h>
#include <trace.h>
#include <emscripten/bind.h>

#include "Box2D/Box2D.h"

#include <stdio.h>
#include <vector>

b2World *g_world = nullptr;
using namespace std;

class Sprite
{
public:
	Sprite(const string& c) : m_color(c) 
	{}
	string m_color;
};

class Scene
{
public:
	vector<b2Body*> m_bodies;
	vector<Sprite> m_sprites;
};
Scene *g_scene = nullptr;

#define BALL_RADIUS 0.2f

int initStart()
{
	srand(0);
	g_scene = new Scene();

	b2Vec2 gravity(0.0f, -7.0f);

	// Construct a world object, which will hold and simulate the rigid bodies.
	g_world = new b2World(gravity);

	// Define the ground body.
	b2BodyDef groundBodyDef;
	groundBodyDef.position.Set(0.0f, -10.0f);

	b2Body* groundBody = g_world->CreateBody(&groundBodyDef);

	b2PolygonShape wallBox;
	wallBox.SetAsBox(8, 50, b2Vec2(-10, 0), 0);
	groundBody->CreateFixture(&wallBox, 0.0f);
	wallBox.SetAsBox(8, 50, b2Vec2(10, 0), 0);
	groundBody->CreateFixture(&wallBox, 0.0f);

	b2PolygonShape groundBox;
	groundBox.SetAsBox(50.0f, 10.0f); // The extents are the half-widths of the box.
	groundBody->CreateFixture(&groundBox, 0.0f);

	
	g_scene->m_sprites.push_back(Sprite("#ff0000"));
	g_scene->m_sprites.push_back(Sprite("#00aa00"));
	g_scene->m_sprites.push_back(Sprite("#0000ff"));
	
	// Define the dynamic body. We set its position and call the body factory.
	float px = -1.2;
	float py = 10; //38.0;

	for(int i = 0; i < 50; ++i) // 230
	{
		if ((i % 5) != 0) 
			px += 2.4/5.0;
		else {
			px = -1.2;
			if ((i % 10) != 0) 
				px += 0.5;
			py -= 0.8;
		}
		
		b2BodyDef bodyDef;
		bodyDef.type = b2_dynamicBody;
		bodyDef.position.Set(px, py);
		int randCol = rand() % g_scene->m_sprites.size();
		bodyDef.userData = &g_scene->m_sprites[randCol];
		b2Body* body = g_world->CreateBody(&bodyDef);
		g_scene->m_bodies.push_back(body);

		b2CircleShape dynamicBall;
		dynamicBall.m_radius = BALL_RADIUS;

		b2FixtureDef fixtureDef;
		fixtureDef.shape = &dynamicBall;
		fixtureDef.restitution = 0.3;

		fixtureDef.density = 1.0f; // Set the box density to be non-zero, so it will be dynamic.
		fixtureDef.friction = 0.3f; // Override the default friction.

		body->CreateFixture(&fixtureDef);
		

	}



	return 0;
}



float32 timeStep = 1.0f / 60.0f;
int32 velocityIterations = 6;
int32 positionIterations = 2;

void cpp_progress()
{
	g_world->Step(timeStep, velocityIterations, positionIterations);
	

	//printf("%4.2f %4.2f %4.2f\n", position.x, position.y, angle);
	for(auto* bd: g_scene->m_bodies)
	{
		b2Vec2 position = bd->GetPosition();
		//float32 angle = bd->GetAngle();
		Sprite* sprite = (Sprite*)bd->GetUserData();
		EM_ASM_(drawCircle($0, $1, Pointer_stringify($2)), position.x, position.y, sprite->m_color.c_str());
	}
}


struct MouseCallback : public b2QueryCallback 
{
	MouseCallback(float qx, float qy) 
		:qp(qx, qy)
	{}
	virtual bool ReportFixture(b2Fixture* fixture) {
		b2Body* b = fixture->GetBody();
		Sprite* ud = (Sprite*)b->GetUserData();
		if (ud == nullptr)
			return true;
		//fixture->GetShape()->m_radius
		float d = b2Distance(b->GetPosition(), qp);
		if (d < BALL_RADIUS) {
			printf("FOUND %p  %s\n", rb, ud->m_color.c_str());
			rb = b;
			return false; // can't be in more than one ball so we can stop the search
		}
		return true;
	}
	b2Body* rb = nullptr;
	b2Vec2 qp;
};

void mouse_hover(float x, float y)
{
	b2AABB qa;
	qa.lowerBound.Set(x-0.01, y-0.01);
	qa.upperBound.Set(x-0.01, y-0.01);
	
	MouseCallback mc(x, y);
	g_world->QueryAABB(&mc, qa);
}


EMSCRIPTEN_BINDINGS(my_module) 
{
    emscripten::function("initStart", &initStart);
    emscripten::function("cpp_progress", &cpp_progress);
	emscripten::function("mouse_hover", &mouse_hover);
}