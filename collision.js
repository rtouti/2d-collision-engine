function Vec2(x, y){
	this.x = x;
	this.y = y;
}
Vec2.prototype.normalize = function(){
	
}
Vec2.prototype.length = function(){
	var x = this.x,
		y = this.y;

	return Math.sqrt((x+x)*(x+x), (y+y)*(y+y));
}

function Circle(x, y, radius){
	this.pos = new Vec2(x, y);
	this.r = radius;
}
Circle.prototype.overlap = function(other){
	var p     = this.pos,
		dist2 = Math.pow(p.x-other.pos.x, 2) + Math.pow(p.y-other.pos.y, 2),   //Distance squared
		r     = this.r;
	
	if(dist2 < Math.pow(r+other.r, 2))
		return {result:true, dist2:dist2};
	else
		return {result:false, dist2:dist2};
}

function Entity(x, y, size){
	//this.pos = position;
	this.vel = new Vec2(0.0, 0.0);
	this.acc = new Vec2(0.0, 0.0);
	this.bounce = 0.3;
	
	this.size = size;
	this.halfSize = size/2;
	
	this.bounds = new Circle(x, y, size/2);
}
Entity.prototype.update = function(){
	
}

function Level(map){
	this.map = map;
	this.camera = {x:0.0, y:0.0};
	
	this.entities = [];
	this.gravity = new Vec2(0.0, 0.0);
}
Level.prototype.update = function(dt){
	var es  = this.entities,
		map = this.map;

	//Perform entity-entity collision detection and resolution (if a collision is detected)
	var e = 250;   //Repulsion force
	for(var i = 0; i < es.length; i++){
		for(var j = i+1; j < es.length; j++){
			var e1 = es[i],
				e2 = es[j],
				b1 = e1.bounds,
				b2 = e2.bounds;
			
			//Perform collision resolution logic if they overlap
			var coll = e1.bounds.overlap(e2.bounds);
			if(coll.result){
				var dist = Math.sqrt(coll.dist2);
				//if(dist < 0.001 && dist > -0.001)
				//	dist = 0.001;
				
				var ratio = 1.0-dist/(b1.r+b2.r),//Math.pow(1.0, 1.0-dist/(b1.r+b2.r)),
					//force = (e*ratio)*((ratio-1.0)*-1);
					force = e*ratio;//*ratio*ratio;

				var d = new Vec2(b1.pos.x-b2.pos.x, b1.pos.y-b2.pos.y);   //Vector between e1 and e2
				d.normalize();
				//If the 2 entities are right on top of each other, add a little random bias so they will repulse each other
				if(d.x == 0 && d.y == 0){
					d.x = Math.random()*0.01;
					d.y = Math.random()*0.01;
					if(Math.random() < 0.5)
						d.x *= -1;
					if(Math.random() < 0.5)
						d.y *= -1;
				}
				
				e1.vel.x += d.x*force*dt;
				e1.vel.y += d.y*force*dt;
				e2.vel.x -= d.x*force*dt;
				e2.vel.y -= d.y*force*dt;
			}
		}
	}
	
	//Update entities on the x axis and perform wall-entity collision detection and resolution
	for(var i = 0; i < es.length; i++){
		var e      = es[i],
			b      = e.bounds,
			bounce = e.bounce;

		e.vel.x += e.acc.x*dt;
		e.bounds.pos.x += e.vel.x*dt;
		e.vel.x *= 0.98;
		
		var x1 = Math.floor((b.pos.x-e.halfSize)/map.tileSize),
			x2 = Math.floor((b.pos.x+e.halfSize)/map.tileSize),
			y1 = Math.floor((b.pos.y-e.halfSize)/map.tileSize),
			y2 = Math.floor((b.pos.y+e.halfSize)/map.tileSize);
		for(var y = y1; y <= y2; y++){
			for(var x = x1; x <= x2; x++){
				//If it actually overlap on the x axis
				if(this.overlapsWithMap(e, x, y)){
					if(e.vel.x > 0){
						b.pos.x = x*map.tileSize-map.tileSize/2;
						//e.vel.x = 0;
						e.vel.x = -bounce*e.vel.x;
					} else if(e.vel.x < 0){
						//If it actually overlap on the x axis
						if(b.pos.x-map.tileSize/2 < x*map.tileSize+map.tileSize){
							b.pos.x = x*map.tileSize+map.tileSize+map.tileSize/2;
							//e.vel.x = 0;
							e.vel.x = -bounce*e.vel.x;
						}
					}
				}
			}
		}
	}
	
	//Update entities on the y axis and perform wall-entity collision detection and resolution
	for(var i = 0; i < es.length; i++){
		var e = es[i],
			b = e.bounds;

		e.vel.y += e.acc.y*dt;
		e.vel.y += this.gravity.y*dt;
		e.bounds.pos.y += e.vel.y*dt;
		e.vel.y *= 0.98;
		
		var x1 = Math.floor((b.pos.x-e.halfSize)/map.tileSize),
			x2 = Math.floor((b.pos.x+e.halfSize)/map.tileSize),
			y1 = Math.floor((b.pos.y-e.halfSize)/map.tileSize),
			y2 = Math.floor((b.pos.y+e.halfSize)/map.tileSize);
		for(var y = y1; y <= y2; y++){
			for(var x = x1; x <= x2; x++){
				//If it actually overlap on the y axis
				if(this.overlapsWithMap(e, x, y)){
					if(e.vel.y > 0){
						b.pos.y = y*map.tileSize-map.tileSize/2;
						//e.vel.y = 0;
						e.vel.y = -bounce*e.vel.y;
					} else if(e.vel.y < 0){
						b.pos.y = y*map.tileSize+map.tileSize+map.tileSize/2;
						//e.vel.y = 0;
						e.vel.y = -bounce*e.vel.y;
					}
				}
			}
		}
	}
}
Level.prototype.overlapsWithMap = function(e, tileX, tileY){
	var map     = this.map,
		type    = map.content[tileX+map.width*tileY],
		b       = e.bounds,
		ts      = map.tileSize,
		halfts  = ts/2,
		x       = tileX*ts,
		y       = tileY*ts;
	
	if(type === 0)
		return false;

	return !(b.pos.x+halfts <= x || b.pos.x-halfts >= x+ts || b.pos.y+halfts <= y || b.pos.y-halfts >= y+ts);
}


