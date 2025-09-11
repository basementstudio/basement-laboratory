export const ditheringVertexShader = /* glsl */ `
precision highp float;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vUv = uv;
  
  // normal to world
  vNormal = normalize(normalMatrix * normal);
  
  // world pos
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  
  vViewPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const ditheringFragmentShader = /* glsl */ `
precision highp float;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec3 vViewPosition;

uniform float uTime;
uniform vec3 uCameraPosition;
uniform float uMetallic;
uniform float uRoughness;
uniform vec3 uBaseColor;
uniform float uDitherSize;
uniform float uDitherStrength;

// 4x4 bayer matrix
const mat4 bayerMatrix = mat4(
  0.0, 8.0, 2.0, 10.0,
  12.0, 4.0, 14.0, 6.0,
  3.0, 11.0, 1.0, 9.0,
  15.0, 7.0, 13.0, 5.0
) / 16.0;

// function to get bayer value
float getBayerValue(vec2 coord) {
  ivec2 pixel = ivec2(mod(coord, 4.0));
  return bayerMatrix[pixel.x][pixel.y];
}

// metallic fresnel
vec3 fresnel(vec3 viewDir, vec3 normal, vec3 f0) {
  float cosTheta = max(dot(normal, viewDir), 0.0);
  return f0 + (1.0 - f0) * pow(1.0 - cosTheta, 5.0);
}

// environment lighting 
vec3 getEnvironmentColor(vec3 reflectDir) {
  // simulate a basic environment map with gradient
  float y = reflectDir.y * 0.5 + 0.5;
  return mix(vec3(0.1, 0.1, 0.2), vec3(0.8, 0.9, 1.0), y);
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
  vec3 reflectDir = reflect(-viewDir, normal);
  
  // metallic fresnel
  vec3 metallicFresnel = mix(vec3(0.04), uBaseColor, uMetallic);
  
  // fresnel
  vec3 fresnelTerm = fresnel(viewDir, normal, metallicFresnel);
  
  // environment reflection
  vec3 envColor = getEnvironmentColor(reflectDir);
  
  // diffuse term
  float NdotL = max(dot(normal, normalize(vec3(1.0, 1.0, 1.0))), 0.0);
  vec3 diffuse = uBaseColor * (1.0 - uMetallic) * NdotL * 0.3;

  // combine all colors , fresnel and environment
  vec3 color = diffuse + fresnelTerm * envColor;
  
  // rim power of the light
  float rimPower = 1.0 - max(dot(normal, viewDir), 0.0);
  color += pow(rimPower, 3.0) * 0.5;
  
  // create the dithering with the dot product
  float luminance = dot(color, vec3(0.299, 0.587, 0.114));
  
  vec2 ditherCoord = gl_FragCoord.xy * uDitherSize;
  float bayerValue = getBayerValue(ditherCoord);
  
  // apply the bayer matrix and mix with strength
  float threshold = mix(bayerValue, 0.5, 1.0 - uDitherStrength);
  float ditheredValue = step(threshold, luminance);
  
  // output the final color
  vec3 finalColor = vec3(ditheredValue);
  
  gl_FragColor = vec4(finalColor, 1.0);
}
`
