let canvas;
let gl;

let numVertices  = 36;

let points = [];
let colors = [];

let movement = false;   // Do we rotate?
let spinX = 0;
let spinY = 0;
let origX;
let origY;

let matrixLoc;
let player;

window.onload = function init() {
  canvas = document.getElementById("gl-canvas");

  gl = WebGLUtils.setupWebGL( canvas );
  if (!gl)
    alert( "WebGL isn't available" );

  colorCube();

  // initialize playable spaceship object
  let spaceshipPoints = [
    vec3(0.0, 0.0, 0.1),
    vec3(-0.05, 0.0, 0.0),
    vec3(0.05, 0.0, 0.0), // Bottom plate
    vec3(0.0, 0.0, 0.1),
    vec3(0.0, 0.05, 0.0), // Right side
    vec3(0.0, 0.0, 0.1),
    vec3(-0.05, 0.0, 0.0), // Left side
    vec3(0.0, 0.05, 0.0),
    vec3(0.05, 0.0, 0.0)
  ];
  let pos = vec3(0.0, 0.0, 0.0);
  let dir = vec3(0.0, 0.0, 1.0);
  player = new Ship(pos, dir, pos, spaceshipPoints);

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1.0, 1.0, 1.0, 1.0);

  gl.enable(gl.DEPTH_TEST);

  //  Load shaders and initialize attribute buffers
  let program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  let cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

  let vColor = gl.getAttribLocation(program, "vColor");
  gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vColor);

  let vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

  let vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  matrixLoc = gl.getUniformLocation(program, "rotation");

  // Event listeners for mouse
  canvas.addEventListener("mousedown", function(e){
    movement = true;
    origX = e.offsetX;
    origY = e.offsetY;
    e.preventDefault();     // Disable drag and drop
  });

  canvas.addEventListener("mouseup", function(e){
    movement = false;
  });

  canvas.addEventListener("mousemove", function(e){
    if(movement) {
  	  spinY = ( spinY + (e.offsetX - origX) ) % 360;
      spinX = ( spinX + (e.offsetY - origY) ) % 360;
      origX = e.offsetX;
      origY = e.offsetY;
    }
  });

  // Event listeners for keyboard
  window.addEventListener("keydown", function(e){
    key = e.keyCode;
    if(key == 17){
      console.log("Thrust engaged");
    } else if(key == 32){
      console.log("Shot fired");
    } else if (key == 87){
      console.log("Pitch up");
    } else if (key == 83){
      console.log("Pitch down");
    } else if (key == 65){
      console.log("Yaw left");
    } else if (key == 68) {
      console.log("Yaw right");
    }
  });

  render();
}

// CLASSES

class Ship {
  constructor(position, direction, velocity, pointMatrix){
    this.position = position;
    this.direction = direction;
    this.velocity = velocity;
    this.pointMatrix = pointMatrix;
  }
}

// FUNCTIONS

function colorCube(){
  quad( 1, 0, 3, 2 );
  quad( 2, 3, 7, 6 );
  quad( 3, 0, 4, 7 );
  quad( 6, 5, 1, 2 );
  quad( 4, 5, 6, 7 );
  quad( 5, 4, 0, 1 );
}

function quad(a, b, c, d){
  let vertices = [
    vec3( -0.5, -0.5,  0.5 ),
    vec3( -0.5,  0.5,  0.5 ),
    vec3(  0.5,  0.5,  0.5 ),
    vec3(  0.5, -0.5,  0.5 ),
    vec3( -0.5, -0.5, -0.5 ),
    vec3( -0.5,  0.5, -0.5 ),
    vec3(  0.5,  0.5, -0.5 ),
    vec3(  0.5, -0.5, -0.5 )
  ];

  let vertexColors = [
    [ 0.0, 0.0, 0.0, 1.0 ],  // black
    [ 190.0/256.0, 78.0/256.0, 81.0/256.0, 1.0 ], // Carmine
    [ 34.0/256.0, 170.0/256.0, 90.0/256.0, 1.0 ], // Emerald
    [ 255.0/256.0, 147.0/256.0, 79.0/256.0, 1.0 ], // Dark orange
    [ 147.0/256.0, 147.0/256.0, 147.0/256.0, 1.0 ], // Gray
    [ 237.0/256.0, 203.0/256.0, 107.0/256.0, 1.0 ], // Yellow
    [ 170.0/256.0, 72.0/256.0, 127.0/256.0, 1.0 ], // Magenta
    [ 1.0, 1.0, 1.0, 1.0 ]   // white
  ];
  //vertex color assigned by the index of the vertex
  let indices = [ a, b, c, a, c, d ];

  for (let i = 0; i < indices.length; ++i) {
    points.push(vertices[indices[i]]);
    colors.push(vertexColors[a]);
  }
}

// Returns matrix for transforming view og objects with roll, pitch
// and yaw method. Variables roll, pitch and yaw are in degrees.
function rpyView(roll, pitch, yaw, position){
  let viewMatrix = mat4(
    vec4(1, 0, 0, position[0]),
    vec4(0, 1, 0, position[1]),
    vec4(0, 0, 1, position[2]),
    vec4(0, 0, 0, 1)
  );

  let transform = mult(rotateZ(roll), viewMatrix);
  transform = mult(rotateX(pitch), transform);
  transform = mult(rotateY(yaw), transform);
  return transform;
}

// Moves all points by a set distance as dictated by the movement vector
function movePoints(points, movement){
  let xmove = movement[0];
  let ymove = movement[1];
  let zmove = movement[2];
  for (var i = 0; i < points.length; i++) {
    points[i][0] += xmove;
    points[i][1] += ymove;
    points[i][2] += zmove;
  }
}

function render()
{
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  let ctm = mat4();
  ctm = mult(ctm, rotateX(spinX));
  ctm = mult(ctm, rotateY(spinY));

  movePoints(player.pointMatrix, [0.0, 0.0, 0.0]);
  let shipPoints = player.pointMatrix;
  gl.bufferData(gl.ARRAY_BUFFER, flatten(shipPoints), gl.STATIC_DRAW);
  gl.uniformMatrix4fv(matrixLoc, false, flatten(ctm));
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, shipPoints.length);

  /*
  // Basic cube
  gl.uniformMatrix4fv(matrixLoc, false, flatten(ctm));
  gl.drawArrays(gl.TRIANGLES, 0, numVertices);
  */

  requestAnimFrame(render);
}
