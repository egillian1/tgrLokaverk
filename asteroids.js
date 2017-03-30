let canvas;
let gl;

const numVertices  = 6;

let program;

let pointsArray = [];
let colorsArray = [];
let texCoordsArray = [];

let texture;
let wallTexture;

// Varibles for user view
const movementSize = 0.5; // Size of forward/backward step
// How many degrees are added/detracted to heading for each button push
const degreesPerTurn = 10.0;
let player;

let proLoc;
let mvLoc;

// Vertices for boundary box for game
let vertices = [
  vec4( -10.0,  -10.0, -10.0, 1.0 ),
  vec4(  10.0,  -10.0, -10.0, 1.0 ),
  vec4(  10.0,  10.0, -10.0, 1.0 ),
  vec4(  10.0,  10.0, -10.0, 1.0 ),
  vec4( -10.0,  10.0, -10.0, 1.0 ),
  vec4( -10.0,  -10.0, -10.0, 1.0 ),
//
  vec4( -10.0,  -10.0,  10.0, 1.0 ),
  vec4(  10.0,  -10.0,  10.0, 1.0 ),
  vec4(  10.0,  -10.0, -10.0, 1.0 ),
  vec4(  10.0,  -10.0, -10.0, 1.0 ),
  vec4( -10.0,  -10.0, -10.0, 1.0 ),
  vec4( -10.0,  -10.0,  10.0, 1.0 )
];

// Texture co-ordinates for boundary box
let texCoords = [
  vec2(  0.0,  0.0 ),
  vec2( 5.0,  0.0 ),
  vec2( 5.0, 5.0 ),
  vec2( 5.0, 5.0 ),
  vec2(  0.0, 5.0 ),
  vec2(  0.0,  0.0 ),
  //
  vec2(  0.0,  0.0 ),
  vec2( 5.0,  0.0 ),
  vec2( 5.0, 5.0 ),
  vec2( 5.0, 5.0 ),
  vec2(  0.0, 5.0 ),
  vec2(  0.0,  0.0 )
];

// Coreners of the box bounding the player's ship
let playerBoundingBox = [
  vec3(-0.5, 0.5, 0.5),
  vec3(0.5, 0.5, 0.5),
  vec3(-0.5, 0.5, -0.5),
  vec3(0.5, 0.5, -0.5),
  //
  vec3(-0.5, -0.5, 0.5),
  vec3(0.5, -0.5, 0.5),
  vec3(-0.5, -0.5, -0.5),
  vec3(0.5, -0.5, -0.5)
];

// The position variable contains the (x,y,z) co-ordinates of the viewer,
// direction contains the (x,y,z) vector components of the heading and angles
// contains the heading of the viewer where angles[0] is theta and angles[1]
// is phi.
class Ship {
  constructor(position, direction, angles, boundingBox){
    this.position = position;
    this.direction = direction;
    this.angles = angles;
    this.boundingBox = boundingBox;
  }

  addToTheta(theta){
    let tmp = this.angles[0] + theta;
    // Catches cases where normalization would cause an error
    if(tmp == 360.0 || tmp == 0.0)
      tmp += 0.01;
    tmp %= 360.0;
    this.angles[0] = tmp;
    this.recalculateDirection();
  }

  addToPhi(phi){
    let tmp = (this.angles[1] + phi) % 360.0;
    this.angles[1] = tmp;
    this.recalculateDirection();
  }

  // Moves the viewer by dist in the current heading
  addMovement(dist){
    this.position[0] += dist * this.direction[0];
    this.position[1] += dist * this.direction[1];
    this.position[2] += dist * this.direction[2];
    for (var i = 0; i < this.boundingBox.length; i++) {
      this.boundingBox[i][0] += dist * this.direction[0];
      this.boundingBox[i][1] += dist * this.direction[1];
      this.boundingBox[i][2] += dist * this.direction[2];
    }
  }

  // Calculate a new direction vector for heading
  recalculateDirection(){
    this.direction[0] = Math.sin(radians(this.angles[0])) * Math.cos(radians(this.angles[1]));
    this.direction[1] = Math.cos(radians(this.angles[0]));
    this.direction[2] = Math.sin(radians(this.angles[0])) * Math.sin(radians(this.angles[1]));
  }

