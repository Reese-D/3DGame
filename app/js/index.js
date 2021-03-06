/*
 * Created by Reese and Miles De Wind
 *
 * First Person Movement utilized code from Mr Doob's github 
 * https://github.com/mrdoob/three.js/tree/master/examples/js/controls
 * specifically the PointerLockControls & First Person Controls
 *
 * A game in which the player attempts to shoot down a number of bouncing eyes.
 * These eyes split into four smaller copies when hit until they are of
 * a sufficiently small size to be eliminated. If struck by one of these
 * eyes the player is eliminated. Each eye hit yields one point.
 */
var camera, scene, renderer;
var geometry, material, mesh;
var controls;

var objects = [];
var bullet = [];
var structures = [];
var raycaster;

var myRadius = 10
var blocker = document.getElementById( 'blocker' );
var instructions = document.getElementById( 'instructions' );

var scoreboard = document.createElement('div');
// http://www.html5rocks.com/en/tutorials/pointerlock/intro/

let wallDist = 250

var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

if ( havePointerLock ) {

    var element = document.body;

    var pointerlockchange = function ( event ) {

	if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {

	    controlsEnabled = true;
	    controls.enabled = true;

	    blocker.style.display = 'none';

	} else {

	    controls.enabled = false;

	    blocker.style.display = '-webkit-box';
	    blocker.style.display = '-moz-box';
	    blocker.style.display = 'box';

	    instructions.style.display = '';

	}

    };

    var pointerlockerror = function ( event ) {

	instructions.style.display = '';

    };

    // Hook pointer lock state change events
    document.addEventListener( 'pointerlockchange', pointerlockchange, false );
    document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
    document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

    document.addEventListener( 'pointerlockerror', pointerlockerror, false );
    document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
    document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

    instructions.addEventListener( 'click', function ( event ) {

	instructions.style.display = 'none';

	// Ask the browser to lock the pointer
	element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
	element.requestPointerLock();

    }, false );

} else {

    instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';

}

init();
animate();

var controlsEnabled = false;

var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var moveUp = false;
var moveDown = false;
var canJump = false;
var shoot = false;
var shot = false;
var isHit = false;
var prevTime = performance.now();
var velocity = new THREE.Vector3();
var zRot = 0;

scoreboard.style.position = 'absolute';
//scoreboard.style.zIndex = 1;    // if you still don't see the label, try uncommenting this
scoreboard.style.width = 100;
scoreboard.style.height = 100;
//scoreboard.style.backgroundColor = "blue";
scoreboard.style.color = "gray"
scoreboard.style.top = 20 + 'px';
scoreboard.style.left = 20 + 'px';
document.body.appendChild(scoreboard);

var score = 0

