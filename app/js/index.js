
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

	//case 32: // space
	//    if ( canJump === true ) velocity.y += 350;
	//    canJump = false;
	//    break;

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

    //floor
    makePlane(0, - Math.PI/2, "js/textures/floor.jpg");
    //roof
    makePlane(500, Math.PI/2, "js/textures/wall.jpg");

    //Creates wall translated on z axis
    makeWall(new THREE.Vector3(0,0,1), -500, 0, "js/textures/wall.jpg");
    makeWall(new THREE.Vector3(0,0,1), 500, Math.PI, "js/textures/wall.jpg");

    //makes wall translated on x axis
    makeWall(new THREE.Vector3(1,0,0), 500, -Math.PI/2, "js/textures/wall.jpg");
    makeWall(new THREE.Vector3(1,0,0), -500,  Math.PI/2, "js/textures/wall.jpg");

    //create eye
    //makeEye(translation axis, rotation axis, translation, rotation, texture, size, vertices)
    makeEye( new THREE.Vector3(0, 1, 0), new THREE.Vector3(0,0,0), 20, 0, "js/textures/bullet.jpg", .2, 100);
    makeEye( new THREE.Vector3(0, 1, 0), new THREE.Vector3(0,0,0), 20, 0, "js/textures/eye2.jpg", 10, 100);


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
    wall.translateY(250);
    wall.rotateY(rot);
    scene.add(wall);
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

function makeEye(axis1, axis2, offset, rot, tex, radius, vertices){
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
    eyeball.translateOnAxis(axis1, offset);
    eyeball.rotateOnAxis(axis2, rot);
    scene.add( eyeball );
    if(tex == "js/textures/bullet.jpg"){
      bullet.push(eyeball);
    }else{
      objects.push(eyeball);
    }
}




function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    requestAnimationFrame( animate );

    var cameraDir = new THREE.Vector3();
    var shotDir = new THREE.Vector3();
    camera.getWorldDirection( cameraDir);
    if ( controlsEnabled ) {
	     raycaster.ray.origin.copy( controls.getObject().position );
       raycaster.ray.origin.y -= 10;

       var intersections = raycaster.intersectObjects( objects );
	     var isOnObject = intersections.length > 0;

	     var time = performance.now();
       var delta = ( time - prevTime ) / 1000;

       velocity.x -= velocity.x * 10.0 * delta;
	     velocity.z -= velocity.z * 10.0 * delta;

	     velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

       if ( moveForward ) velocity.z -= 400.0 * delta;
	     if ( moveBackward ) velocity.z += 400.0 * delta;

       if ( moveLeft ) velocity.x -= 400.0 * delta;
	     if ( moveRight ) velocity.x += 400.0 * delta;

       if ( isOnObject === true ) {
	        velocity.y = Math.max( 0, velocity.y );

	        canJump = true;
	     }

	     controls.getObject().translateX( velocity.x * delta );
       controls.getObject().translateY( velocity.y * delta );
       controls.getObject().translateZ( velocity.z * delta );

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
    }
    if(shot === true){
        bullet[0].translateOnAxis(cameraDir, 2);
    }else{
      bullet[0].position.x = controls.getObject().position.x;
      bullet[0].position.y = controls.getObject().position.y;
      bullet[0].position.z = controls.getObject().position.z;
      bullet[0].translateOnAxis(cameraDir, 3);
    }
    console.log(shoot);
    console.log(shot);


    renderer.render( scene, camera );

}
