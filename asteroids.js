let canvas;
let gl;

let program;
let texture;

let points = [];
let texCoords = [];
let asteroids = [];
let lasers = [];

let movement = false; // Do we rotate?
let spinX = 0;
let spinY = 0;
let origX;
let origY;
let time = 0;
let zDist = -4.0;

let proLoc;
let mvLoc;
let index;
let boundaryBox;
let numAsteroids = 3;

let score = 0;
let shields = 3;
let playing = true;

// TEXTURES

let asteroidTexture;
let ufoBodyTexture;
let ufoCockpitTexture;
let laserTexture;
let spaceTexture;

// AUDIO

let explosionSound = new Audio("audio/explosion.wav");
let spaceshipSound = new Audio("audio/rocket.wav");
let laserSound = new Audio("audio/Laser_Gun.wav");
let ufoSound = new Audio("audio/Spaceship_Alarm.mp3");

// VIEW
const movementSize = 0.005; // Size of forward/backward step
// How many degrees are added/detracted to heading for each button push
const degreesPerTurn = 10.0;

const MAX_HEALTH = 3;

let ufo;
const MIN_UFO_TIME = 5; //seconds
const MAX_UFO_TIME = 15; // seconds

let UFO_INTERVAL = (Math.random() * (MAX_UFO_TIME - MIN_UFO_TIME) + MIN_UFO_TIME) * 1000;
let ASTEROID_INTERVAL = 10 * 1000; // seconds

// Sets how frequently a UFO appears
setInterval(function(){
  if (ufo.health == 0) {
    ufo.revive();
  }
}, UFO_INTERVAL);

// Sets how frequently a new asteroid appears
setInterval(function(){
  let randHealth = Math.random()*2+1;
  asteroids.push(new Asteroid(boundaryBox.getRandomLocationWithinBox(), randHealth));
}, ASTEROID_INTERVAL);

// Sets how often a UFO fires a laser
setInterval(function(){
  ufo.shoopDaWhoop();
}, (Math.random()*(30-10)+10)*1000);

// The variables coords are the x, y and z co-ordinates of the middle of
// the box, irection is an x, y and z vector with the current heading,
// angles are Euleur angles of the heading.
class Laser {
  constructor(coords, direction, angles, firedByPlayer) {
    this.coords = coords;
    this.direction = direction;
    this.firedByPlayer = firedByPlayer;
    this.angles = angles;
    this.updateBounds();
    this.active = true;
  }

  deactivate(){
    if(this.active){
      this.active = false;
    }
  }

  // Moves the laser by dist in current heading
  addMovement(dist){
    this.coords.x += dist * this.direction.x;
    this.coords.y += dist * this.direction.y;
    this.coords.z += dist * this.direction.z;
    this.updateBounds();
  }

  updateBounds() {
      this.bounds = {
          back: this.coords.z - 0.2,
          front: this.coords.z + 0.2,
          top: this.coords.y - 0.2,
          bottom: this.coords.y + 0.2,
          left: this.coords.x - 0.2,
          right: this.coords.x + 0.2
      }
  }
}

class Asteroid {
    constructor(coords, health) {
        this.coords = coords;
        this.health = health;
        this.size = health / MAX_HEALTH;
        this.rad = 0.5*this.size;
        this.bounds = this.updateBounds();
        this.speed = this.createRandomSpeed();
        this.direction = this.createRandomDirection();
        this.spin = {x: 0, y: 0, z: 0};
        this.spinSpeed = Math.random()*(2)+0.01;
        this.lastHit = 0;
    };

    createRandomSpeed() {
        let max = 0.005;
        let min = 0.0009;

        let dx = Math.random() * (max - min) + min;
        let dy = Math.random() * (max - min) + min;
        let dz = Math.random() * (max - min) + min;

        let speedIncrease = 1/this.size;
        return {dx: dx*speedIncrease, dy: dy*speedIncrease, dz: dz*speedIncrease};
    }

    createRandomDirection() {
        let prob = 0.5;
        return {
            xdir: Math.random() > prob
                ? 1
                : -1,
            ydir: Math.random() > prob
                ? 1
                : -1,
            zdir: Math.random() > prob
                ? 1
                : -1
        }
    }

    displace(x, y, z) {
        this.coords.x += x;
        this.coords.y += y;
        this.coords.z += z;
        this.bounds = this.updateBounds();
    }

