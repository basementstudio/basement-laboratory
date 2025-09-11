export const fragment = /* glsl */ `
precision highp float;

uniform float uColorNum;
uniform float uPixelSize;
uniform int uThresholdOffset;

uniform float uTime;

uniform float uNoiseIntensity;

uniform float uWarpStrength;

uniform float uScanlineIntensity;
uniform float uScanlineFrequency;

uniform bool uIsMonochrome;
uniform vec3 uMonochromeColor;

float random(vec2 c) {
  return fract(sin(dot(c.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

// 2D Noise based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  
  vec2 u = f*f*(3.0-2.0*f);
  
  return mix(a, b, u.x) +
  (c - a)* u.y * (1.0 - u.x) +
  (d - b) * u.x * u.y;
}


void mainUv(inout vec2 uv) {
  float shake = (noise(vec2(uv.y) * sin(time * 400.0) * 100.0) - 0.5) * 0.0025;
  uv.x += shake * 0.5;
}

const float bayerMatrix8x8[64] = float[64](
    0.0/ 64.0, 48.0/ 64.0, 12.0/ 64.0, 60.0/ 64.0,  3.0/ 64.0, 51.0/ 64.0, 15.0/ 64.0, 63.0/ 64.0,
  32.0/ 64.0, 16.0/ 64.0, 44.0/ 64.0, 28.0/ 64.0, 35.0/ 64.0, 19.0/ 64.0, 47.0/ 64.0, 31.0/ 64.0,
    8.0/ 64.0, 56.0/ 64.0,  4.0/ 64.0, 52.0/ 64.0, 11.0/ 64.0, 59.0/ 64.0,  7.0/ 64.0, 55.0/ 64.0,
  40.0/ 64.0, 24.0/ 64.0, 36.0/ 64.0, 20.0/ 64.0, 43.0/ 64.0, 27.0/ 64.0, 39.0/ 64.0, 23.0/ 64.0,
    2.0/ 64.0, 50.0/ 64.0, 14.0/ 64.0, 62.0/ 64.0,  1.0/ 64.0, 49.0/ 64.0, 13.0/ 64.0, 61.0/ 64.0,
  34.0/ 64.0, 18.0/ 64.0, 46.0/ 64.0, 30.0/ 64.0, 33.0/ 64.0, 17.0/ 64.0, 45.0/ 64.0, 29.0/ 64.0,
  10.0/ 64.0, 58.0/ 64.0,  6.0/ 64.0, 54.0/ 64.0,  9.0/ 64.0, 57.0/ 64.0,  5.0/ 64.0, 53.0/ 64.0,
  42.0/ 64.0, 26.0/ 64.0, 38.0/ 64.0, 22.0/ 64.0, 41.0/ 64.0, 25.0/ 64.0, 37.0/ 64.0, 21.0 / 64.0
);

vec3 dither(vec2 uv, vec3 color) {
  int x = int(uv.x * resolution.x) % 8;
  int y = int(uv.y * resolution.y) % 8;
  float threshold = bayerMatrix8x8[y * uThresholdOffset + x] - 1.0;

  color.rgb += threshold;
  
  if (uIsMonochrome) {
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    gray = floor(gray * (uColorNum - 1.0) + 0.5) / (uColorNum - 1.0);
    color.rgb = gray * uMonochromeColor;
  } else {
    color.r = floor(color.r * (uColorNum - 1.0) + 0.5) / (uColorNum - 1.0);
    color.g = floor(color.g * (uColorNum - 1.0) + 0.5) / (uColorNum - 1.0);
    color.b = floor(color.b * (uColorNum - 1.0) + 0.5) / (uColorNum - 1.0);
  }

  return color;
}

const float curve = 0.25;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 curveUV = uv * 2.0 - 1.0;
  vec2 offset = curveUV.yx * curve;
  curveUV += curveUV * offset * offset;
  curveUV = curveUV * 0.5 + 0.5;


  vec2 normalizeduPixelSize = uPixelSize / resolution;  
  vec2 uvPixel = normalizeduPixelSize * floor(curveUV / normalizeduPixelSize);

  vec4 color = texture2D(inputBuffer, uvPixel);
  color.rgb = dither(uvPixel, color.rgb);

  // Add scanlines
  float scanLine = sin(curveUV.y * uScanlineFrequency) * uScanlineIntensity;
  color.rgb *= (1.0 - scanLine);

  // Add noise
  float noise = random(curveUV + uTime) * uNoiseIntensity;
  color.rgb = mix(color.rgb, vec3(1.0), noise);

  // Add vignette
  vec2 vignetteUV = curveUV * (1.0 - curveUV.yx);
  float vignette = vignetteUV.x * vignetteUV.y * 15.0;
  vignette = pow(vignette, 0.25);
  color.rgb *= vignette;

  vec2 edge = smoothstep(0., 0.005, curveUV)*(1.-smoothstep(1.-0.005, 1., curveUV));
  color.rgb *= edge.x * edge.y;

  outputColor = color;
}
`
