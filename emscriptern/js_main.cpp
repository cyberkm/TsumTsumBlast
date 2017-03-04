#include <emscripten.h>
#include <html5.h>
#include <trace.h>
#include <emscripten/bind.h>

#include "Box2D/Box2D.h"

#include <stdio.h>
#include <vector>
#include <queue>

b2World *g_world = nullptr;
using namespace std;

class Sprite
{
public:
	Sprite(const string& c, const b2Color& bc) : m_color(c), m_blastColor(bc)
	{}
	string m_color;
    b2Color m_blastColor;
};

class BallInfo
{
public:
    BallInfo(Sprite* sprite, int index, float radius) : m_sprite(sprite), m_index(index), m_radius(radius)
    {}


    Sprite* m_sprite = nullptr;
    int m_index = -1;
    bool m_inHoveredGroup = false;
    bool m_visited = false; // temp for bfs
    float m_radius = 0.0f;
};

class Anim {
public:
    virtual ~Anim() {}
    // return false when the anim is done
    virtual bool progress() = 0;
    virtual void draw() {}
};


class JsDebugDraw : public b2Draw
{
public:
    JsDebugDraw() {}
    ~JsDebugDraw() {}

	void DrawPolygon(const b2Vec2* vertices, int32 vertexCount, const b2Color& color) override {
        DrawSolidPolygon(vertices, vertexCount, color);
    }
	void DrawSolidPolygon(const b2Vec2* vertices, int32 vertexCount, const b2Color& color) override;

    void DrawCircle(const b2Vec2& center, float32 radius, const b2Color& color) override
    {}
	void DrawSolidCircle(const b2Vec2& center, float32 radius, const b2Vec2& axis, const b2Color& color) override
    {}
	void DrawSegment(const b2Vec2& p1, const b2Vec2& p2, const b2Color& color) override
    {}
	void DrawTransform(const b2Transform& xf) override
    {}
	void DrawPoint(const b2Vec2& p, float32 size, const b2Color& color) override
    {}
};

JsDebugDraw *g_debugDraw = nullptr;

void JsDebugDraw::DrawSolidPolygon(const b2Vec2* vertices, int32 vertexCount, const b2Color& color)
{
   // printf("debug poly %d\n", vertexCount); 
    if (vertexCount == 0)
        return;
    EM_ASM_(dbgPolyStart($0, $1), vertices[0].x, vertices[0].y);
    for(int i = 1; i < vertexCount; ++i)
        EM_ASM_(dbgPolyPoint($0, $1), vertices[i].x, vertices[i].y);
    EM_ASM(dbgPolyEnd());
}


class Scene
{
public:
    void initStart();

    template<typename FN>
    void contactBfs(b2Body* start, const FN& callback);
    void progress();

    void blast(b2Body* bd);
    void addAnim(Anim* a);

	vector<b2Body*> m_bodies;
    vector<BallInfo> m_binfos; // same size as bodies, this is the userData of bodies
	vector<Sprite> m_sprites;
    b2Body* m_lastHoverOn = nullptr;

    vector<Anim*> m_anims;
    int m_activeAnims = 0;
};
Scene *g_scene = nullptr;

#define BALL_RADIUS 0.26f
#define BALL_COUNT 120
#define START_DROP_FROM 5

void makeWalls(b2Body* groundBody)
{
    b2PolygonShape wallBox;

    float py = 20;
    float signx = 1;
    int count = 0;
    // zip-zag walls to avoid regularity in the balls ordering
    while(py > 9.5) {
        float width = 3 + signx*0.03; // 0.03 zip-zag movement
        float height = BALL_RADIUS*1.25+0.01; // 0.01 overlap of adjacent slabs
        //printf("py=%f  width=%f  height=%f\n", py, width, height);

        wallBox.SetAsBox(width, height, b2Vec2(-5, py), 0);
        groundBody->CreateFixture(&wallBox, 0.0f);
	    wallBox.SetAsBox(width, height, b2Vec2(5, py-BALL_RADIUS), 0);
	    groundBody->CreateFixture(&wallBox, 0.0f);

        py -= BALL_RADIUS*2.5;
        signx = -signx;

        ++count;
    }

    // top of walls
	wallBox.SetAsBox(3, 10, b2Vec2(-5, 30), 0);
	groundBody->CreateFixture(&wallBox, 0.0f);

	wallBox.SetAsBox(3, 10, b2Vec2(5, 30), 0);
	groundBody->CreateFixture(&wallBox, 0.0f);

    // bottom
	b2PolygonShape groundBox;
	groundBox.SetAsBox(50.0f, 10.0f); // The extents are the half-widths of the box.
	groundBody->CreateFixture(&groundBox, 0.0f);
}

