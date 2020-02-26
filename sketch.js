// variable to hold a reference to our A-Frame world
var world;

// array to hold some particles
var snow=[];

var sensor;

var textures=['wrapper1','wrapper2','wrapper3'];

//array to hold presents
var projectiles=[];
//array to hold our targets
var targets=[];

var score=0;

function setup() {
	// construct the A-Frame world
	// this function requires a reference to the ID of the 'a-scene' tag in our HTML document
	world = new World('VRScene');

	world.setUserPosition(0,1,0);
	userPos=world.getUserPosition();

	sensor= new OutFrontSensor();

	var floor = new Plane({
		x:0, y:0, z:0,
		width: 100,height: 100,
		asset: "snowground",
		repeatX:10,
		repeatY:10,
		rotationX:-90
	});
	world.add(floor);

	//Snowing!
	for (var i=0; i<200; i++){
			snow.push(new Snow());
		}

	//Snowman
	for (var j=0; j<20; j++){
		Snowman();
	}

	//Tree
	for (var l=0; l<20; l++){
		Tree();
	}

	//Rudolph
	for (var u=0; u<20; u++){
		rudolph = new OBJ({
			asset: 'model_obj',
			mtl: 'materials_mtl',
			x:random(-50,50), y: random (3,6), z: random(-50,50),
			scaleX:3 , scaleY:3, scaleZ:3,
		});
		world.add(rudolph);
	}

	for (var k=0; k<100; k++){
		var t=textures[int(random(textures.length))];
		var temp = new Box({
			x:random(-50,50), y: random(10,30) , z:random(-50,50) ,
			width: random (1,3), height:random(1,3),depth: random(1,3),
			asset:t,
		});
		world.add(temp);
		targets.push(temp);
	}

}

function draw() {
		var pos=world.getUserPosition();

		//make the world snow!
		for (var i = 0; i < snow.length; i++) {
	        snow[i].move();
	  }

		//wrap around the World
		if (pos.x > 50) {
			world.setUserPosition(-50, pos.y, pos.z);
		}
		else if (pos.x < -50) {
			world.setUserPosition(50, pos.y, pos.z);
		}
		if (pos.z > 50) {
			world.setUserPosition(pos.x, pos.y, -50);
		}
		else if (pos.z < -50) {
			world.setUserPosition(pos.x, pos.y, 50);
		}

		//check if there is an object in front of the user
		var distance=sensor.getDistanceToNearestObjectInFrontOfUser();

		if (distance >0.5 && mouseIsPressed){
			world.moveUserForward(0.1);
		}
		else{
			world.moveUserForward(0);
		}

		// tell all projectiles to move
		for (var i = 0; i < projectiles.length; i++) {
			projectiles[i].move();

			// get WORLD position for this projectile
			var projectilePosition = projectiles[i].myCube.getWorldPosition();

			// did the projectile go off the screen? if so, just remove it and move into the next one
			if (projectilePosition.x > 50 || projectilePosition.x < -50 || projectilePosition.z > 50 || projectilePosition.z < -50) {
				world.remove(projectiles[i].myContainer);
				projectiles.splice(i, 1);
				i--;
				continue;
		}

		// otherwise check for collisions with our targets
		for (var j = 0; j < targets.length; j++) {

			// compute distance
			var d = dist(projectilePosition.x, projectilePosition.y, projectilePosition.z, targets[j].getX(), targets[j].getY(), targets[j].getZ());
			if (d < 2) {
				// hit!
				world.remove(targets[j]);
				targets.splice(j, 1);
				score++
				break;
			}
		}
	}
}


	function Snow(){
	  this.x=random(userPos.x-50,userPos.x+50);
	  this.y=random(5,10);
	  this.z=random(userPos.z-50,userPos.z+50);
	  this.radius=0.08;

	  this.snowshape=new Sphere({
	    x:this.x, y:this.y,z:this.z,
	    red:250,green:250,blue:250,
	    radius:this.radius
	  });
	  world.add(this.snowshape);

	  this.move = function(){
	    this.snowshape.nudge(0,-.04,0);
	    if (this.snowshape.getY()<=0){
	      this.x=random(userPos.x-50,userPos.x+50);
	      this.y=random(5,10);
	      this.z=random(userPos.z-50,userPos.z+50);
	      this.snowshape.setX(this.x);
	      this.snowshape.setY(this.y);
	      this.snowshape.setZ(this.z);
	    }
	  }
}

function Snowman(){
	this.x=random(-50,50);
	this.y=2;
	this.z=random(-50,50);
	this.radius=2;
	this.belowsphere=new Sphere({
		x:this.x, y:this.y, z:this.z,
		red: 255, green: 255, blue: 255,
		radius: this.radius,
	});
	world.add(this.belowsphere);

	this.abovesphere=new Sphere({
		x:this.x, y:this.y+3, z:this.z,
		red: 255, green:255, blue: 255,
		radius: this.radius/1.5,
	});
	world.add(this.abovesphere);
}

function Tree(){
	this.x=random(-50,50);
	this.y=1;
	this.z=random(-50,50);
	this.trunk = new Cylinder({
		x: this.x, y:this.y, z: this.z,
		red:139, green: 60, blue: 19,
		height:4,
		radius:1.5
	});
	this.leaves=new Cone({
		x: this.x, y:this.y+4, z: this.z,
		red:71, green: 93, blue: 71,
		height: 8,
		radiusBottom: 4, radiusTop:0.01,
	});
	world.add(this.trunk);
	world.add(this.leaves);
}


function OutFrontSensor() {
  // raycaster - think of this like a "beam" that will fire out of the
  // front of the user's position to figure out what is below their avatar
  this.rayCaster = new THREE.Raycaster();
  this.cursorPosition = new THREE.Vector2(0,0);
  this.intersects = [];

  this.getDistanceToNearestObjectInFrontOfUser = function() {
    // fire off a beam
    this.rayCaster.setFromCamera( this.cursorPosition, world.camera.holder.object3D.children[1]);

    // see what's in front
    this.intersects = this.rayCaster.intersectObjects( world.threeSceneReference.children, true );
    if (this.intersects.length > 0) {
      return this.intersects[0].distance;
    }
    return 1000;
  }
}

function keyPressed(){
	var temp= new Projectile();
	projectiles.push(temp);
}

function Projectile(){
	var userPosition=world.getUserPosition();
	var userRotation= world.getUserRotation();
	this.myContainer = new Container3D({
		x: userPosition.x, y: userPosition.y, z: userPosition.z,
		rotationX: userRotation.x,
		rotationY: userRotation.y,
		rotationZ: userRotation.z
	});
	world.add(this.myContainer);

	this.myCube = new Box({
		x:0,
		y:0,
		z:0,
		width:0.1,
		height:0.1,
		width:0.1,
		red:random(255),
		blue:random(255),
		green:random(255)
	});

	this.myContainer.addChild(this.myCube);

	this.move= function(){
		this.myCube.nudge(0,0,-0.2);
	}
}
