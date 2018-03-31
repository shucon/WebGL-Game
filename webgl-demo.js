var cubeRotation = 0.0;
var trackLength = 1000;
var run = 0;
var jump = 1.5;
var gravity = 0.05;
var buffers_obs = 0;
var score = 0;
var count = 0;
var life = 3;
var distance = 100;
var time = 0;
var speed = 0;
var tempR = Math.floor(Math.random()*10);
document.getElementById("glcanvas").width = window.screen.width - 20;
document.getElementById("glcanvas").height = window.screen.height - 150;
Mousetrap.bind('a', function() {
  cubeRotation += 0.3925/3;
});
Mousetrap.bind('d', function() {
  cubeRotation -= 0.3925/3;
});
Mousetrap.bind('space', function() {
  if (jump == 1.5) {
    speed = 0.5;
    jump -= speed;

  }
});
// Mousetrap.bind('space+a', function() {
//   cubeRotation += 0.05;
//   if (jump == 1) {
//     speed = 0.5;
//     jump -= speed;

//   }
// });
// Mousetrap.bind('space+d', function() {
//   cubeRotation -= 0.05;
//   if (jump == 1) {
//     speed = 0.5;
//     jump -= speed;

//   }
// });
// Mousetrap.bind('a + space', function() {
//   cubeRotation += 0.05;
//   if (jump == 1) {
//     speed = 0.5;
//     jump -= speed;

//   }
// });
// Mousetrap.bind('d + space', function() {
//   cubeRotation -= 0.05;
//   if (jump == 1) {
//     speed = 0.5;
//     jump -= speed;