void Scene::initStart()
{
	srand(0);

	b2Vec2 gravity(0.0f, -7.0f);

	// Construct a world object, which will hold and simulate the rigid bodies.
	g_world = new b2World(gravity);
    g_debugDraw = new JsDebugDraw();
    g_debugDraw->SetFlags(b2Draw::e_shapeBit);
    g_world->SetDebugDraw(g_debugDraw);

	// Define the ground body.
	b2BodyDef groundBodyDef;
	groundBodyDef.position.Set(0.0f, -10.0f);

	b2Body* groundBody = g_world->CreateBody(&groundBodyDef);

    makeWalls(groundBody);

	
    m_sprites.reserve(10);
    m_sprites.push_back(Sprite("norm_red", b2Color(255, 0, 0)));
    m_sprites.push_back(Sprite("norm_green", b2Color(0, 172, 0)));
    m_sprites.push_back(Sprite("norm_blue", b2Color(0, 0, 255)));
	
	// Define the dynamic body. We set its position and call the body factory.
	float px = -1.4;
	float py = START_DROP_FROM; //38.0;

    m_bodies.reserve(BALL_COUNT); // avoid relocation of these since we use their addresses
    m_binfos.reserve(BALL_COUNT);
	for(int i = 0; i < BALL_COUNT; ++i) // 230
	{
		if ((i % 5) != 0) 
			px += 2.8/5.0;
		else {
			px = -1.4;
			if ((i % 10) != 0) 
				px += 0.5;
			py += 0.8;
		}
        int randCol = rand() % g_scene->m_sprites.size();
        //float randEpsilon = (((float)rand() / RAND_MAX) - 0.5) * 0.04;
        float radius = BALL_RADIUS + 0;//randEpsilon;
        m_binfos.push_back(BallInfo(&m_sprites[randCol], i, radius));

		b2BodyDef bodyDef;
		bodyDef.type = b2_dynamicBody;
		bodyDef.position.Set(px, py);
		bodyDef.userData = &m_binfos.back();
		b2Body* body = g_world->CreateBody(&bodyDef);
		m_bodies.push_back(body);

		b2CircleShape dynamicBall;
		dynamicBall.m_radius = radius;

		b2FixtureDef fixtureDef;
		fixtureDef.shape = &dynamicBall;
		fixtureDef.restitution = 0.3;

		fixtureDef.density = 1.0f; // Set the box density to be non-zero, so it will be dynamic.
		fixtureDef.friction = 0.3f; // Override the default friction.

		body->CreateFixture(&fixtureDef);
		

	}
}

BallInfo* getBallInfo(b2Body* bd) {
    return (BallInfo*)bd->GetUserData();
}