    registerHit() {
      this.health--;
        if (this.health <= 0)
            return;
        this.size = this.health / MAX_HEALTH;
        this.bounds = this.updateBounds();
    }

    updateBounds() {
        return {
            back: this.coords.z - this.rad,
            front: this.coords.z + this.rad,
            top: this.coords.y + this.rad,
            bottom: this.coords.y - this.rad,
            left: this.coords.x - this.rad,
            right: this.coords.x + this.rad
        }
    }

    updatePosition(){
      this.coords.x += this.speed.dx * this.direction.xdir;
      this.coords.y += this.speed.dy * this.direction.ydir;
      this.coords.z += this.speed.dz * this.direction.zdir;
      this.spin.x += this.spinSpeed;
      this.spin.y += this.spinSpeed;
      this.spin.z += this.spinSpeed;
      this.bounds = this.updateBounds();
    }
}

class UFO {
    constructor(coords, health) {
        this.coords = coords;
        this.health = health;
        this.bounds = this.updateBounds();
        this.speed = this.createRandomSpeed();
        this.direction = this.createRandomDirection();
        this.spinSpeed = Math.random()*5+0.05;
        this.spin = {x: 0, y:0, z: 0};
        this.rad = 0.315;
    };

    revive() {
        this.health = 1;
        ufoSound.play();
    }

    createRandomSpeed() {
        let max = 0.002;
        let min = 0.0001;

        let dx = Math.random() * (max - min) + min;
        let dy = Math.random() * (max - min) + min;
        let dz = Math.random() * (max - min) + min;

        return {dx: dx, dy: dy, dz: dz};
    }

    createRandomDirection() {
        let prob = 0.5;
        return {
            xdir: Math.random() > prob
                ? 1
                : -1,
            ydir: Math.random() > prob
                ? 1
                : -1,
            zdir: Math.random() > prob
                ? 1
                : -1
        }
    }

    registerHit() {
        this.health--;
        ufoSound.pause();
        explosionSound.play();
        addScore(500);
    }

    updateBounds() {
        return {
            back: this.coords.z - this.rad,
            front: this.coords.z + this.rad,
            top: this.coords.y + this.rad,
            bottom: this.coords.y - this.rad,
            left: this.coords.x - this.rad,
            right: this.coords.x + this.rad
        }
    }

    updatePosition(){
      this.coords.x += this.speed.dx * this.direction.xdir;
      this.coords.y += this.speed.dy * this.direction.ydir;
      this.coords.z += this.speed.dz * this.direction.zdir;
      this.spin.x += this.spinSpeed;
      this.spin.y += this.spinSpeed;
      this.spin.z += this.spinSpeed;
      this.bounds = this.updateBounds();
    }

    shoopDaWhoop(){
      if (this.health <= 0) {
        return;
      }

      laserSound.play();

      let tmpX = this.coords.x;
      let tmpY = this.coords.y;
      let tmpZ = this.coords.z;
      let tmpCoords = {
        x: tmpX,
        y: tmpY,
        z: tmpZ
      };

      let prob = 0.5;
      let xrand = Math.random() > prob ? 1: -1;
      let yrand = Math.random() > prob ? 1: -1;
      let zrand = Math.random() > prob ? 1: -1;

      let tmpDirection = {
        x: Math.random()*xrand,
        y: Math.random()*yrand,
        z: Math.random()*zrand
      };
      let tmpAngles = [Math.random()*(360-1)+1, Math.random()*(360-1)+1];
      let tmpLaser = new Laser(tmpCoords, tmpDirection, tmpAngles, false);
      lasers.push(tmpLaser);
    }


}

// The position variable contains the (x,y,z) co-ordinates of the viewer,
// direction contains the (x,y,z) vector components of the heading and angles
// contains the heading of the viewer where angles[0] is theta and angles[1]
// is phi. boundingBox contains the 8 corners of the box that bounds the player
// and size is the "radius" (half the height) of the bounding box.
class Ship {
    constructor(position, direction, angles, scale) {
        this.coords = position;
        this.direction = direction;
        this.angles = angles;
        this.rad = scale;
        this.bounds = this.updateBounds();
        this.invincible = false;
        this.lastHit = 0;
        this.velocity = {
          x: 0,
          y: 0,
          z: 0
        };
    }

