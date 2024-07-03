import { ShaderMaterial } from 'three'

const screenVertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const screenFramgentShader = /* glsl */ `
uniform sampler2D map;
uniform vec2 screenSize;
uniform bool rgbActive;
uniform vec3 screenOn;

varying vec2 vUv;

float valueRemap(float value, float min, float max, float newMin, float newMax) {
  return newMin + (value - min) * (newMax - newMin) / (max - min);
}

struct Pixel {
  vec2 size;
  vec2 mapUv;
  vec2 uv;
};

// Since we want a "pixelated" screen, we need to know which pixel we are in
Pixel getPixel() {
  vec2 pixelSize = 1.0 / screenSize;
  vec2 mapUvCenter = floor(vUv * screenSize) / screenSize + pixelSize;

  // get the UV realtive to the pixel
  vec2 pixelUv = vec2(1.) - (mapUvCenter - vUv) / pixelSize;

  return Pixel(
    pixelSize,
    mapUvCenter,
    pixelUv
  );

}

float getPixelEdge(vec2 uv, float edgeWidth) {
  float distFromCenter = abs(uv.y - 0.5) * 2.;
  // return distFromCenter;
  return smoothstep(1. - edgeWidth, 1., distFromCenter);
}

float getLedFactor(vec2 uv, float ledWidth, float ledPos, float ledPow) {
  float distanceFromLed = abs(uv.x - ledPos);
  float ledFacror = step(distanceFromLed, ledWidth);
  ledFacror = valueRemap(distanceFromLed, ledWidth - ledWidth * 0.8, ledWidth, 1.0, 0.);
  ledFacror = clamp(ledFacror, 0., 1.);
  ledFacror = pow(ledFacror, ledPow);
  return ledFacror;
}

vec3 getPixelRgb(vec2 uv) {
  float edgePos = 0.44444 / 2.;
  float edgeSize = 0.433333 / 2.;

  return vec3(
    getLedFactor(uv, edgeSize, edgePos, 1.),
    getLedFactor(uv, edgeSize, 0.5, 2.0),
    getLedFactor(uv, edgeSize, 1. - edgePos, 1.)
  );
}

void main() {
  Pixel pixel = getPixel();

  vec3 color = vec3(0.0);

  vec2 pixelSampler = pixel.mapUv;

  pixelSampler = (pixelSampler - 0.5) * screenOn.xy + 0.5;

  vec3 colorSample = texture2D(map, pixelSampler).rgb;
  color = colorSample * screenOn.z;

  // if(pixelSampler.y > 1. || pixelSampler.y > 1.) {
  //   color = vec3(0.0);
  // }

  if(rgbActive) {
    vec3 pixelRgb = getPixelRgb(pixel.uv);
    color *= pixelRgb;
  }

  float pixelEdge = getPixelEdge(pixel.uv, 0.2);
  float pixelEdgeFactor = pow(1. - pixelEdge, 2.5);
  color *= (pixelEdgeFactor * 0.9);

  // float pixelFactor = max(pixelRgb.x, max(pixelRgb.y, pixelRgb.z)) * 0.2;

  // color = mix(color, colorSample, pixelFactor);

  // if(vUv.y < 0.5) {
  //   color = texture2D(map, vUv).rgb;
  // }
  
  
  // color = vec3(0.0);
  // color = pixelRgb;
  // color.xy = pixelEdge;
  // color.x = pixel.uv.x > 0.6 && pixel.uv.x < 0.9 ? 1. : 0.;

  // color.x = pixel.uv.x < -0.1 ? 1. : 0.;

  float colorPow = 0.5;
  float colorMult = 3.;

  color = vec3(
    pow(color.x, colorPow) * colorMult,
    pow(color.y, colorPow) * colorMult,
    pow(color.z, colorPow) * colorMult
  );

  gl_FragColor = vec4(color, 1.);
}
`

export const screenMaterial = new ShaderMaterial({
  vertexShader: screenVertexShader,
  fragmentShader: screenFramgentShader,
  uniforms: {
    map: { value: null },
    screenSize: { value: [1, 1] },
    rgbActive: { value: true },
    screenOn: { value: { x: 1, y: 1, z: 1 } }
  }
})