  // getters
  get positionX() {
    return this.position[0];
  }
  get positionY() {
    return this.position[1];
  }
  get positionZ() {
    return this.position[2];
  }
  get theta(){
    return this.angles[0];
  }
  get phi(){
    return this.angles[1];
  }
  get directionX() {
    return this.direction[0];
  }
  get directionY() {
    return this.direction[1];
  }
  get directionZ() {
    return this.direction[2];
  }
  get positionVector(){
    return vec3(this.position[0], this.position[1], this.position[2]);
  }
  get eyeVector(){
    return vec3(this.position[0] + this.direction[0],
      this.position[1] + this.direction[1],
      this.position[2] + this.direction[2]);
  }
  // setters
  set setPositionX(x) {
    this.position[0] = x;
  }
  set setPositionY(y) {
    this.position[1] = y;
  }
  set setPositionZ(z) {
    this.position[2] = z;
  }
  set setTheta(theta){
    this.angles[0] = theta;
  }
  set setPhi(phi){
    this.angles[1] = phi;
  }
  set setDirectionX(x) {
    this.direction[0] = x;
  }
  set setDirectionY(y) {
    this.direction[1] = y;
  }
  set setDirectionZ(z) {
    this.direction[2] = z;
  }
}

window.onload = function init() {

  canvas = document.getElementById( "gl-canvas" );

  gl = WebGLUtils.setupWebGL( canvas );
  if ( !gl ) { alert( "WebGL isn't available" ); }

  gl.viewport( 0, 0, canvas.width, canvas.height );
  gl.clearColor( 0.9, 1.0, 1.0, 1.0 );

  gl.enable(gl.DEPTH_TEST);

  //  Load shaders and initialize attribute buffers
  program = initShaders( gl, "vertex-shader", "fragment-shader" );
  gl.useProgram( program );

  let vBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW );

  let vPosition = gl.getAttribLocation( program, "vPosition" );
  gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vPosition );

  let tBuffer = gl.createBuffer();
  gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
  gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW );

  let vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
  gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
  gl.enableVertexAttribArray( vTexCoord );

  // Read wall image and load it into buffer
  let veggImage = document.getElementById("VeggImage");
  wallTexture = gl.createTexture();
  gl.bindTexture( gl.TEXTURE_2D, wallTexture );
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, veggImage );
  gl.generateMipmap( gl.TEXTURE_2D );
  gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR );
  gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );

  gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);

  proLoc = gl.getUniformLocation( program, "projection" );
  mvLoc = gl.getUniformLocation( program, "modelview" );

  let proj = perspective( 50.0, 1.0, 0.2, 100.0 );
  gl.uniformMatrix4fv(proLoc, false, flatten(proj));

  player = new Ship([0.0, 0.0, 0.0], [0.0, 0.0, -1.0], [270.0, 90.0], playerBoundingBox);

  // Event listeners for mouse
  /*
  canvas.addEventListener("mousedown", function(e){
    movement = true;
    origX = e.clientX;
  });

  canvas.addEventListener("mouseup", function(e){
    movement = false;
  });

  canvas.addEventListener("mousemove", function(e){
    if(movement) {
      userAngleY += 0.4*(origX - e.clientX);
      userAngleY %= 360.0;
      userXDir = Math.cos(radians(userAngleX));
      userYDir = Math.cos(radians(userAngleY));
      userZDir = Math.sin(radians(userAngleX));
      origX = e.clientX;
    }
  });
  */

  // Event listener for keyboard
   window.addEventListener("keydown", function(e){
     switch(e.keyCode) {
      case 87:	// w
        player.addToTheta(degreesPerTurn);
        break;
      case 83:	// s
      player.addToTheta(-degreesPerTurn);
        break;
      case 65:	// a
        player.addToPhi(-degreesPerTurn);
        break;
      case 68:	// d
      player.addToPhi(degreesPerTurn);
        break;
      case 73 :  // i
        player.addMovement(movementSize);
        break;
      case 75 :  // k
        player.addMovement(-movementSize);
        break;
     }
   });

  render();
}

let render = function(){
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Positon viewer
  let mv = lookAt(player.positionVector, player.eyeVector, vec3(0.0, 1.0, 0.0 ));

  gl.uniformMatrix4fv(mvLoc, false, flatten(mv));

  gl.bindTexture(gl.TEXTURE_2D, wallTexture);
  for (var i = 0; (i*numVertices) < vertices.length; i++) {
    gl.drawArrays(gl.TRIANGLES, i*numVertices, numVertices);
  }

  //gl.drawArrays(gl.TRIANGLES, numVertices, numVertices);

  requestAnimFrame(render);
}