    registerHit() {
          this.lastHit = time;
          if (!this.invincible) {
            shields--;
            this.invincible = true;
            document.getElementById("shields").innerHTML = "Shields: " + shields;
            if (shields <= 0){
              document.getElementById("gameOverScore").innerHTML = "Your score: " + score;
              var tmpElements = document.getElementsByClassName("hidden");
              while (tmpElements.length)
                tmpElements[0].classList.remove("hidden");
              freezeGame();
              return;
            }
          }
    }

    updateBounds() {
        return {
            back: this.coords.z - this.rad,
            front: this.coords.z + this.rad,
            top: this.coords.y + this.rad,
            bottom: this.coords.y - this.rad,
            left: this.coords.x - this.rad,
            right: this.coords.x + this.rad
        }
    }

    addToTheta(theta) {
        let tmp = this.angles[0] + theta;
        tmp %= 360.0;
        // Catches cases where normalization would cause an error
        if (tmp == 360.0 || tmp == 0.0)
            tmp += 0.01;
        this.angles[0] = tmp;
        this.recalculateDirection();
    }

    addToPhi(phi) {
        let tmp = (this.angles[1] + phi) % 360.0;
        this.angles[1] = tmp;
        this.recalculateDirection();
    }

    // Moves the viewer by dist in the current heading
    addMovement(dist) {
        this.velocity.x += dist * this.direction[0];
        this.velocity.y += dist * this.direction[1];
        this.velocity.z += dist * this.direction[2];
        this.bounds = this.updateBounds();
    }

    // Moves the ship in the current heading with regard to velocity
    movePlayer(){
      this.coords.x += this.velocity.x;
      this.coords.y += this.velocity.y;
      this.coords.z += this.velocity.z;
      this.bounds = this.updateBounds();
    }

    // Calculate a new direction vector for heading
    recalculateDirection() {
        this.direction[0] = Math.sin(radians(this.angles[0])) * Math.cos(radians(this.angles[1]));
        this.direction[1] = Math.cos(radians(this.angles[0]));
        this.direction[2] = Math.sin(radians(this.angles[0])) * Math.sin(radians(this.angles[1]));
    }

    // Displaces the viewer by x, y, z and moves the bounding box as well
    displace(x, y, z) {
        this.coords.x += x;
        this.coords.y += y;
        this.coords.z += z;
        this.bounds = this.updateBounds();
    }

    // Fires a laser in the current heading
    shoopDaWhoop(){
      laserSound.play();

      let tmpX = this.coords.x;
      let tmpY = this.coords.y;
      let tmpZ = this.coords.z;
      let tmpCoords = {
        x: tmpX,
        y: tmpY,
        z: tmpZ
      };
      let tmpDirection = {
        x: this.direction[0],
        y: this.direction[1],
        z: this.direction[2]
      };
      let tmpAngles = [this.angles[0], this.angles[1]]
      let tmpLaser = new Laser(tmpCoords, tmpDirection, tmpAngles, true);
      lasers.push(tmpLaser);
    }

    // getters
    get theta() {
        return this.angles[0];
    }
    get phi() {
        return this.angles[1];
    }
    get positionVector() {
        return vec3(this.coords.x, this.coords.y, this.coords.z);
    }
    // Returns appropriate "eye" vector for use with the lookAt method
    get eyeVector() {
        return vec3(this.coords.x + this.direction[0], this.coords.y + this.direction[1], this.coords.z + this.direction[2]);
    }
}

class BoundaryBox {
    constructor(width, height, depth) {
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.leftBound = -width / 2;
        this.rightBound = width / 2;
        this.upperBound = height / 2;
        this.lowerBound = -height / 2;
        this.frontBound = depth / 2;
        this.backBound = -depth / 2;
    }

