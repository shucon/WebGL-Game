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
var grayScala = false;
var flashScala = false;
var time = 0;
var time1 = 0;
var speed = 0;
var tempR = Math.floor(Math.random()*10);
document.getElementById("glcanvas").width = window.screen.width - 20;
document.getElementById("glcanvas").height = window.screen.height - 150;
var map = {}; // You could also use an array
onkeydown = onkeyup = function(e){
    e = e || event; // to deal with IE
    map[e.keyCode] = e.type == 'keydown';
}
main();
function main() {
  const canvas = document.querySelector('#glcanvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  // If we don't have a GL context, give up now

  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }

  // Vertex shader program

  var vsSource = `
    attribute vec4 aVertexPosition;
    attribute vec4 aVertexColor;
    attribute vec3 aVertexNormal;
    attribute vec2 aTextureCoord;

    uniform mat4 uNormalMatrix;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform bool flashScala;

    varying highp vec3 vLighting;
    varying lowp vec4 vColor;
    varying vec2 vTextureCoord;
    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vTextureCoord = aTextureCoord;
      highp vec3 ambientLight = vec3(0.5,0.5, 0.5);
      highp vec3 directionalLightColor = vec3(1, 1, 1);
      if (flashScala == true)
        directionalLightColor = vec3(2, 2, 1);
      highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

      highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

      highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
      vLighting = ambientLight + (directionalLightColor * directional);
    }
  `;

  // Fragment shader program

  const fsSource = `
  precision mediump float;
    varying highp vec2 vTextureCoord;
    varying highp vec3 vLighting;
    uniform sampler2D uSampler;
    uniform bool grayScala;
    
    vec4 toGrayscale(in vec4 color) {
      float average = (color.r + color.g + color.b) / 3.0;
      return vec4(average, average, average, 1.0);
      
    }
    
    void main(void) {
      highp vec4 texelColor = texture2D(uSampler, vTextureCoord);
      if (grayScala == true)
        gl_FragColor = toGrayscale(vec4(texelColor.rgb * vLighting, texelColor.a));   

      else
        gl_FragColor = vec4(texelColor.rgb *vLighting, texelColor.a);
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
      vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexColor: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      grayScala: gl.getUniformLocation(shaderProgram, 'grayScala'),
      normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
      uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
      flashScala: gl.getUniformLocation(shaderProgram, 'flashScala'),
    },
  };

  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  const buffers = initBuffers(gl);
  buffers_obs = obsBuffers(gl);

  var then = 0;

  // Draw the scene repeatedly
    function render(now) {
      time1++;
      if (map[65])
        cubeRotation += 0.3925/13;      
      if (map[68])
        cubeRotation -= 0.3925/13;
      if (map[32]){  
        if (jump == 1.5) {
        speed = 0.5;
        jump -= speed;
      }
    }
    if (map[66]) {        
      if (time1 > 10){
        grayScala = !grayScala;
        time1 = 0;        
      }
    }
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
function initTexture(gl,neheTexture) {
  neheTexture.image.onload = function() {
    handleLoadedTexture(gl,neheTexture)
  }
}
function handleLoadedTexture(gl,texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.bindTexture(gl.TEXTURE_2D, null);

}
//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just
// have one object -- a simple three-dimensional cube.
//
var neheTexture;
function initBuffers(gl) {

  // Create a buffer for the cube's vertex positions.
  var color = "texture.jpg";
  neheTexture = gl.createTexture();
  neheTexture.image = new Image();
  neheTexture.image.src = color;
  initTexture(gl,neheTexture);
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

  cubeVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
    var textureCoords = [
      // Front face
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,

      // Back face
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,

      // Top face
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,

      // Bottom face
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,

      // Right face
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,

      // Left face
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
      
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,

      // Top face
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
    ];
    var textureCoords1 = [];
    for (var i = 0; i < trackLength ; i++)
        textureCoords1 = textureCoords1.concat(textureCoords);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords1), gl.STATIC_DRAW);
    cubeVertexTextureCoordBuffer.itemSize = 2;
    cubeVertexTextureCoordBuffer.numItems = 24;

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
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices), gl.STATIC_DRAW);
      cubeVertexNormalBuffer = gl.createBuffer();
  var normal = [];
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
  for(var i=0;i<trackLength ;i++){
  	var ang = Math.PI/2;
  	for(var j=0;j<8;j++){
	  	var normals = [Math.cos(ang), Math.sin(ang), 0.0];
	  	normal = normal.concat(normals, normals, normals, normals);
	  	ang+=Math.PI/4;
	  }
  }
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normal), gl.STATIC_DRAW);
  cubeVertexNormalBuffer.itemSize = 3;
  cubeVertexNormalBuffer.numItems = 24;   
  // Now send the element array to GL



  return {
    position: positionBuffer,
    color: cubeVertexTextureCoordBuffer,
    indices: indexBuffer,
    normal: cubeVertexNormalBuffer,
  };
}


var neheTexture1;
function obsBuffers(gl) {
  var color = "texture1.jpg";
  neheTexture1 = gl.createTexture();
  neheTexture1.image = new Image();
  neheTexture1.image.src = color; 
  initTexture(gl,neheTexture1);  
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
    [1.0,  0.0,  0.0,  1.0],
  ];

  // Convert the array of colors into a table for all the vertices.

cubeVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
    var textureCoords = [
      // Front face
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,

      // Back face
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,

      // Top face
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,

      // Bottom face
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,

      // Right face
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,

      // Left face
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    cubeVertexTextureCoordBuffer.itemSize = 2;
    cubeVertexTextureCoordBuffer.numItems = 24;

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
    color: cubeVertexTextureCoordBuffer,
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
  const normalMatrix = mat4.create();


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
  
  mat4.invert(normalMatrix, modelViewMatrix);
  mat4.transpose(normalMatrix, normalMatrix);
  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute
  {
    const numComponents = 3;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexNormal,
        numComponents,
        type,
        normalize,
        stride,
        offset);
    gl.enableVertexAttribArray(
        programInfo.attribLocations.vertexNormal);
  }

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
    const numComponents = 2;
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
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, neheTexture);
    // gl.uniform1i(programInfo.attribLocations.vertexColor, 0);
    gl.uniform1i(programInfo.uniformLocations.flashScala, flashScala);
    gl.uniform1i(programInfo.uniformLocations.grayScala, grayScala);
    if (score%100 == 0)
        flashScala = !flashScala;
  }

  // Tell WebGL which indices to use to index the vertices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  // Tell WebGL to use our program when drawing

  gl.useProgram(programInfo.program);

  // Set the shader uniforms
  gl.uniform3f(
    programInfo.uniformLocations.ambientColorUniform,
    parseFloat(1),
    parseFloat(0.1),
    parseFloat(0.2)
  );
  var lightingDirection = [
    parseFloat(0),
    parseFloat(0),
    parseFloat(1)
  ];
  var adjustedLD = vec3.create();
  vec3.normalize(lightingDirection, adjustedLD);
  vec3.scale(adjustedLD, -1);
  gl.uniform3fv(programInfo.uniformLocations.lightingDirectionUniform, adjustedLD);

  gl.uniformMatrix4fv(
      programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
  gl.uniformMatrix4fv(
      programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);

      gl.uniformMatrix4fv(
        programInfo.uniformLocations.normalMatrix,
        false,
        normalMatrix);

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
    const numComponents = 2;
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
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, neheTexture1);
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

