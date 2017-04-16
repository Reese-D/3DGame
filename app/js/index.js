
var camera, scene, renderer;
var geometry, material, mesh;
var controls;

var objects = [];
var bullet = [];
var structures = [];
var raycaster;

var blocker = document.getElementById( 'blocker' );
var instructions = document.getElementById( 'instructions' );

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
var canJump = false;
var shoot = false;
var shot = false;
var isHit = false;
var prevTime = performance.now();
var velocity = new THREE.Vector3();

function init() {

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1500 );

    scene = new THREE.Scene();
    //scene.fog = new THREE.Fog( 0xffffff, 0, 750 );

    var light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.75 );
    light.position.set( 0.5, 1, 0.75 );
    scene.add( light );

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
	}

    };

    document.addEventListener( 'keydown', onKeyDown, false );
    document.addEventListener( 'keyup', onKeyUp, false );

    raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );
    wallDist = 400

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

    eyeball.xRay = new THREE.Raycaster(eyeball.position, new THREE.Vector3(1,0,0), 0, radius+3);
    eyeball.nxRay = new THREE.Raycaster(eyeball.position, new THREE.Vector3(-1,0,0), 0, radius+3);
    eyeball.yRay = new THREE.Raycaster(eyeball.position, new THREE.Vector3(0,1,0), 0, radius+3);
    eyeball.nyRay = new THREE.Raycaster(eyeball.position, new THREE.Vector3(0,-1,0), 0, radius+3);
    eyeball.zRay = new THREE.Raycaster(eyeball.position, new THREE.Vector3(0,0,1), 0, radius+3);
    eyeball.nzRay = new THREE.Raycaster(eyeball.position, new THREE.Vector3(0,0,-1), 0, radius+3);

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
    var radiiSum = sphere1.geometry.boundingSphere.radius + sphere2.geometry.boundingSphere.radius;
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
  if (eyeObj.geometry.boundingSphere.radius > 15){
    //var x = Math.floor(Math.random() * 2500 / (eyeObj.geometry.boundingSphere.radius / 2));
    //var y = Math.floor(Math.random() * 2500 / (eyeObj.geometry.boundingSphere.radius / 2));
    //var z = Math.floor(Math.random() * 2500 / (eyeObj.geometry.boundingSphere.radius / 2));
    var x = eyeObj.velocity.x * 2;
    var y = eyeObj.velocity.y * 2;
    var z = eyeObj.velocity.z * 2;

    makeEye( new THREE.Vector3(0,1,0), new THREE.Vector3(0,0,0), 0, 0, eyeObj.material.map.image.currentSrc, eyeObj.geometry.boundingSphere.radius/2, 20, new THREE.Vector3(x, y, z));
    objects[objects.length-1].translateX(eyeObj.position.x + eyeObj.geometry.boundingSphere.radius/2);
    objects[objects.length-1].translateY(eyeObj.position.y);
    objects[objects.length-1].translateZ(eyeObj.position.z + eyeObj.geometry.boundingSphere.radius/2);

    makeEye( new THREE.Vector3(0,1,0), new THREE.Vector3(0,0,0), 0, 0, eyeObj.material.map.image.currentSrc, eyeObj.geometry.boundingSphere.radius/2, 20, new THREE.Vector3(-x, y,-z));
    objects[objects.length-1].translateX(eyeObj.position.x - eyeObj.geometry.boundingSphere.radius/2);
    objects[objects.length-1].translateY(eyeObj.position.y);
    objects[objects.length-1].translateZ(eyeObj.position.z - eyeObj.geometry.boundingSphere.radius/2);

    makeEye( new THREE.Vector3(0,1,0), new THREE.Vector3(0,0,0), 0, 0, eyeObj.material.map.image.currentSrc, eyeObj.geometry.boundingSphere.radius/2, 20, new THREE.Vector3(-x, y,+z));
    objects[objects.length-1].translateX(eyeObj.position.x - eyeObj.geometry.boundingSphere.radius/2);
    objects[objects.length-1].translateY(eyeObj.position.y);
    objects[objects.length-1].translateZ(eyeObj.position.z + eyeObj.geometry.boundingSphere.radius/2);

    makeEye( new THREE.Vector3(0,1,0), new THREE.Vector3(0,0,0), 0, 0, eyeObj.material.map.image.currentSrc, eyeObj.geometry.boundingSphere.radius/2, 20, new THREE.Vector3(+x, y, -z));
    objects[objects.length-1].translateX(eyeObj.position.x + eyeObj.geometry.boundingSphere.radius/2);
    objects[objects.length-1].translateY(eyeObj.position.y);
    objects[objects.length-1].translateZ(eyeObj.position.z - eyeObj.geometry.boundingSphere.radius/2);
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

function animate() {

    requestAnimationFrame( animate );

    var cameraDir = new THREE.Vector3();
    var shotDir = new THREE.Vector3();
    camera.getWorldDirection( cameraDir );
    if ( controlsEnabled ) {
	raycaster.ray.origin.copy( controls.getObject().position );
	raycaster.ray.origin.y -= 10;

	for(var i = 0; i < objects.length; i++){
	    for(var j = i; j < objects.length; j++){
		if(i == j){
		    continue;
		}
		//TODO: if spheresIntersect deflect
	    }
	}


	var intersections = raycaster.intersectObjects( objects );
	//console.log(objects[0]);

	var time = performance.now();
	var delta = ( time - prevTime ) / 1000;

	velocity.x -= velocity.x * 10.0 * delta;
	velocity.z -= velocity.z * 10.0 * delta;
	velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
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



	controls.getObject().translateX( velocity.x * delta );
	controls.getObject().translateY( velocity.y * delta );
	controls.getObject().translateZ( velocity.z * delta );

	for(var i = 0; i < objects.length; i++){
	    objects[i].velocity.y -= 9.8 * 10.0 * delta;
      if(bullet.length > 0){bullet[0].velocity.y = 0;}
	    //objects[i].velocity.y -= 1;
	    //console.log(9.8 * 100.0 * delta);

	    objects[i].translateX( objects[i].velocity.x * delta );
	    objects[i].translateY( objects[i].velocity.y * delta );
	    objects[i].translateZ( objects[i].velocity.z * delta );
	    var radius = objects[i].geometry.boundingSphere.radius;
	    // if(objects[i].position.y - radius <= 0){
	    // 	objects[i].position.y += 2;
	    //  	objects[i].velocity.y *= -1;
	    // 	//objects[i].bounce;
	    // }
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


			// var a1 = objects[i].position.angleTo(objects[j].position)
			// var v1i = objects[i].velocity.clone()
			// var max1 = vectorMax(v1i)
			// var norm1 = normalizedVector(v1i)
			// v1i.applyAxisAngle(norm1, max1)

			var collision1 = objects[i].position.clone().sub(objects[j].position)
			var dot1 = objects[i].velocity.clone().normalize().dot(collision1.clone().normalize())
			var v1i = collision1.clone().normalize().multiplyScalar(dot1 * objects[i].velocity.length())

			var collision2 = objects[j].position.clone().sub(objects[i].position)
			var dot2 = objects[j].velocity.clone().normalize().dot(collision2.clone().normalize())
			var v2i = collision2.clone().normalize().multiplyScalar(dot2 * objects[j].velocity.length())
			console.log(v2i)
			// var a2 = objects[j].position.angleTo(objects[i].position)
			// var v2i = objects[j].velocity.clone()
			// var max2 = vectorMax(v2i)
			// var norm2 = normalizedVector(v2i)
			// v1i.applyAxisAngle(norm2, max2)

			objects[i].velocity.sub(v1i);
			objects[j].velocity.sub(v2i);

			var m1 = objects[i].geometry.boundingSphere.radius
			var m2 = objects[j].geometry.boundingSphere.radius

			var p1 = v1i.clone().multiplyScalar(m1 * 2)
			var p2 = v2i.clone().multiplyScalar(m2)
			var p3 = v2i.clone().multiplyScalar(m1)
			var v2f = p1.add(p2).sub(p3).divideScalar(m1 + m2)

			var v1f = v2f.clone().sub(v1i.clone()).add(v2i.clone());
			//console.log("initial velocity of 1: ", objects[i].velocity)
			//console.log("initial velocity of 2: ", objects[j].velocity)
			objects[i].velocity.add(v1f)
			objects[j].velocity.add(v2f)
			//console.log("final velocity of 1: ", objects[i].velocity)
			//console.log("final velocity of 2: ", objects[j].velocity)
		    }

		}

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
    }
    if(shot === true){
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