    withinBox(object) {
        let laserFlag;
        if(object instanceof Laser){
          laserFlag = true;
        } else {
          laserFlag = false;
        }

        let x = object.coords.x;
        let y = object.coords.y;
        let z = object.coords.z;

        let xmove = this.width - 0.2;
        let ymove = this.height - 0.2;
        let zmove = this.depth - 0.2;

        if (x <= this.leftBound) {
          if (laserFlag) {
            object.deactivate();
          } else {
            object.displace(xmove, 0, 0);
          }
        }

        if (x >= this.rightBound) {
          if (laserFlag) {
            object.deactivate();
          } else {
            object.displace(-xmove, 0, 0);
          }
        }

        if (y <= this.lowerBound) {
          if (laserFlag) {
            object.deactivate();
          } else {
            object.displace(0, ymove, 0);
          }
        }

        if (y >= this.upperBound) {
          if (laserFlag) {
            object.deactivate();
          } else {
            object.displace(0, -ymove, 0);
          }
        }

        if (z >= this.frontBound) {
          if (laserFlag) {
            object.deactivate();
          } else {
            object.displace(0,0,-zmove);
          }
        }

        if (z <= this.backBound) {
          if (laserFlag) {
            object.deactivate();
          } else {
            object.displace(0,0,zmove);
          }
        }
    }

    getRandomLocationWithinBox(){
      let prob = 0.5;
      let xrand = Math.random() > prob ? 1: -1;
      let yrand = Math.random() > prob ? 1: -1;
      let zrand = Math.random() > prob ? 1: -1;
      return {
        x: Math.random()*(this.width/2)*xrand,
        y: Math.random()*(this.height/2)*yrand,
        z: Math.random()*(this.depth/2)*zrand
      }
    }
}

function configureTexture(image) {
    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    return texture;
}

function freezeGame(){
  playing = false;
  asteroids = [];
  lasers = [];
  player.velocity = {
    x: 0,
    y: 0,
    z: 0
  }
}

function resetGame(){
  playing = true;

  player = new Ship({ x: 0, y: 0, z: 0}, [ 0.0, 0.0, -1.0],
    [ 270.0, 90.0], 0.3, 5);

  addShields(3);

  addScore(-score);

  asteroids = [];
  for (var i = 0; i < numAsteroids; i++) {
    let randHealth = Math.random()*2+1;
    asteroids.push(new Asteroid(boundaryBox.getRandomLocationWithinBox(),randHealth));
  }

  asteroids.push(new Asteroid({x:0, y:0, z:-5}, 3));

  lasers = [];

  ufo = new UFO({
      x: 0,
      y: 0,
      z: -3
  }, 0);

}


window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    colorAsteroid();

    boundaryBox = new BoundaryBox(25, 25, 25);

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.8, 0.8, 0.8, 1.0);

    gl.enable(gl.DEPTH_TEST);

    //  Load shaders and initialize attribute buffers
    let program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    let vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    let tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);

    let vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    let asteroidImage = document.getElementById("texAsteroid");
    asteroidTexture = configureTexture(asteroidImage);

    let bodyImage = document.getElementById("texUFOBody");
    ufoBodyTexture = configureTexture(bodyImage);

    let cockpitImage = document.getElementById("texUFOCockpit");
    ufoCockpitTexture = configureTexture(cockpitImage);

    let laserImage = document.getElementById("texLaser");
    laserTexture = configureTexture( laserImage );

    let spaceImage = document.getElementById("texSpace");
    spaceTexture = configureTexture( spaceImage );

    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);

    proLoc = gl.getUniformLocation(program, "projection");
    mvLoc = gl.getUniformLocation(program, "modelview");

    let proj = perspective(50.0, 1.0, 0.2, 100.0);
    gl.uniformMatrix4fv(proLoc, false, flatten(proj));

    player = new Ship({ x: 0, y: 0, z: 0}, [ 0.0, 0.0, -1.0],
      [ 270.0, 90.0], 0.3);

    //Create base sphere for UFO
    ufo = new UFO({
        x: 0,
        y: 0,
        z: -3
    }, 0);

    for (var i = 0; i < numAsteroids; i++) {
      let randHealth = Math.random()*2+1;
      asteroids.push(new Asteroid(boundaryBox.getRandomLocationWithinBox(),randHealth));
    }

    asteroids.push(new Asteroid({x:0, y:0, z:-5}, 3));

    // Event listener for replay button
    document.getElementById("gameOverButton").addEventListener("click", function(){
      document.getElementById("gameOverText").classList.add("hidden");
      document.getElementById("gameOverScore").classList.add("hidden");
      document.getElementById("gameOverButton").classList.add("hidden");
      resetGame();
    })

    // Event listener for keyboard
    window.addEventListener("keydown", function(e) {
      if (playing) {
        switch (e.keyCode) {
            case 87: // w
                player.addToTheta(degreesPerTurn);
                break;
            case 83: // s
                player.addToTheta(-degreesPerTurn);
                break;
            case 65: // a
                player.addToPhi(-degreesPerTurn);
                break;
            case 68: // d
                player.addToPhi(degreesPerTurn);
                break;
            case 73: // i
                spaceshipSound.play();
                player.addMovement(movementSize);
                break;
            case 75: // k
                player.addMovement(-movementSize);
                break;
            case 32: // space
                e.preventDefault();
                player.shoopDaWhoop();
                break;
            default:
                break;
        }
      }
    });

    render();
}

