var canvas;
var gl;

var numVertices  = 36;

var points = [];
var colors = [];

var movement = false;   // Do we rotate?
var spinX = 0;
var spinY = 0;
var origX;
var origY;

var matrixLoc;

window.onload = function init() {
  canvas = document.getElementById("gl-canvas");

  gl = WebGLUtils.setupWebGL( canvas );
  if (!gl)
    alert( "WebGL isn't available" );

  colorCube();

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1.0, 1.0, 1.0, 1.0);

  gl.enable(gl.DEPTH_TEST);

  //  Load shaders and initialize attribute buffers
  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  var cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

  var vColor = gl.getAttribLocation(program, "vColor");
  gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vColor);

  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  matrixLoc = gl.getUniformLocation(program, "rotation");

  // Event listeners for mouse
  canvas.addEventListener("mousedown", function(e){
    movement = true;
    origX = e.offsetX;
    origY = e.offsetY;
    e.preventDefault();     // Disable drag and drop
  } );

  canvas.addEventListener("mouseup", function(e){
    movement = false;
  } );

  canvas.addEventListener("mousemove", function(e){
    if(movement) {
  	  spinY = ( spinY + (e.offsetX - origX) ) % 360;
      spinX = ( spinX + (e.offsetY - origY) ) % 360;
      origX = e.offsetX;
      origY = e.offsetY;
    }
  } );

  render();
}

function colorCube() {
  quad( 1, 0, 3, 2 );
  quad( 2, 3, 7, 6 );
  quad( 3, 0, 4, 7 );
  quad( 6, 5, 1, 2 );
  quad( 4, 5, 6, 7 );
  quad( 5, 4, 0, 1 );
}

function quad(a, b, c, d) {
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

  var vertexColors = [
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
    points.push( vertices[indices[i]] );
    colors.push(vertexColors[a]);
  }
}


function render()
{
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var ctm = mat4();
  ctm = mult( ctm, rotateX(spinX) );
  ctm = mult( ctm, rotateY(spinY) ) ;

  // Basic cube
  gl.uniformMatrix4fv(matrixLoc, false, flatten(ctm));
  gl.drawArrays( gl.TRIANGLES, 0, numVertices );

  requestAnimFrame( render );
}