function init() {
    wallDist = 400
    var audio1 = new Audio("js/audio/CreepyDollMusic.mp3");
    audio1.play();
    audio1.addEventListener("ended", function(){
     audio1.currentTime = 0;
     audio1.play()
   });
    var laughing = "js/audio/EvilLaughingWoman.mp3";
    var track = 1;
    var audio2 = new Audio("js/audio/MaleLaugh.mp3");
    audio2.play();
    audio2.addEventListener("ended", function(){
     audio2.currentTime = 0;
     if(track === 1){
       audio2.src = laughing;
       track = 2;
     }else if (track === 2){
       audio2.src = "js/audio/ImNotMad.mp3";
       track = 3;
     }else{
       audio2.src = "js/audio/MaleLaugh.mp3";
     }
     audio2.play();
   });
    topScore = Number(getCookieValue("topScore"))
    if(topScore == undefined){
	topScore = 0
    }
    score = 0
    scoreboard.innerHTML = "Score: <br/>Top Score: " + topScore;


    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1500 );

    scene = new THREE.Scene();
    //scene.fog = new THREE.Fog( 0xffffff, 0, 750 );

    var light = new THREE.PointLight(0xffffff, 1, 0, 1  );
    var ambient = new THREE.AmbientLight(0xffffff, 0.2);
    light.position.set( 0, wallDist, 0);
    scene.add( light );
    scene.add(ambient)

    controls = new THREE.PointerLockControls( camera );
    scene.add( controls.getObject() );

    var onKeyDown = function ( event ) {

	switch ( event.keyCode ) {

	case 38: // up
	case 87: // w
	    moveForward = true;
	    break;

	case 37: // left
	case 65: // a
	    moveLeft = true; break;

	case 40: // down
	case 83: // s
	    moveBackward = true;
	    break;

	case 39: // right
	case 68: // d
	    moveRight = true;
	    break;

	case 50: // 2
	    moveUp = true;
	    break;

	case 49: // 1
	    moveDown = true;
	    break;

	case 81: // q
	    zRot = -0.01;
	    break;

	case 69: // e
	    zRot = 0.01;
	    break;
	}

    };

    var onKeyUp = function ( event ) {

	switch( event.keyCode ) {

	case 38: // up
	case 87: // w
	    moveForward = false;
	    break;

	case 37: // left
	case 65: // a
	    moveLeft = false;
	    break;

	case 40: // down
	case 83: // s
	    moveBackward = false;
	    break;

	case 39: // right
	case 68: // d
	    moveRight = false;
	    break;

	case 32: //space
	    shoot = true;
	    break;

	case 50: // 2
	    moveUp = false;
	    break;

	case 49: // 1
	    moveDown = false;
	    break;

	case 81: // q
	    zRot = .0;
	    break;

	case 69: // e
	    zRot = 0;
	    break;
	}

    };

    document.addEventListener( 'keydown', onKeyDown, false );
    document.addEventListener( 'keyup', onKeyUp, false );

    raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, 1, 0 ), 0, myRadius  );


    //floor
    makePlane(0, - Math.PI/2, "js/textures/floor.jpg");
    //roof
    makePlane(wallDist, Math.PI/2, "js/textures/wall.jpg");

    //Creates wall translated on z axis
    makeWall(new THREE.Vector3(0,0,1), -wallDist, 0, "js/textures/wall.jpg");
    makeWall(new THREE.Vector3(0,0,1), wallDist, Math.PI, "js/textures/wall.jpg");

    //makes wall translated on x axis
    makeWall(new THREE.Vector3(1,0,0), wallDist, -Math.PI/2, "js/textures/wall.jpg");
    makeWall(new THREE.Vector3(1,0,0), -wallDist,  Math.PI/2, "js/textures/wall.jpg");

    //create eye
    //makeEye(translation axis, rotation axis, translation, rotation, texture, size, vertices, velocity)
    makeEye( new THREE.Vector3(1, 1, -1), new THREE.Vector3(0,0,0), 200, 0, "js/textures/eye1.jpg", 50, 20, new THREE.Vector3(-10, 140, 0));
    makeEye( new THREE.Vector3(-1, 1, 0), new THREE.Vector3(0,0,0), 200, 0, "js/textures/eye2.jpg", 50, 20, new THREE.Vector3(10, 150,0));
    makeEye( new THREE.Vector3(1, 1, 0), new THREE.Vector3(0,0,0), 200, 0, "js/textures/eye3.jpg", 50, 20, new THREE.Vector3(-50, 140,0));
    makeEye( new THREE.Vector3(0, 1, -1), new THREE.Vector3(0,0,0), 200, 0, "js/textures/eye4.jpg", 50, 20, new THREE.Vector3(-22, 40, 22));
    makeEye( new THREE.Vector3(0, 1, 1), new THREE.Vector3(0,0,0), 200, 0, "js/textures/eye6.jpg", 50, 20, new THREE.Vector3(10, 200, -25));
    makeEye( new THREE.Vector3(-1, 1, 1), new THREE.Vector3(0,0,0), 200, 0, "js/textures/eye5.jpg", 50, 20, new THREE.Vector3(50, 100, 30));

    geometry = new THREE.BoxGeometry( 20, 20, 20 );

    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor( 0xffffff );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    window.addEventListener( 'resize', onWindowResize, false );
}

function makeWall(axis, offset, rot, tex ){
    //wall left of starting position
    var wallTex = new THREE.TextureLoader().load(tex);
    wallTex.repeat.set(6,6);     // repeat the texture 6x in both s- and t- directions
    wallTex.wrapS = THREE.RepeatWrapping;
    wallTex.wrapT = THREE.RepeatWrapping;
    var wall = new THREE.Mesh (
	new THREE.PlaneGeometry(1000, 500, 100, 100),
	new THREE.MeshPhongMaterial({ map: wallTex})
    );
    wall.translateOnAxis(axis, offset);
    wall.translateY(wallDist/2);
    wall.rotateY(rot);
    scene.add(wall);
    structures.push(wall);
}

function makePlane(offset, rot, tex){
    var planeTex = new THREE.TextureLoader().load(tex);
    planeTex.repeat.set(6,6);     // repeat the texture 6x in both s- and t- directions
    planeTex.wrapS = THREE.RepeatWrapping;
    planeTex.wrapT = THREE.RepeatWrapping;
    var plane = new THREE.Mesh (
	new THREE.PlaneGeometry(1000, 1000, 100, 100),
	new THREE.MeshPhongMaterial({ map: planeTex})
    );
    plane.translateY( offset )
    plane.rotateX( rot );
    scene.add( plane )
}