template<typename FN>
void Scene::contactBfs(b2Body* start, const FN& callback)
{
    for(auto& bi: m_binfos)
        bi.m_visited = false;
    queue<pair<b2Body*, int>> q;

    //printf("--------------------\n");
    Sprite *startSprite = getBallInfo(start)->m_sprite;
    q.push(make_pair(start, 0));
    int iter = 0;
    for( ;!q.empty(); q.pop()) 
    {
        if (iter++ > 100) {
            printf("BUG!");
            break;
        }
        auto& entry = q.front();
        b2Body* bd = entry.first;
        auto* inf = getBallInfo(bd); // inf null - wall
        
       // if (inf != nullptr)
       //     printf("BFS %d id=%d  col=%s\n", entry.second, inf->m_index, inf->m_sprite->m_color.c_str()); 

        if (inf == nullptr || inf->m_sprite != startSprite) {
//            printf(" NO-CONT\n");
            continue;
        }

        callback(bd, entry.second);
        int nextIndex = entry.second + 1;
        for (b2ContactEdge* ce = bd->GetContactList(); ce; ce = ce->next)
        {
            b2Body* o = ce->other;
            auto* oinf = getBallInfo(o);
            if (oinf->m_visited)
                continue;
            float d = b2Distance(bd->GetPosition(), o->GetPosition());

//            if (ce->contact->GetManifold()->pointCount == 0) 
            if (d > oinf->m_radius + inf->m_radius + 0.01) // better test since the above sometimes misses things looking like contact
            {
         //       if (oinf != nullptr)
         //           printf("  CONT-NOM  id=%d  dist=%f\n", oinf->m_index, d);
                continue; // indicates it's just an AABB contact, not a physical one see Testbed Test::PreSolve
            }

            oinf->m_visited = true;

         //   if (oinf != nullptr)
         //       printf("  CONT  id=%d dist=%f\n", oinf->m_index, d);
            q.push(make_pair(o, nextIndex));
        }       // break;    }
}

void Scene::progress()
{
    for(int i = 0; i < m_anims.size(); ++ i) {
        auto* anim = m_anims[i];
        if (anim == nullptr)
            continue;
        if (!anim->progress()) {
            delete anim;
            m_anims[i] = nullptr;
            --m_activeAnims;
            if (m_activeAnims == 0) {
                //printf("COLLECTING ANIMS %d\n", m_anims.size());
                m_anims.clear();
            }
        }
    }
}

void Scene::addAnim(Anim* a) {
    m_anims.push_back(a);
    ++m_activeAnims;
}

void Scene::blast(b2Body* bd)
{
    // respawm the ball in another color
    auto *inf = getBallInfo(bd);
    inf->m_inHoveredGroup = false;
    int randCol = rand() % g_scene->m_sprites.size();
    inf->m_sprite = &m_sprites[randCol];

    bd->SetTransform(b2Vec2(0.0, 10.0), 0);
}


// --------------------------


void initStart() {
	g_scene = new Scene();
    g_scene->initStart();   
}



float32 timeStep = 1.0f / 60.0f;
int32 velocityIterations = 6;
int32 positionIterations = 2;

void cpp_progress()
{
    g_scene->progress();
	g_world->Step(timeStep, velocityIterations, positionIterations);

}


void cpp_draw()
{
    bool hasHover = false;
    //printf("~~~ %d\n", g_scene->m_bodies.size());
	for(auto* bd: g_scene->m_bodies)
	{
        auto* inf = getBallInfo(bd);
        if (inf->m_inHoveredGroup) {
            hasHover = true;
            continue; 	
        }
		b2Vec2 position = bd->GetPosition();
		float32 angle = bd->GetAngle();
        EM_ASM_(drawImg($0, $1, Pointer_stringify($2), $3, $4), position.x, position.y, inf->m_sprite->m_color.c_str(), inf->m_radius, angle);
    }

    if (hasHover)
    {
        // line
	    for(auto* bd: g_scene->m_bodies)
	    {
            auto* inf = getBallInfo(bd);
            if (!inf->m_inHoveredGroup)
                continue; 	
		    b2Vec2 position = bd->GetPosition();
            EM_ASM_(drawCircle($0, $1, null, HOVER_OUTLINE_COL, $2+HOVER_OUTLINE_OFFSET), position.x, position.y, inf->m_radius);
        }
        // erase between lines
	    for(auto* bd: g_scene->m_bodies)
	    {
            auto* inf = getBallInfo(bd);
            if (!inf->m_inHoveredGroup)
                continue; 	
		    b2Vec2 position = bd->GetPosition();
            EM_ASM_(drawCircle($0, $1, "#ffffff", null, $2+HOVER_OUTLINE_ERASE), position.x, position.y, inf->m_radius);
        }
        // balls
	    for(auto* bd: g_scene->m_bodies)
	    {
            auto* inf = getBallInfo(bd);
            if (!inf->m_inHoveredGroup) 
                continue; 	
		    b2Vec2 position = bd->GetPosition();
		    float32 angle = bd->GetAngle();
            EM_ASM_(drawImg($0, $1, Pointer_stringify($2), $3, $4), position.x, position.y, inf->m_sprite->m_color.c_str(), inf->m_radius, angle);
        }
        // alpha
	    for(auto* bd: g_scene->m_bodies)
	    {
            auto* inf = getBallInfo(bd);
            if (!inf->m_inHoveredGroup)
                continue; 	
		    b2Vec2 position = bd->GetPosition();
            EM_ASM_(drawCircle($0, $1, HOVER_MASK_COL, null, $2), position.x, position.y, inf->m_radius + 0.01);
        }
    }

    for(int i = 0; i < g_scene->m_anims.size(); ++ i) {
        auto* anim = g_scene->m_anims[i];
        if (anim == nullptr)
            continue;
        anim->draw();
    }

    //g_world->DrawDebugData();

}


struct MouseCallback : public b2QueryCallback 
{
	MouseCallback(float qx, float qy) 
		:qp(qx, qy)
	{}
	virtual bool ReportFixture(b2Fixture* fixture) {
		b2Body* b = fixture->GetBody();
        BallInfo* inf = getBallInfo(b);
		if (inf == nullptr)
			return true;
		//fixture->GetShape()->m_radius
		float d = b2Distance(b->GetPosition(), qp);
		if (d < BALL_RADIUS) {
			//printf("FOUND %p  %s\n", rb, inf->m_sprite->m_color.c_str());
			rb = b;
			return false; // can't be in more than one ball so we can stop the search
		}
		return true;
	}
	b2Body* rb = nullptr;
	b2Vec2 qp;
};

// from JS
void mouse_hover(float x, float y)
{
	b2AABB qa;
	qa.lowerBound.Set(x, y);
	qa.upperBound.Set(x, y);
	
	MouseCallback mc(x, y);
	g_world->QueryAABB(&mc, qa);
    
       
    //if (g_scene->m_lastHoverOn != mc.rb) 
    {
        //printf("$$ %p %p\n", g_scene->m_lastHoverOn, mc.rb);
        for(auto& inf: g_scene->m_binfos)
            inf.m_inHoveredGroup = false;
        if (mc.rb != nullptr) 
        {
            g_scene->contactBfs(mc.rb, [](b2Body* bd, int index) {
                auto* inf = getBallInfo(bd);
              //  printf("  IN-HOVER id=%d\n", inf->m_index);
                inf->m_inHoveredGroup = true;
            });
        }
        g_scene->m_lastHoverOn = mc.rb;
    }
}


class BlastAnim : public Anim
{
public:
    BlastAnim(b2Body* bd, int index) 
        : m_bd(bd), m_frameProg(index * 2) // remove a layer each 2 frames
    {
        // sample these before they get changed when the ball respawns
        m_pos = m_bd->GetPosition();
        auto* inf = getBallInfo(m_bd);
        m_radius = inf->m_radius;
        b2Color col = inf->m_sprite->m_blastColor;
        m_colpre = "rgba(" + to_string((int)col.r) + "," + to_string((int)col.g) + "," +  to_string((int)col.b) + ",";

        //printf("START %p  %f\n", this, m_radius);

    }
    virtual bool progress();
    virtual void draw();

    b2Body* m_bd;
    b2Vec2 m_pos;
    float m_radius;
    string m_colpre;
    int m_frameProg;
};

bool BlastAnim::progress() {
    --m_frameProg;
    if (m_frameProg > 0)
        return true;
    auto* inf = getBallInfo(m_bd);
    g_scene->blast(m_bd);
    if (m_frameProg > -10) 
        return true;
    return false;
}
void BlastAnim::draw() {
    if (m_frameProg > -10 && m_frameProg < 0) {
        float alpha = 0.5 + (float)m_frameProg/20.0;
        float radius = m_radius - (float)m_frameProg * 0.04;
        //printf("ANIM %p  %f  %f\n", this, radius, alpha);
        string cols = m_colpre + to_string(alpha) + ")";
        EM_ASM_(drawCircle($0, $1, Pointer_stringify($2), null, $3), m_pos.x, m_pos.y, cols.c_str(), radius);
    }
}


void mouse_up(float x, float y)
{
	b2AABB qa;
	qa.lowerBound.Set(x, y);
	qa.upperBound.Set(x, y);
	
	MouseCallback mc(x, y);
	g_world->QueryAABB(&mc, qa);

    Anim* first = nullptr;
    int count = 0;
    if (mc.rb) {
        g_scene->contactBfs(mc.rb, [&](b2Body* bd, int index) {
            auto* inf = getBallInfo(bd);
            auto* a = new BlastAnim(bd, index);
            if (count == 0)
                first = a;
            else if (first != nullptr) { // add the blasts only on the second
                g_scene->addAnim(first);
                g_scene->addAnim(a);
                first = nullptr;
            }
            else
                g_scene->addAnim(a);
            ++count;
        });

        if (first != nullptr) // there was only one
            delete first;

    }
}


EMSCRIPTEN_BINDINGS(my_module) 
{
    emscripten::function("initStart", &initStart);
    emscripten::function("cpp_progress", &cpp_progress);
    emscripten::function("cpp_draw", &cpp_draw);
	emscripten::function("mouse_hover", &mouse_hover);
    emscripten::function("mouse_up", &mouse_up);
}