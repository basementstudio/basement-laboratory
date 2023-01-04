import { OrbitControls, PerspectiveCamera, Text } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import React from 'react'
import * as THREE from 'three'

// eslint-disable-next-line prettier/prettier
const helpers =/* glsl */ `
  /* SDF stands for Signed Distance Fields */
  float sdfCircle(vec2 uv, float r, vec2 offset) {
    float x = uv.x - offset.x;
    float y = uv.y - offset.y;

    return length(vec2(x, y)) - r;
  }

  /* This one only works for planes */
  vec3 toTangentSpace(vec3 vec) {
    vec3 normal = vec3(0.0, 0.0, 1.0);

    vec3 tangent = normalize(vec3(1.0, 0.0, 0.0));
    vec3 bitangent = normalize(cross(normal, tangent));

    mat3 tbn = mat3(tangent, bitangent, normal);

    return tbn * vec;
  }
 
`

const classicMethod = {
  // eslint-disable-next-line prettier/prettier
  vertexShader:/* glsl */ `
    varying vec2 vUv;

    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      vUv = uv;
    }
  `,
  // eslint-disable-next-line prettier/prettier
  fragmentShader:/* glsl */ `
    varying vec2 vUv;

    uniform vec3 uPlanePosition;
    uniform vec2 uResolution;

    ${helpers}

    void main() {
      vec2 uv = vUv;
      uv -= 0.5;

      /* Calculate the depth & perspective */
      vec3 viewDir = toTangentSpace(normalize(cameraPosition - uPlanePosition));
      vec3 normal = toTangentSpace(vec3(0.0, 0.0, 1.0));

      float facingCoeficient = dot(viewDir, normal);
      vec3 perspective = viewDir / facingCoeficient;

      float detphDist = 0.0;
      float detphDist1 = 0.2;
      float detphDist2 = 0.4;

      vec2 offset = vec2(detphDist) * perspective.xy;
      vec2 offset1 = vec2(detphDist1) * perspective.xy;
      vec2 offset2 = vec2(detphDist2) * perspective.xy;

      /* Shapes */
      float shape = sdfCircle(uv, 0.2, offset);
      float shape1 = sdfCircle(uv, 0.3, offset1);
      float shape2 = sdfCircle(uv, 0.4, offset2);

      /* Colors */
      vec3 col = vec3(1.0);

      /* Blend them together */
      col = mix(vec3(1, 0, 0), col, step(0., shape2));
      col = mix(vec3(0, 1, 0), col, step(0., shape1));
      col = mix(vec3(0, 0, 1), col, step(0., shape));

      gl_FragColor = vec4(col, 1.0);
    }
  `
}

const improvedMethod = {
  // eslint-disable-next-line prettier/prettier
  vertexShader:/* glsl */ `
    varying vec2 vUv;

    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      vUv = uv;
    }
  `,
  // eslint-disable-next-line prettier/prettier
  fragmentShader:/* glsl */ `
    varying vec2 vUv;

    uniform vec3 uPlanePosition;
    uniform vec2 uResolution;

    ${helpers}

    void main() {
      vec2 uv = vUv;
      uv -= 0.5;

      /* Calculate the depth & perspective */
      vec3 viewDir = toTangentSpace(normalize(cameraPosition - uPlanePosition));

      float detphDist = 0.0;
      float detphDist1 = 0.2;
      float detphDist2 = 0.4;

      vec2 offset = vec2(detphDist) * viewDir.xy;
      vec2 offset1 = vec2(detphDist1) * viewDir.xy;
      vec2 offset2 = vec2(detphDist2) * viewDir.xy;

      /* Shapes */
      float shape = sdfCircle(uv, 0.2, offset);
      float shape1 = sdfCircle(uv, 0.3, offset1);
      float shape2 = sdfCircle(uv, 0.4, offset2);

      /* Colors */
      vec3 col = vec3(1.0);

      /* Blend them together */
      col = mix(vec3(1, 0, 0), col, step(0., shape2));
      col = mix(vec3(0, 1, 0), col, step(0., shape1));
      col = mix(vec3(0, 0, 1), col, step(0., shape));

      gl_FragColor = vec4(col, 1.0);
    }
  `
}

const DepthShader = () => {
  const size = useThree((s) => s.size)

  return (
    <>
      <OrbitControls />
      <Text
        font="/fonts/grotesque/BasementGrotesqueDisplay-UltraBlackExtraExpanded.woff"
        position={[2.2, 2.35, 0]}
        fontSize={0.215}
      >
        Improved Version
      </Text>
      <mesh position={[2.2, 0, 0]}>
        <planeGeometry args={[4, 4]} />
        <shaderMaterial
          vertexShader={classicMethod.vertexShader}
          fragmentShader={classicMethod.fragmentShader}
          uniforms={{
            uPlanePosition: {
              value: new THREE.Vector3(2.2, 0, 0)
            },
            uResolution: { value: new THREE.Vector2(size.width, size.height) }
          }}
        />
      </mesh>

      <Text
        font="/fonts/grotesque/BasementGrotesqueDisplay-UltraBlackExtraExpanded.woff"
        position={[-2.2, 2.35, 0]}
        fontSize={0.215}
      >
        Classic Version
      </Text>
      <mesh position={[-2.2, 0, 0]}>
        <planeGeometry args={[4, 4]} />
        <shaderMaterial
          vertexShader={improvedMethod.vertexShader}
          fragmentShader={improvedMethod.fragmentShader}
          uniforms={{
            uPlanePosition: {
              value: new THREE.Vector3(-2.2, 0, 0)
            },
            uResolution: { value: new THREE.Vector2(size.width, size.height) }
          }}
        />
      </mesh>
      <PerspectiveCamera makeDefault fov={10} position={[0, 0, 35]} />
    </>
  )
}

DepthShader.Title = 'Depth Shader'
DepthShader.Tags = 'private'
DepthShader.Description = (
  <>
    <p>
      An implementation of a parallax mapping shader. Inspired on{' '}
      <a
        target="_blank"
        href="https://twitter.com/bgolus/status/1603810525288488961?s=20&t=V85AebyZeO_ubDW1yewiTw"
        rel="noopener"
      >
        @bgolus's tweet
      </a>
      .
    </p>
  </>
)

export default DepthShader