function makeEye(tranAxis, rotAxis, offset, rot, tex, radius, vertices, velocity){
    var eyeTex = new THREE.TextureLoader().load(tex, THREE.SphericalRefractionMapping);
    geometry = new THREE.SphereGeometry(radius, vertices, vertices);
    // modify UVs to accommodate MatCap texture
    var faceVertexUvs = geometry.faceVertexUvs[ 0 ];
    for ( i = 0; i < faceVertexUvs.length; i ++ ) {
	var uvs = faceVertexUvs[ i ];
	var face = geometry.faces[ i ];
	for ( var j = 0; j < 3; j ++ ) {
            uvs[ j ].x = face.vertexNormals[ j ].x * .5 + .5;
            uvs[ j ].y = face.vertexNormals[ j ].y * .5 + .5;
	}
    }
    material = new THREE.MeshPhongMaterial({map: eyeTex});
    var eyeball = new THREE.Mesh( geometry, material );

    eyeball.overdraw = true;
    eyeball.castShadow = true;
    eyeball.translateOnAxis(tranAxis, offset);
    eyeball.rotateOnAxis(rotAxis, rot);
    scene.add( eyeball );
    eyeball.velocity = velocity
    eyeball.bounce = velocity.y;
    if(tex == "js/textures/bullet.jpg"){
	eyeball.geometry.name = "bullet";
	bullet.push(eyeball);
	objects.push(eyeball);
    }else{
	objects.push(eyeball);
    }
}




function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function spheresIntersect(sphere1, sphere2){
  try{
    var radiiSum = sphere1.geometry.boundingSphere.radius + sphere2.geometry.boundingSphere.radius;
  }catch (e) { // non-standard
     return false;
}
    var center1 = sphere1.position;
    var center2 = sphere2.position;
    if(center1.distanceTo(center2) < radiiSum){
	return true;
    }
    return false;
}

function vectorMax(v){
    return Math.max(v.x, v.y, v.z);
}

function vectorMin(v){
    return Math.min(v.x, v.y, v.z);
}

function normalizedVector(v){
    var max = Math.abs(vectorMax(v));
    return new THREE.Vector3(v.x / max, v.y / max, v.z/max);
}

function split(eyeObj, bulletIndex, eyeIndex){
    score += 1;
    var audio4 = new Audio("js/audio/slice.mp3");
    audio4.play();
    if(score > topScore){
	topScore = score
    }
    scoreboard.innerHTML = "Score: " + score + "<br/>Top Score: " + topScore
    if (eyeObj.geometry.boundingSphere.radius > 15){
	var x = eyeObj.velocity.x * 2;
	var y = eyeObj.velocity.y * 2;
	var z = eyeObj.velocity.z * 2;

	makeEye( new THREE.Vector3(0,1,0), new THREE.Vector3(0,0,0), 0, 0, eyeObj.material.map.image.currentSrc, eyeObj.geometry.boundingSphere.radius/2, 20, new THREE.Vector3(x, y, z));
	objects[objects.length-1].translateX(eyeObj.position.x + eyeObj.geometry.boundingSphere.radius/2 + 2);
	objects[objects.length-1].translateY(eyeObj.position.y);
	objects[objects.length-1].translateZ(eyeObj.position.z + eyeObj.geometry.boundingSphere.radius/2 + 2);

	makeEye( new THREE.Vector3(0,1,0), new THREE.Vector3(0,0,0), 0, 0, eyeObj.material.map.image.currentSrc, eyeObj.geometry.boundingSphere.radius/2, 20, new THREE.Vector3(-x, y,-z));
	objects[objects.length-1].translateX(eyeObj.position.x - eyeObj.geometry.boundingSphere.radius/2 - 2);
	objects[objects.length-1].translateY(eyeObj.position.y);
	objects[objects.length-1].translateZ(eyeObj.position.z - eyeObj.geometry.boundingSphere.radius/2 - 2);

	makeEye( new THREE.Vector3(0,1,0), new THREE.Vector3(0,0,0), 0, 0, eyeObj.material.map.image.currentSrc, eyeObj.geometry.boundingSphere.radius/2, 20, new THREE.Vector3(-x, y,+z));
	objects[objects.length-1].translateX(eyeObj.position.x - eyeObj.geometry.boundingSphere.radius/2 - 2);
	objects[objects.length-1].translateY(eyeObj.position.y);
	objects[objects.length-1].translateZ(eyeObj.position.z + eyeObj.geometry.boundingSphere.radius/2 + 2);

	makeEye( new THREE.Vector3(0,1,0), new THREE.Vector3(0,0,0), 0, 0, eyeObj.material.map.image.currentSrc, eyeObj.geometry.boundingSphere.radius/2, 20, new THREE.Vector3(+x, y, -z));
	objects[objects.length-1].translateX(eyeObj.position.x + eyeObj.geometry.boundingSphere.radius/2 + 2);
	objects[objects.length-1].translateY(eyeObj.position.y);
	objects[objects.length-1].translateZ(eyeObj.position.z - eyeObj.geometry.boundingSphere.radius/2 - 2);
    }
    scene.remove(objects[eyeIndex]);
    scene.remove(objects[bulletIndex]);
    if(bulletIndex < eyeIndex){
	objects.splice(eyeIndex,1)[0];
	objects.splice(bulletIndex,1)[0];
    }else{
	objects.splice(bulletIndex,1)[0];
	objects.splice(eyeIndex,1)[0];
    }
    bullet.splice(0,1)[0];
}