// Add x to the player score and display it to user
function addScore(x){
  score += x;
  document.getElementById("score").innerHTML = "Score: " + score;
}

// Add x to player's shields
function addShields(x){
  shields += x;
  document.getElementById("shields").innerHTML = "Shields: " + shields;
}

// Checks if the two objects are colliding
function detectCollision(obj1, obj2){
  let flag = false;
  let counter = 0;

  // Check x co-ordinate
  if(obj1.bounds.right >= obj2.bounds.left && obj1.bounds.right <= obj2.bounds.right){
    counter++;
  } else if(obj1.bounds.left >= obj2.bounds.left && obj1.bounds.left <= obj2.bounds.right){
    counter++;
  }
  // Check y co-ordinate
  if(obj1.bounds.top <= obj2.bounds.top && obj1.bounds.top >= obj2.bounds.bottom){
    counter++
  } else if (obj1.bounds.bottom <= obj2.bounds.top && obj1.bounds.bottom >= obj2.bounds.bottom) {
    counter++
  }
  // Check z co-ordinate
  if (obj1.bounds.front <= obj2.bounds.front && obj1.bounds.front >= obj2.bounds.back){
    counter++;
  } else if(obj1.bounds.back <= obj2.bounds.front && obj1.bounds.back >= obj2.bounds.back){
    counter++;
  }
  // Notify of collision if x, y and z co-ordinates are inside other object
  if(counter == 3){
    flag = true;
  }
  return flag;
}

// Creates a square asteroid and pushes it's points to the appropriate
// arrays
function colorAsteroid() {
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}

function quad(a, b, c, d) {
    let vertices = [
        vec3(-0.5, -0.5, 0.5),
        vec3(-0.5, 0.5, 0.5),
        vec3(0.5, 0.5, 0.5),
        vec3(0.5, -0.5, 0.5),
        vec3(-0.5, -0.5, -0.5),
        vec3(-0.5, 0.5, -0.5),
        vec3(0.5, 0.5, -0.5),
        vec3(0.5, -0.5, -0.5)
    ];

    let texCo = [
        vec2(0, 0),
        vec2(0, 1),
        vec2(1, 1),
        vec2(1, 0)
    ];

    //vertex texture coordinates assigned by the index of the vertex
    let indices = [
        a,
        b,
        c,
        a,
        c,
        d
    ];

    let texind = [
        1,
        0,
        3,
        1,
        3,
        2
    ];

    for (let i = 0; i < indices.length; ++i) {
        points.push(vertices[indices[i]]);
        texCoords.push(texCo[texind[i]]);
    }
}

