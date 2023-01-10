import {
  Environment,
  Mask,
  OrbitControls,
  PerspectiveCamera,
  useMask,
  useTexture
} from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { useControls } from 'leva'
import React, { useRef } from 'react'
import * as THREE from 'three'

import { CoolGrid } from '~/components/common/cool-grid'

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const depth = {
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

    uniform sampler2D uMap1;
    uniform sampler2D uMap2;
    uniform sampler2D uMap3;

    ${helpers}

    void main() {
      vec2 uv = vUv;
   

      /* Calculate the depth & perspective */
      vec3 viewDir = toTangentSpace(normalize(cameraPosition - uPlanePosition));
      vec3 normal = toTangentSpace(vec3(0.0, 0.0, 1.0));

      float facingCoeficient = dot(viewDir, normal);
      vec3 perspective = viewDir / facingCoeficient;

      float detphDist = 0.0;
      float detphDist1 = 0.033;

      vec2 offset = vec2(detphDist) * perspective.xy;
      vec2 offset1 = vec2(detphDist1) * perspective.xy;

      /* Shapes */
      vec4 shape = texture2D(uMap1, uv - offset);
      vec4 shape1 = texture2D(uMap2, uv - offset1);
      vec4 shape2 = texture2D(uMap3, uv - offset);

      gl_FragColor = mix(gl_FragColor, shape2, shape2.a);
    }
  `
}

// eslint-disable-next-line prettier/prettier
const params =/* glsl */ `
  uniform float room_size;
  uniform float room_depth;
  uniform sampler2D cubemap_albedo;
  uniform float emission_strength;

  varying vec3 obj_vertex;
  varying vec3 obj_cam;
  varying vec2 vUv;
`

const interiorCubeMap = {
  // eslint-disable-next-line prettier/prettier
  vertexShader:/* glsl */ `
    ${params}

    void main() {
      if (room_depth != 0.) {
        vec2 d = vec2(room_size, room_size)/2.;
        vec3 delta = vec3(d.x, d.y, 0.);

        obj_vertex = position - delta;

        //camera pos in obj space
        obj_cam = inverse(modelViewMatrix)[3].xyz - delta;
        
        vUv = uv;
      }

      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  // eslint-disable-next-line prettier/prettier
  fragmentShader:/* glsl */ `
    ${params}

    float remap_range(float value, float min_in, float max_in, float min_out, float max_out) {
      return(value - min_in) / (max_in - min_in) * (max_out - min_out) + min_out;
    }

    vec3 sample_cubemap(sampler2D cubemap, vec2 uv, vec3 face) {
      face = normalize(face);

      if (face.x == 1.) {
        //+X
        uv.x = remap_range(uv.x, 0., 1., 0., 1./3.);
        uv.y = remap_range(uv.y, 0., 1., 0., 1./2.);
      }
      else if (face.x == -1.) {
        //-X
        uv.x = remap_range(uv.x, 0., 1., 0., 1./3.);
        uv.y = remap_range(uv.y, 0., 1., 1./2., 1.);
      }
      else if (face.y == 1.) {
        //+Y
        uv.x = remap_range(uv.x, 0., 1., 1./3., 2./3.);
        uv.y = remap_range(uv.y, 0., 1., 0., 1./2.);
      }
      else if (face.y == -1.) {
        //-Y
        uv.x = remap_range(uv.x, 0., 1., 1./3., 2./3.);
        uv.y = remap_range(uv.y, 0., 1., 1./2., 1.);
      }
      else if (face.z == 1.) {
        //+Z
        uv.x = remap_range(uv.x, 0., 1., 2./3., 1.);
        uv.y = remap_range(uv.y, 0., 1., 0., 1./2.);
      }
      else if (face.z == -1.) {
        //-Z
        uv.x = remap_range(uv.x, 0., 1., 2./3., 1.);
        uv.y = remap_range(uv.y, 0., 1., 1./2., 1.);
      }

      return texture(cubemap, uv).rgb;
    }

    void main() {
      vec3 cm_face = vec3(0., 0., 1.);
      vec2 cm_uv = vUv;

      if (room_depth != 0.) {
        float depth = room_depth * 2.;
        vec3 cam2pix = obj_vertex - obj_cam;
        
        //camp2pix.y <= 0 --> show floor
        //camp2pix.y > 0 --> show ceiling
        float is_floor = step(cam2pix.z, 0.);
        float ceil_y   = ceil(obj_vertex.z / depth - is_floor) * depth;
        float ceil_t   = (ceil_y - obj_cam.z) / cam2pix.z;
        
        //camp2pix.z <= 0 --> show north
        //camp2pix.z > 0 --> show south
        float is_north = step(cam2pix.y, 0.);
        float wall_f_z = ceil(obj_vertex.y / room_size - is_north) * room_size;
        float wall_f_t = (wall_f_z - obj_cam.y) / cam2pix.y;
        
        //camp2pix.x <= 0 --> show east
        //camp2pix.x > 0 --> show west
        float is_east  = step(cam2pix.x, 0.);
        float wall_e_z = ceil(obj_vertex.x / room_size - is_east) * room_size;
        float wall_e_t = (wall_e_z - obj_cam.x) / cam2pix.x;
        
        vec2 tex_coord;
        float min_t = min(min(ceil_t, wall_e_t), wall_f_t);
        
        if (wall_e_t == min_t) {
          //East / West
          tex_coord = obj_cam.zy + wall_e_t * cam2pix.zy;
          cm_face = vec3((is_east == 0.) ? 1. : -1., 0., 0.);
        }
        else if (wall_f_t == min_t) {
          //Front / Back
          tex_coord = obj_cam.xz + wall_f_t * cam2pix.xz;
          cm_face = vec3(0., (is_north == 0.) ? -1. : 1., 0.);
        }
        else if (ceil_t == min_t) {
          //Ceiling / Floor
          tex_coord = obj_cam.xy + ceil_t * cam2pix.xy;
          cm_face = vec3(0., 0., (is_floor == 0.) ? 1. : -1.);
        }

        // if (!(ceil_t == min_t)) {
        //   tex_coord.y /= room_depth;
        // }

        cm_uv = (tex_coord*.5 + 1.);

        cm_uv.x = clamp(cm_uv.x, 0., 1.);
        cm_uv.y = clamp(cm_uv.y, 0., 1.);

        gl_FragColor = vec4(sample_cubemap(cubemap_albedo, cm_uv, cm_face), 1.0);
      } else {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.);
      }
    }
  `
}

const Window = () => {
  const cubemap_albedo = useTexture('/textures/cubemap-faces.png', (t) => {
    // t.wrapS = t.wrapT = THREE.RepeatWrapping
  })

  return (
    <>
      <mesh position={[0, 1, 0]}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          uniforms={{
            room_size: { value: 2 },
            cubemap_albedo: { value: cubemap_albedo },
            room_depth: { value: 0.5 }
          }}
          vertexShader={interiorCubeMap.vertexShader}
          fragmentShader={interiorCubeMap.fragmentShader}
        />
      </mesh>
    </>
  )
}

const FakeWindow = () => {
  return (
    <>
      <CoolGrid />
      <fog attach="fog" args={['#fff', 4, 20]} />

      <color args={['#fff']} attach="background" />

      <OrbitControls />
      <Window />
    </>
  )
}

FakeWindow.Title = 'FakeWindow'
FakeWindow.Tags = 'public'
FakeWindow.Description = (
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

export default FakeWindow