function getCookieValue(a) {
    var b = document.cookie.match('(^|;)\\s*' + a + '\\s*=\\s*([^;]+)');
    return b ? b.pop() : '';
}

function animate() {

    requestAnimationFrame( animate );
    
    var cameraDir = new THREE.Vector3();
    var shotDir = new THREE.Vector3();
    camera.getWorldDirection( cameraDir );
    if ( controlsEnabled ) {
	raycaster.ray.origin.copy( controls.getObject().position );
	raycaster.ray.origin.y -= myRadius;

	var intersections = raycaster.intersectObjects( objects );

	var time = performance.now();
	var delta = ( time - prevTime ) / 1000;

	velocity.x -= velocity.x * 10.0 * delta;
	velocity.z -= velocity.z * 10.0 * delta;
	velocity.y -= velocity.y * 10.0 * delta;
	//velocity.y = 0;

	if(bullet.length > 0){bullet[0].velocity.y = 0;}

	if(controls.getObject().position.x + 10 > wallDist){
	    controls.getObject().position.x -= 1;
	}
	if(controls.getObject().position.x -10 < -wallDist){
	    controls.getObject().position.x += 1;
	}
	if(controls.getObject().position.z + 10 > wallDist){
	    controls.getObject().position.z -= 1;
	}
	if(controls.getObject().position.z -10 < -wallDist){
	    controls.getObject().position.z += 1;
	}

	
	if ( moveForward ) velocity.z -= 400.0 * delta;
	if ( moveBackward ) velocity.z += 400.0 * delta;

	if ( moveLeft ) velocity.x -= 400.0 * delta;
	if ( moveRight ) velocity.x += 400.0 * delta;

	if ( moveUp ) velocity.y -= 400.0 * delta;
	if ( moveDown ) velocity.y += 400.0 * delta;
	

	controls.getObject().translateX( velocity.x * delta );
	controls.getObject().translateY( velocity.y * delta );
	controls.getObject().translateZ( velocity.z * delta );

	var tmp = new Object();
	tmp.geometry = new Object();
	tmp.geometry.boundingSphere = new Object();
	tmp.geometry.boundingSphere.radius = myRadius;
	tmp.position = controls.getObject().position.clone()
	tmp.position.y -= (myRadius/2);

	for(var i = 0; i < objects.length; i++){
	    if(objects[i].geometry.name != "bullet"){
		objects[i].lookAt(-10000000000,0,0)
	    }
	    if(spheresIntersect(objects[i], tmp)){
		score = 0;
		document.cookie = "topScore=" + topScore;
		location.reload()
	    }
	    objects[i].velocity.y -= 9.8 * 10.0 * delta;
	    if(bullet.length > 0){bullet[0].velocity.y = 0;}
	    objects[i].translateX( objects[i].velocity.x * delta );
	    objects[i].translateY( objects[i].velocity.y * delta );
	    objects[i].translateZ( objects[i].velocity.z * delta );
      try{
        var radius = objects[i].geometry.boundingSphere.radius;
      }catch(e){
        //do nothing
      }
	    var currObj = objects.splice(i, 1)[0];

	    if(currObj.position.x + radius > wallDist || currObj.position.x - radius < -wallDist){
		if(currObj.position.x + radius > wallDist){
		    currObj.position.x = wallDist - radius;
		}else if(currObj.position.x - radius < -wallDist){
		    currObj.position.x = -wallDist + radius;
		}
		currObj.velocity.x *= -1
	    }
	    if(currObj.position.y + radius > wallDist || currObj.position.y - radius <= 0){//currObj.position.y - radius < -wallDist){
		if(currObj.position.y + radius > wallDist){
		    currObj.position.y = wallDist - radius;
		}else if(currObj.position.y - radius < 0){
		    currObj.position.y = radius;
		}
		currObj.velocity.y *= -1

	    }
	    if(currObj.position.z + radius > wallDist || currObj.position.z - radius < -wallDist){
		if(currObj.position.z + radius > wallDist){
		    currObj.position.z = wallDist - radius;
		}else if(currObj.position.z - radius < -wallDist){
		    currObj.position.z = -wallDist + radius;
		}
		currObj.velocity.z *= -1
	    }
	    objects.splice(i, 0, currObj);

	    for(var j = i; j < objects.length; j++){
		if(i == j){
		    continue;
		}
		if(spheresIntersect(objects[i], objects[j])){
		    if(objects[i].geometry.name === "bullet"){
			shoot = false;
			shot = false;
			split(objects[j], i, j);
		    }else if(objects[j].geometry.name === "bullet"){
			shoot = false;
			shot = false;
			split(objects[i], j, i);
		    }else{
			var collision1 = objects[i].position.clone().sub(objects[j].position)
			var dot1 = objects[i].velocity.clone().normalize().dot(collision1.clone().normalize())
			var v1i = collision1.clone().normalize().multiplyScalar(dot1 * objects[i].velocity.length())

			var collision2 = objects[j].position.clone().sub(objects[i].position)
			var dot2 = objects[j].velocity.clone().normalize().dot(collision2.clone().normalize())
			var v2i = collision2.clone().normalize().multiplyScalar(dot2 * objects[j].velocity.length())

			objects[i].velocity.sub(v1i);
			objects[j].velocity.sub(v2i);

			var m1 = objects[i].geometry.boundingSphere.radius
			var m2 = objects[j].geometry.boundingSphere.radius

			var p1 = v1i.clone().multiplyScalar(m1 * 2)
			var p2 = v2i.clone().multiplyScalar(m2)
			var p3 = v2i.clone().multiplyScalar(m1)
			var v2f = p1.add(p2).sub(p3).divideScalar(m1 + m2)

			var v1f = v2f.clone().sub(v1i.clone()).add(v2i.clone());

			objects[i].velocity.add(v1f)
			objects[j].velocity.add(v2f)
		    }

		}

	    }
	    if(objects[i].geometry.name != "bullet"){
		objects[i].lookAt(controls.getObject().position)
	    }
	}
	if ( controls.getObject().position.y < 10 ) {
	    velocity.y = 0;
	    controls.getObject().position.y = 10;
	    canJump = true;
	}
	prevTime = time;
    }
    if(shoot === true && shot === false){
        shotDir = cameraDir;
        shoot = false;
        shot = true;
        if(bullet.length < 1){
            makeEye( new THREE.Vector3(0, 1, 0), new THREE.Vector3(0,0,0), -100, 0, "js/textures/bullet.jpg", 3, 100,  new THREE.Vector3(0,0,0));
        }
        bullet[0].position.x = controls.getObject().position.x;
      	bullet[0].position.y = controls.getObject().position.y;
      	bullet[0].position.z = controls.getObject().position.z;
        bullet[0].velocity.x = 0;
        bullet[0].velocity.y = 0;
        bullet[0].velocity.z = 0;
        bullet[0].bounce = 0;
        bullet[0].translateOnAxis(cameraDir, 15);
        var audio3 = new Audio("js/audio/bang.mp3");
        audio3.play();
    }
    if(shot === true){
	radius = bullet[0].geometry.boundingSphere.radius;
	//bullet[0].position.y = controls.getObject().position.y;
	if(bullet[0].position.x + radius +2 > wallDist || bullet[0].position.x - radius -2 < -wallDist){
	    shoot = false;
	    shot = false;
	}
	if(bullet[0].position.y + radius +2 > wallDist || bullet[0].position.y - radius -2 < -wallDist){
	    shoot = false;
	    shot = false;
	}
	if(bullet[0].position.z + radius +2 > wallDist || bullet[0].position.z - radius -2 < -wallDist){
	    shoot = false;
	    shot = false;
	}
	bullet[0].translateOnAxis(cameraDir, 5);
    }



    renderer.render( scene, camera );

}