//   }
// });
main();
//
// Start here
//
function main() {
  const canvas = document.querySelector('#glcanvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  // If we don't have a GL context, give up now

  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }

  // Vertex shader program

  const vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
    }
  `;

  // Fragment shader program

  const fsSource = `
    varying lowp vec4 vColor;

    void main(void) {
      gl_FragColor = vColor;
    }
  `;

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Collect all the info needed to use the shader program.
  // Look up which attributes our shader program is using
  // for aVertexPosition, aVevrtexColor and also
  // look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
    },
  };

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  const buffers = initBuffers(gl);
  buffers_obs = obsBuffers(gl);

  var then = 0;

  // Draw the scene repeatedly
    function render(now) {
      now *= 0.001;  // convert to seconds
      const deltaTime = now - then;
      then = now;
      if (life > 0) {
        drawScene(gl, programInfo, buffers, buffers_obs, deltaTime);
      }
      requestAnimationFrame(render);
    }
  requestAnimationFrame(render);
}

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple three-dimensional cube.
//
function initBuffers(gl) {

  // Create a buffer for the cube's vertex positions.

  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions for the cube.

  var positions = [];
  var pos=0,i,k,n=8;
  var pi = 3.14159, angle = 0, theta=(2*pi)/n;
  for(i=0;i<n;i++){
      for(k=0;k<2;k++){
          positions[pos++]= 2*Math.cos(angle);
          positions[pos++]= 2*Math.sin(angle);
          positions[pos++]= 2.0;
          positions[pos++]= 2*Math.cos(angle);
          positions[pos++]= 2*Math.sin(angle);
          positions[pos++]=-2.0;
          angle += theta;
      }
      angle-=theta;
  }
  var l=positions.length;
  for (var j = 0; j < trackLength; j++) {
    for (var i = 0; i < l; i+=3 ) {
      positions.push(positions[i]);
      positions.push(positions[i+1]);
      positions.push(positions[i+2]-4*(j+1));
    }
  }
  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // Now set up the colors for the faces. We'll use solid colors
  // for each face.

  const faceColors = [
    [1.0,  1.0,  1.0,  1.0],    // Front face: white
    [0.0,  0.0,  0.0,  1.0],    // Front face: black
    [1.0,  0.2,  1.0,  1.0],    // Front face: white
    [0.5,  0.7,  1.0,  1.0],    // Front face: white
    [0.0,  1.0,  0.0,  1.0],    // Top face: green
    [0.3,  0.9,  1.0,  1.0],    // Bottom face: blue
    [0.0,  0.0,  1.0,  1.0],    // Bottom face: blue
    [0.4,  0.0,  1.0,  1.0],    // Left face: purple
    [1.0,  0.3,  1.0,  1.0],    // Left face: purple
    [1.0,  0.0,  0.4,  1.0],    // Left face: purple
  ];

  // Convert the array of colors into a table for all the vertices.

  var colors = [];
  var black = 0;
  for (var i = 0; i < trackLength; i++) {
    if (i% 10 == 0) {
      if (black == 1) {
        black = 2;
      }
      else if (black == 2) {
        black = 0;
      }
      else {
        black = 1;
      }
    }
    if (black == 1) {
      for (var j = 0; j < 4 ; j++) {
        var c = faceColors[0];
        colors = colors.concat(c, c, c, c);
        var c = faceColors[1];
        colors = colors.concat(c, c, c, c);
      }
      for (var j = 0; j < 4 ; j++) {
        var c = faceColors[1];
        colors = colors.concat(c, c, c, c);
        var c = faceColors[0];
        colors = colors.concat(c, c, c, c);
      }
      i++;
    }
    else if (black == 0) {
      for (var j = 0; j < 4 ; j++) {
        var c = faceColors[0];
        colors = colors.concat(c, c, c, c);
        var c = faceColors[1];
        colors = colors.concat(c, c, c, c);
      }
    }
    else {
      for (var j = 2; j < faceColors.length; ++j) {
        var temp = Math.floor(Math.random()*10);
        if (temp < 2) {
          temp += 2;
        }
        const c = faceColors[temp];
        // Repeat each color four times for the four vertices of the face
        colors = colors.concat(c,c,c,c);
      }
    }
    
  }
  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  // Build the element array buffer; this specifies the indices
  // into the vertex arrays for each face's vertices.

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

  const indices = [
    0,  1,  2,      1,  2,  3,    // front
    4,  5,  6,      5,  6,  7,    // back
    8,  9,  10,     9,  10, 11,   // top
    12, 13, 14,     13, 14, 15,   // bottom
    16, 17, 18,     17, 18, 19,   // right
    20, 21, 22,     21, 22, 23,   // left
    24, 25, 26,     25, 26, 27,   // left
    28, 29, 30,     29, 30, 31,   // left
  ];
  var l = indices.length;
  for (j = 0; j < trackLength; j++) {
    for (i = 0 ; i < l ; i++) {
      indices.push(indices[i]+(32*(j+1)));
    }
  }   
  // Now send the element array to GL

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    color: colorBuffer,
    indices: indexBuffer,
  };
}

function obsBuffers(gl) {

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  var positions = [
    -0.76536686,2,0,
    -0.76536686,2,-1,
     0.76536686,2,0,
     0.76536686,2,-1,
    -0.76536686,-2,0,
    -0.76536686,-2,-1,
     0.76536686,-2,0,
     0.76536686,-2,-1,
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  const faceColors = [
    [1.0,  0.0,  0.0,  1.0],    // Front face: white
  ];

  // Convert the array of colors into a table for all the vertices.

  var colors = [];
  const c = faceColors[0];
  for (i = 0; i < 8; i++)
    colors = colors.concat(c,c,c,c);
  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  // Build the element array buffer; this specifies the indices
  // into the vertex arrays for each face's vertices.

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

  const indices = [
    0,  1,  2,      1,  2,  3,    // front
    4,  5,  6,      5,  6,  7,    // back
    1,0,5,5,4,0,
    2,3,6,6,7,3,
    0,2,4,4,6,2,
    1,3,5,5,7,3,
  ];
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(indices), gl.STATIC_DRAW);
  return {
    position: positionBuffer,
    color: colorBuffer,
    indices: indexBuffer,
  };
}

//
// Draw the scene.
//
function drawScene(gl, programInfo, buffers, buffers_obs,deltaTime) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.

  const fieldOfView = 15 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.7;
  const zFar = 199.0;
  const projectionMatrix = mat4.create();

  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.
  mat4.perspective(projectionMatrix,
                   fieldOfView,
                   aspect,
                   zNear,
                   zFar);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = mat4.create();

  // Now move the drawing position a bit to where we want to
  // start drawing the square.
  if (run > (trackLength)) {
    run = 10;
    distance = 100;
  }
  mat4.translate(modelViewMatrix,     // destination matrix
        modelViewMatrix,     // matrix to translate
        [0,jump, run-15]);  // amount to translate
        // axis to rotate around (Z)
  mat4.rotate(modelViewMatrix,  // destination matrix
        modelViewMatrix,  // matrix to rotate
        cubeRotation * 3,     // amount to rotate in radians
        [0, 0, 1]);
        
  mat4.rotate(modelViewMatrix,  // destination matrix
        modelViewMatrix,  // matrix to rotate
        cubeRotation * 0,// amount to rotate in radians
        [0, 1, 0]);       // axis to rotate around (X)
  
        
  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute
  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
  }

  // Tell WebGL how to pull out the colors from the color buffer
  // into the vertexColor attribute.
  {
    const numComponents = 4;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexColor,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexColor);
  }

  // Tell WebGL which indices to use to index the vertices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  // Tell WebGL to use our program when drawing

  gl.useProgram(programInfo.program);

  // Set the shader uniforms

  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);

  {
    const vertexCount = 24*(trackLength);
    // const vertexCount = 36;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }
// Cube Buffer
const cubeMatrix = mat4.create();

// Now move the drawing position a bit to where we want to
// start drawing the square.
    mat4.translate(cubeMatrix,     // destination matrix
          cubeMatrix,     // matrix to translate
          [0,jump, run-distance]);  // amount to translate
    if (count < 3){
      var angle = 0;
    } else {
      if (count%2 == 0)
        var angle = score;
      else
        var angle = -score;      
    }
          // axis to rotate around (Z)
    mat4.rotate(cubeMatrix,  // destination matrix
          cubeMatrix,  // matrix to rotate
          cubeRotation * 3 + (22.5*2*3.14/360)*((2*tempR)+1) + angle/30,     // amount to rotate in radians
          [0, 0, 1]);
var collide = (cubeRotation * 3 + (22.5*2*3.14/360)*((2*tempR)+1) + angle/30)%3.14;
console.log(collide);
if (( collide >= 2.7 ||
          collide <= 0.4)
          && run-distance > 0 && time > 10) {
            time = 0;
            life--;
}
if ((run - distance)> 0){
  distance += 200;
  count++;
  tempR += 42.5;  
}
    mat4.rotate(cubeMatrix,  // destination matrix
          cubeMatrix,  // matrix to rotate
          0,// amount to rotate in radians
          [0, 1, 0]);       // axis to rotate around (X)
    

  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    // gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix, false, MOVEMATRIX_TETRA);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers_obs.position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexPosition);
  }

  // Tell WebGL how to pull out the colors from the color buffer
  // into the vertexColor attribute.
  {
    const numComponents = 4;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers_obs.color);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexColor,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexColor);
  }

  // Tell WebGL which indices to use to index the vertices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers_obs.indices);

  // Tell WebGL to use our program when drawing

  gl.useProgram(programInfo.program);

  // Set the shader uniforms

  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      cubeMatrix);

  {
    const vertexCount = 36;
    // const vertexCount = 36;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }

  // Update the rotation for the next draw

  // cubeRotation += deltaTime/15;
  run += deltaTime*24*(score/400+1);
  score++;
  document.getElementById("score").innerHTML = "SCORE: " + Math.floor(score/20);
  document.getElementById("life").innerHTML = "LIVES: " + life;
  if (jump < 1.5) {
    speed -= gravity;
  } else {
    speed = 0;
    jump = 1.5;
  }
  jump -= speed;
  time++;
}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object

  gl.shaderSource(shader, source);

  // Compile the shader program

  gl.compileShader(shader);

  // See if it compiled successfully

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