// Draw the enveloping box with the starfield
function drawBoundaryBox(ctx){
  gl.bindTexture(gl.TEXTURE_2D, spaceTexture);
  ctx = mult(ctx, scalem(25, 25, 25));
  gl.uniformMatrix4fv(mvLoc, false, flatten(ctx));
  gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function drawLaser(laser, ctx){
  gl.bindTexture(gl.TEXTURE_2D, laserTexture);
  ctx = mult(ctx, translate(laser.coords.x, laser.coords.y, laser.coords.z));
  ctx = mult(ctx, rotateY(laser.angles[1]));
  ctx = mult(ctx, rotateZ(laser.angles[0]));
  ctx = mult(ctx, scalem(0.05, 0.2, 0.05));
  gl.uniformMatrix4fv(mvLoc, false, flatten(ctx));
  gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function drawLasers(ctx){
  for (var i = 0; i < lasers.length; i++) {
    // Check if lasers are within boundary box
    boundaryBox.withinBox(lasers[i]);
    if (lasers[i].active) {
      lasers[i].addMovement(0.3);
      drawLaser(lasers[i], ctx);

      // Check if lasers hit ufo
      let ufoFlag = detectCollision(lasers[i], ufo);
      if (ufoFlag && lasers[i].firedByPlayer && ufo.health == 1) {
        lasers[i].deactivate();
        ufo.registerHit();
      }

      // Check if lasers hit asteroids
      for (var j = 0; j < asteroids.length; j++) {
        let flag = detectCollision(lasers[i], asteroids[j]);
        if (flag && lasers[i].active && lasers[i].firedByPlayer) {
          lasers[i].deactivate();
          explodeAsteroid(asteroids[j]);
        }
      }

      // Check if lasers hit player
      let playerFlag = detectCollision(lasers[i],player);
      if(playerFlag && !lasers[i].firedByPlayer){
        lasers[i].deactivate();
        player.registerHit();
      }
      // Remove lasers if they are not in the playing area
    } else {
      lasers.splice(i, 1);
    }
  }
}

function explodeAsteroid(asteroid) {
    asteroid.registerHit();
    explosionSound.play();
    if (asteroid.health != 0) {
        for (let i = 0; i < 3; i++) {
            asteroids.push(new Asteroid({
                x: asteroid.coords.x,
                y: asteroid.coords.y,
                z: asteroid.coords.z
            }, asteroid.health));
        }
    }
    addScore(100);
}

function drawAsteroid(asteroid, ctx) {
    gl.bindTexture(gl.TEXTURE_2D, asteroidTexture);
    ctx = mult(ctx, translate(asteroid.coords.x, asteroid.coords.y, asteroid.coords.z));
    ctx = mult(ctx, rotateY(asteroid.spin.y))
    ctx = mult(ctx, rotateX(asteroid.spin.x))
    ctx = mult(ctx, scalem(asteroid.size, asteroid.size, asteroid.size));
    gl.uniformMatrix4fv(mvLoc, false, flatten(ctx));
    gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function drawAsteroids(ctx) {
    for (let i = 0; i < asteroids.length; i++) {
        if (asteroids[i].health > 0) {
            drawAsteroid(asteroids[i], ctx);
        }
    }
}

function updateAsteroids() {
    for (let i = 0; i < asteroids.length; i++) {
      asteroids[i].updatePosition();
    }
}

function drawUFO(ctx) {
    let ctx1 = ctx;
    //draw body
    gl.bindTexture(gl.TEXTURE_2D, ufoBodyTexture);
    ctx1 = mult(ctx, translate(ufo.coords.x, ufo.coords.y, ufo.coords.z));
    ctx1 = mult(ctx1, rotateY(ufo.spin.y));
    ctx1 = mult(ctx1, scalem(0.425, 0.075, 0.425));
    gl.uniformMatrix4fv(mvLoc, false, flatten(ctx1));
    gl.drawArrays(gl.TRIANGLES, 0, 36);

    gl.bindTexture(gl.TEXTURE_2D, ufoCockpitTexture);

    let ctx2 = ctx;
    //draw cockpit
    ctx2 = mult(ctx, translate(ufo.coords.x, ufo.coords.y + 0.10, ufo.coords.z));
    ctx2 = mult(ctx2, scalem(0.15, 0.15, 0.15));
    gl.uniformMatrix4fv(mvLoc, false, flatten(ctx2));
    gl.drawArrays(gl.TRIANGLES, 0, 36);

}


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    time += 0.01;

    if (player.invincible) {
      if ((time - player.lastHit) >= 3) {
        player.invincible = false;
      }
    }
    // Positon viewer
    let mv = lookAt(player.positionVector, player.eyeVector, vec3(0.0, 1.0, 0.0));

    boundaryBox.withinBox(player);
    boundaryBox.withinBox(ufo);

    for (var i = 0; i < asteroids.length; i++) {
      boundaryBox.withinBox(asteroids[i]);
    }

    for (var i = 0; i < asteroids.length; i++) {
      let playerCollision = detectCollision(player, asteroids[i]);
      if (playerCollision) {
        player.registerHit();
      }
    }

    gl.uniformMatrix4fv(mvLoc, false, flatten(mv));
    gl.drawArrays(gl.TRIANGLES, 36, points.length-36);

    player.movePlayer(0.1);

    drawLasers(mv);
    drawAsteroids(mv);
    updateAsteroids();
    drawBoundaryBox(mv);

    if (ufo.health != 0) {
        drawUFO(mv);
        ufo.updatePosition();
        detectCollision(player, ufo);
    }

    requestAnimFrame(render);
}
