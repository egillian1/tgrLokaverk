/////////////////////////////////////////////////////////////////
//    Sýnidæmi í Tölvugrafík
//     Einu mynstri varpað á tening.  Hægt að snúa honum með
//     músinni og færa til með upp- og niður-örvum (eða músarhjóli).
//
//    Hjálmtýr Hafsteinsson, mars 2017
/////////////////////////////////////////////////////////////////





var canvas;
var gl;

var NumVertices  = 36;

var program;
var texture;

var points = [];
var texCoords = [];
var cubes = [];


var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var axis = 0;
var theta = [ 0, 0, 0 ];

var movement = false;     // Do we rotate?
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var zDist = -4.0;

var proLoc;
var mvLoc;


const MAX_HEALTH = 3;

class Cube {
  constructor(coords, health) {
    this.coords = coords;
    this.health = health;
    this.size = health/MAX_HEALTH;
    this.bounds = {
      back: coords.z-this.size,
      front:  coords.z+this.size,
      top: coords.y-this.size,
      bottom:  coords.y+this.size,
      left: coords.x-this.size,
      right: coords.x+this.size
    };
    this.speed = this.createRandomSpeed();
    this.direction = this.createRandomDirection();
  };

  get getCoords(){
    return this.coords;
  }

  set updateCoords(coords){
    this.coords = coords;
  }

  get getSpeed(){
    return this.speed;
  }

  get getDirection(){
    return this.direction;
  }

  createRandomSpeed(){
    var max = 0.002;
    var min = 0.0001;

    var dx = Math.random() * (max - min) + min;
    var dy = Math.random() * (max - min) + min;
    var dz = Math.random() * (max - min) + min;

    return {dx: dx, dy: dy, dz:dz};
  }

  createRandomDirection(){
    var prob = 0.5;
    return {
      xdir: Math.random() > prob ? 1 : -1,
      ydir: Math.random() > prob ? 1 : -1,
      zdir: Math.random() > prob ? 1 : -1
    }
  }

  registerHit(){
    if(this.health == 0) return;
    this.health--;
    this.size = this.health/MAX_HEALTH;
    this.updateBounds();
  }

  updateBounds(){
    this.bounds = {
    back: this.coords.z-this.size,
    front:  this.coords.z+this.size,
    top: this.coords.y-this.size,
    bottom:  this.coords.y+this.size,
    left: this.coords.x-this.size,
    right: this.coords.x+this.size
  }
}
}



function configureTexture( image ) {
    texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image );
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
}


window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    colorCube();

    var cube = new Cube({x:0, y:0, z:0}, 2);
    cubes.push(cube);
    console.log(cubes);

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.9, 1.0, 1.0, 1.0 );

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

/*
    var cBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW );

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );
*/
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );

    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW );

    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );

    var image = document.getElementById("texImage");
    configureTexture( image );

    proLoc = gl.getUniformLocation( program, "projection" );
    mvLoc = gl.getUniformLocation( program, "modelview" );
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);

    //event listeners for mouse
    canvas.addEventListener("mousedown", function(e){
        movement = true;
        origX = e.offsetX;
        origY = e.offsetY;
        e.preventDefault();         // Disable drag and drop
    } );

    canvas.addEventListener("mouseup", function(e){
        movement = false;
    } );

    canvas.addEventListener("mousemove", function(e){
        if(movement) {
    	    spinY = ( spinY + (e.offsetX - origX) ) % 360;
            spinX = ( spinX + (origY - e.offsetY) ) % 360;
            origX = e.offsetX;
            origY = e.offsetY;
        }
    } );

    window.addEventListener("keydown", function(e){
        switch (e.keyCode) {
          case 32:
              explodeCube(cubes[0]);
            break;
          default:
          console.log(e.keyCode);

        }
    })

    // Event listener for keyboard
     window.addEventListener("keydown", function(e){
         switch( e.keyCode ) {
            case 38:	// upp ör
                zDist += 0.1;
                break;
            case 40:	// niður ör
                zDist -= 0.1;
                break;
         }
     }  );

    // Event listener for mousewheel
     window.addEventListener("mousewheel", function(e){
         if( e.wheelDelta > 0.0 ) {
             zDist += 0.1;
         } else {
             zDist -= 0.1;
         }
     }  );

    render();
}

function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

function quad(a, b, c, d)
{
    var vertices = [
        vec3( -0.5, -0.5,  0.5 ),
        vec3( -0.5,  0.5,  0.5 ),
        vec3(  0.5,  0.5,  0.5 ),
        vec3(  0.5, -0.5,  0.5 ),
        vec3( -0.5, -0.5, -0.5 ),
        vec3( -0.5,  0.5, -0.5 ),
        vec3(  0.5,  0.5, -0.5 ),
        vec3(  0.5, -0.5, -0.5 )
    ];

    var texCo = [
        vec2(0, 0),
        vec2(0, 1),
        vec2(1, 1),
        vec2(1, 0)
    ];

    //vertex texture coordinates assigned by the index of the vertex
    var indices = [ a, b, c, a, c, d ];
    var texind  = [ 1, 0, 3, 1, 3, 2 ];

    for ( var i = 0; i < indices.length; ++i ) {
        points.push( vertices[indices[i]] );
        texCoords.push( texCo[texind[i]] );
    }
}


function explodeCube(cube){
  cube.registerHit();
  if (cube.health != 0) {
    for (var i = 0; i < 3; i++) {
      cubes.push(new Cube({x: cube.coords.x, y: cube.coords.y, z: cube.coords.z}, cube.health));
    }
  }
}


function drawCube(cube, ctx) {
    ctx = mult(ctx, translate(cube.coords.x, cube.coords.y, cube.coords.z));
    ctx = mult(ctx, scalem(cube.size, cube.size, cube.size));
    gl.uniformMatrix4fv(mvLoc, false, flatten(ctx));
    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function drawCubes(ctx){
  for (var i = 0; i < cubes.length; i++) {
    if (cubes[i].health != 0) {
      drawCube(cubes[i], ctx);
    }
  }
}

function updateCubes() {
  for (var i = 0; i < cubes.length; i++) {
    let coords = cubes[i].getCoords;
    let speed = cubes[i].getSpeed;
    let direction = cubes[i].getDirection;
    coords.x += speed.dx * direction.xdir;
    coords.y += speed.dy * direction.ydir;
    coords.z += speed.dz * direction.zdir;

    cubes[i].updateCoords = coords;
  }
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var proj = perspective( 50.0, 1.0, 0.2, 100.0 );
    gl.uniformMatrix4fv(proLoc, false, flatten(proj));

    var ctm = lookAt( vec3(0.0, 0.0, zDist), vec3(0.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0) );
    ctm = mult( ctm, rotate( parseFloat(spinX), [1, 0, 0] ) );
    ctm = mult( ctm, rotate( parseFloat(spinY), [0, 1, 0] ) );

    drawCubes(ctm);
    updateCubes();

    requestAnimFrame( render );
}
