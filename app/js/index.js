
var camera, scene, renderer;
var geometry, material, mesh;
var controls;

var objects = [];

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

var prevTime = performance.now();
var velocity = new THREE.Vector3();

function init() {

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1200 );

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

	case 32: // space
	    if ( canJump === true ) velocity.y += 350;
	    canJump = false;
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

	}

    };

    document.addEventListener( 'keydown', onKeyDown, false );
    document.addEventListener( 'keyup', onKeyUp, false );

    raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

    // floor



    var floorTex = new THREE.TextureLoader().load("js/textures/floor.jpg");
    floorTex.repeat.set(6,6);     // repeat the texture 6x in both s- and t- directions
    floorTex.wrapS = THREE.RepeatWrapping;
    floorTex.wrapT = THREE.RepeatWrapping;
    var floor = new THREE.Mesh (
        new THREE.PlaneGeometry(1000, 1000, 100, 100),
        new THREE.MeshPhongMaterial({ map: floorTex})
    );
    floor.rotateX( - Math.PI /2);
    scene.add( floor );

    var roofTex = new THREE.TextureLoader().load("js/textures/wall.jpg");
    roofTex.repeat.set(6,6);     // repeat the texture 6x in both s- and t- directions
    roofTex.wrapS = THREE.RepeatWrapping;
    roofTex.wrapT = THREE.RepeatWrapping;
    var roof = new THREE.Mesh (
        new THREE.PlaneGeometry(1000, 1000, 100, 100),
        new THREE.MeshPhongMaterial({ map: roofTex})
    );
    roof.translateY(500);
    roof.rotateX(Math.PI /2);
    scene.add( roof );

    //wall infront of staring position
    var wallTex = new THREE.TextureLoader().load("js/textures/wall.jpg");
    wallTex.repeat.set(6,6);     // repeat the texture 6x in both s- and t- directions
    wallTex.wrapS = THREE.RepeatWrapping;
    wallTex.wrapT = THREE.RepeatWrapping;
    var wall = new THREE.Mesh (
        new THREE.PlaneGeometry(1000, 500, 100, 100),
        new THREE.MeshPhongMaterial({ map: wallTex})
    );
    wall.translateZ(-500);
    wall.translateY(250);
    scene.add( wall );

    //wall behind starting position
    wallTex = new THREE.TextureLoader().load("js/textures/wall.jpg");
    wallTex.repeat.set(6,6);     // repeat the texture 6x in both s- and t- directions
    wallTex.wrapS = THREE.RepeatWrapping;
    wallTex.wrapT = THREE.RepeatWrapping;
    wall = new THREE.Mesh (
        new THREE.PlaneGeometry(1000, 500, 100, 100),
        new THREE.MeshPhongMaterial({ map: wallTex})
    );
    wall.translateZ(500);
    wall.translateY(250);
    wall.rotateY(Math.PI);
    scene.add(wall);

    //wall right of starting position
    wallTex = new THREE.TextureLoader().load("js/textures/wall.jpg");

    wallTex.repeat.set(6,6);     // repeat the texture 6x in both s- and t- directions
    wallTex.wrapS = THREE.RepeatWrapping;
    wallTex.wrapT = THREE.RepeatWrapping;
    wall = new THREE.Mesh (
        new THREE.PlaneGeometry(1000, 500, 100, 100),
        new THREE.MeshPhongMaterial({ map: wallTex})
    );
    wall.translateX(500);
    wall.translateY(250);
    wall.rotateY(-Math.PI/2);
    scene.add(wall);


    //wall left of starting position
    wallTex = new THREE.TextureLoader().load("js/textures/wall.jpg");
    wallTex.repeat.set(6,6);     // repeat the texture 6x in both s- and t- directions
    wallTex.wrapS = THREE.RepeatWrapping;
    wallTex.wrapT = THREE.RepeatWrapping;
    wall = new THREE.Mesh (
        new THREE.PlaneGeometry(1000, 500, 100, 100),
        new THREE.MeshPhongMaterial({ map: wallTex})
    );
    wall.translateX(-500);
    wall.translateY(250);
    wall.rotateY(Math.PI/2);
    scene.add(wall);

    var eyeTex = new THREE.TextureLoader().load("js/textures/eye2.jpg", THREE.SphericalRefractionMapping);
    geometry = new THREE.SphereGeometry(10,100,100);


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
    eyeball.translateY(10);
    scene.add( eyeball );




    geometry = new THREE.BoxGeometry( 20, 20, 20 );


    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor( 0xffffff );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );



    window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    requestAnimationFrame( animate );

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

    renderer.render( scene, camera );

}
