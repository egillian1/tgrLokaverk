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
let userXPos = 0.0;
let userYPos = 0.0;
let userZPos = 0.0;
const userIncr = 0.1; // Size of forward/backward step
let userAngleX = 270.0; // X-direction of the user in degrees
let userAngleY = 90.0; // Y-direction of the user in degrees
let userXDir = 0.0; // X-coordinate of heading
let userYDir = 0.0; // Y-coordinate of heading
let userZDir = -1.0; // Z-coordinate of heading
const degreesPerTurn = 5.0; // How many degrees are added/detracted for each button push

let proLoc;
let mvLoc;

// Vertices for boundary box
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
  vec2(  0.0,  0.0 ),
];


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

  // Lesa inn og skilgreina mynstur fyrir vegg
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
        userAngleX += degreesPerTurn;
        if(userAngleX == 360.0)
          userAngleX += 0.5;
        userAngleX %= 360.0;
        userXDir = Math.sin(radians(userAngleX)) * Math.cos(radians(userAngleY));
        userYDir = Math.cos(radians(userAngleX));
        userZDir = Math.sin(radians(userAngleX)) * Math.sin(radians(userAngleY));
        break;
      case 83:	// s
        userAngleX -= degreesPerTurn;
        if(userAngleX == 0.0)
          userAngleX -= 0.5;
        userAngleX %= 360.0;
        userXDir = Math.sin(radians(userAngleX)) * Math.cos(radians(userAngleY));
        userYDir = Math.cos(radians(userAngleX));
        userZDir = Math.sin(radians(userAngleX)) * Math.sin(radians(userAngleY));
        break;
      case 65:	// a
        userAngleY -= degreesPerTurn;
        userAngleY %= 360.0;
        userXDir = Math.sin(radians(userAngleX)) * Math.cos(radians(userAngleY));
        userYDir = Math.cos(radians(userAngleX));
        userZDir = Math.sin(radians(userAngleX)) * Math.sin(radians(userAngleY));
        break;
      case 68:	// d
        userAngleY += degreesPerTurn;
        userAngleY %= 360.0;
        userXDir = Math.sin(radians(userAngleX)) * Math.cos(radians(userAngleY));
        userYDir = Math.cos(radians(userAngleX));
        userZDir = Math.sin(radians(userAngleX)) * Math.sin(radians(userAngleY));
        break;
      case 74:  // ctrl
        userXPos += userIncr * userXDir;
        userYPos += userIncr * userYDir
        userZPos += userIncr * userZDir;
        break;
     }
   });

  render();
}

let render = function(){
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Positon viewer
  let mv = lookAt(vec3(userXPos, userYPos, userZPos),
  vec3(userXPos+userXDir, userYPos+userYDir, userZPos+userZDir),
  vec3(0.0, 1.0, 0.0 ));

  gl.uniformMatrix4fv(mvLoc, false, flatten(mv));

  gl.bindTexture(gl.TEXTURE_2D, wallTexture);
  for (var i = 0; (i*numVertices) < vertices.length; i++) {
    gl.drawArrays(gl.TRIANGLES, i*numVertices, numVertices);
  }

  //gl.drawArrays(gl.TRIANGLES, numVertices, numVertices);

  requestAnimFrame(render);
}
