import { PerspectiveCamera, useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { range } from 'lodash'
import React, { useMemo } from 'react'
import * as THREE from 'three'

import { CoolGrid } from '~/components/common/cool-grid'

// eslint-disable-next-line prettier/prettier
const helpers = /* glsl */ `
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
  vertexShader: /* glsl */ `
    varying vec2 vUv;

    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      vUv = uv;
    }
  `,
  // eslint-disable-next-line prettier/prettier
  fragmentShader: /* glsl */ `
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
const params = /* glsl */ `
  uniform vec3 uPlanePosition;
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
  vertexShader: /* glsl */ `
    ${params}

    void main() {
      if (room_depth != 0.) {
        vec2 d = vec2(room_size, room_size)/2.;
        vec3 delta = vec3(d.x, d.y, 0.);

        obj_vertex = position - delta;

        //camera pos in obj space
        obj_cam = inverse(modelViewMatrix)[3].xyz - delta;
      }

      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      vUv = uv;
    }
  `,

  // eslint-disable-next-line prettier/prettier
  fragmentShader: /* glsl */ `
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

    vec4 blend(vec4 a, vec4 b, float t) {
      return a * (1. - t) + b * t;
    }

    float sdfCircle(vec2 uv, float r, vec2 offset) {
      float x = uv.x - offset.x;
      float y = uv.y - offset.y;

      return length(vec2(x, y)) - r;
    }

    vec3 toTangentSpace(vec3 vec) {
      vec3 normal = vec3(0.0, 0.0, 1.0);

      vec3 tangent = normalize(vec3(1.0, 0.0, 0.0));
      vec3 bitangent = normalize(cross(normal, tangent));

      mat3 tbn = mat3(tangent, bitangent, normal);

      return tbn * vec;
    }

    void main() {
      vec3 color = vec3(0.);
      
      /* Cube Mapping */
      vec3 cm_face = vec3(0., 0., 1.);
      vec2 cm_uv = vUv;
      
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

      if (!(ceil_t == min_t)) {
        tex_coord.y /= room_depth;
      }

      cm_uv = (tex_coord*.5 + 1.);

      cm_uv.x = clamp(cm_uv.x, 0., 1.);
      cm_uv.y = clamp(cm_uv.y, 0., 1.);
      
      color = sample_cubemap(cubemap_albedo, cm_uv, cm_face);


      /* Parallax */
      vec2 parallaxUv = vUv;
      parallaxUv -= 0.5;

      vec3 viewDir = toTangentSpace(normalize(cameraPosition - uPlanePosition));
      vec3 normal = toTangentSpace(vec3(0.0, 0.0, 1.0));
      float facingCoeficient = dot(viewDir, normal);
      vec3 perspective = viewDir / facingCoeficient;

      float detphDist1 = 0.2;
      float detphDist2 = 0.35;
      float detphDist3 = 0.5;

      vec2 offset1 = vec2(detphDist1) * perspective.xy;
      vec2 offset2 = vec2(detphDist2) * perspective.xy;
      vec2 offset3 = vec2(detphDist3) * perspective.xy;

      float shape1 = sdfCircle(parallaxUv, 0.1, offset1);
      float shape2 = sdfCircle(parallaxUv, 0.14, offset2);
      float shape3 = sdfCircle(parallaxUv, 0.18, offset3);

      /* Blend */
      color = mix(vec3(1, 0, 0), color, step(0., shape3));
      color = mix(vec3(0, 1, 0), color, step(0., shape2));
      color = mix(vec3(0, 0, 1), color, step(0., shape1));

      gl_FragColor = vec4(color, 1.0);
    }
  `
}

const Window = () => {
  const cubemap_albedo = useTexture('/textures/cubemap-faces.png')

  return (
    <>
      {range(-15, 15).map((idx) => {
        const position = [idx * 2.1, 1, 0]
        return (
          <mesh position={position} key={idx}>
            <planeGeometry args={[2, 2]} />
            <shaderMaterial
              uniforms={{
                uPlanePosition: { value: position },
                room_size: { value: 2 },
                cubemap_albedo: { value: cubemap_albedo },
                room_depth: { value: 1 }
              }}
              vertexShader={interiorCubeMap.vertexShader}
              fragmentShader={interiorCubeMap.fragmentShader}
            />
          </mesh>
        )
      })}
    </>
  )
}

const KEYS = {
  a: 65,
  s: 83,
  w: 87,
  d: 68
}

class InputController {
  constructor(target) {
    this.target_ = target || document
    this.initialize_()
  }

  initialize_() {
    this.current_ = {
      leftButton: false,
      rightButton: false,
      mouseXDelta: 0,
      mouseYDelta: 0,
      mouseX: 0,
      mouseY: 0
    }
    this.previous_ = null
    this.keys_ = {}
    this.previousKeys_ = {}
    this.target_.addEventListener('click', (e) => this.onClick_(e), false)
    this.target_.addEventListener(
      'mousedown',
      (e) => this.onMouseDown_(e),
      false
    )
    this.target_.addEventListener(
      'mousemove',
      (e) => this.onMouseMove_(e),
      false
    )
    this.target_.addEventListener('mouseup', (e) => this.onMouseUp_(e), false)
    document.addEventListener('keydown', (e) => this.onKeyDown_(e), false)
    document.addEventListener('keyup', (e) => this.onKeyUp_(e), false)
  }

  onClick_(e) {
    e.target.requestPointerLock()
  }

  onMouseMove_(e) {
    if (document.pointerLockElement != this.target_) {
      this.current_.mouseXDelta = 0
      this.current_.mouseYDelta = 0

      return
    }

    this.current_.mouseXDelta = e.movementX
    this.current_.mouseYDelta = e.movementY
  }

  onMouseDown_(e) {
    this.onMouseMove_(e)

    switch (e.button) {
      case 0: {
        this.current_.leftButton = true
        break
      }
      case 2: {
        this.current_.rightButton = true
        break
      }
    }
  }

  onMouseUp_(e) {
    this.onMouseMove_(e)

    switch (e.button) {
      case 0: {
        this.current_.leftButton = false
        break
      }
      case 2: {
        this.current_.rightButton = false
        break
      }
    }
  }

  onKeyDown_(e) {
    this.keys_[e.keyCode] = true
  }

  onKeyUp_(e) {
    this.keys_[e.keyCode] = false
  }

  key(keyCode) {
    return !!this.keys_[keyCode]
  }

  isReady() {
    return this.previous_ !== null
  }

  update(_) {
    this.current_.mouseXDelta = 0
    this.current_.mouseYDelta = 0
  }
}

class FirstPersonCamera {
  constructor(camera, canvas) {
    this.camera_ = camera
    this.input_ = new InputController(canvas)
    this.rotation_ = new THREE.Quaternion()
    this.translation_ = new THREE.Vector3().copy(camera.position).setY(0.9)
    this.phi_ = 0
    this.phiSpeed_ = 0.85
    this.theta_ = 0
    this.thetaSpeed_ = 0.85
    this.headBobActive_ = false
    this.headBobTimer_ = 0
  }

  update(timeElapsedS) {
    this.updateRotation_(timeElapsedS)
    this.updateCamera_(timeElapsedS)
    this.updateTranslation_(timeElapsedS)
    this.updateHeadBob_(timeElapsedS)
    this.input_.update(timeElapsedS)
  }

  updateCamera_(_) {
    this.camera_.quaternion.copy(this.rotation_)
    this.camera_.position.copy(this.translation_)
    this.camera_.position.y += Math.sin(this.headBobTimer_ * 20) * 0.1

    const forward = new THREE.Vector3(0, 0, -1)
    forward.applyQuaternion(this.rotation_)

    forward.multiplyScalar(100)
    forward.add(this.translation_)
  }

  updateHeadBob_(timeElapsedS) {
    if (this.headBobActive_) {
      const wavelength = Math.PI
      const nextStep =
        1 + Math.floor(((this.headBobTimer_ + 0.000001) * 10) / wavelength)
      const nextStepTime = (nextStep * wavelength) / 10
      this.headBobTimer_ = Math.min(
        this.headBobTimer_ + timeElapsedS,
        nextStepTime
      )

      if (this.headBobTimer_ == nextStepTime) {
        this.headBobActive_ = false
      }
    }
  }

  updateTranslation_(timeElapsedS) {
    const forwardVelocity =
      (this.input_.key(KEYS.w) ? 1 : 0) + (this.input_.key(KEYS.s) ? -1 : 0)
    const strafeVelocity =
      (this.input_.key(KEYS.a) ? 1 : 0) + (this.input_.key(KEYS.d) ? -1 : 0)

    const qx = new THREE.Quaternion()
    qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi_)

    const forward = new THREE.Vector3(0, 0, -1)
    forward.applyQuaternion(qx)
    forward.multiplyScalar(forwardVelocity * timeElapsedS * 10)

    const left = new THREE.Vector3(-1, 0, 0)
    left.applyQuaternion(qx)
    left.multiplyScalar(strafeVelocity * timeElapsedS * 10)

    this.translation_.add(forward)
    this.translation_.add(left)

    if (forwardVelocity != 0 || strafeVelocity != 0) {
      this.headBobActive_ = true
    }
  }

  updateRotation_() {
    const xh = this.input_.current_.mouseXDelta / window.innerWidth
    const yh = this.input_.current_.mouseYDelta / window.innerHeight

    this.phi_ += -xh * this.phiSpeed_
    this.theta_ = THREE.MathUtils.clamp(
      this.theta_ + -yh * this.thetaSpeed_,
      -Math.PI / 3,
      Math.PI / 3
    )

    const qx = new THREE.Quaternion()
    qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi_)
    const qz = new THREE.Quaternion()
    qz.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.theta_)

    const q = new THREE.Quaternion()
    q.multiply(qx)
    q.multiply(qz)

    this.rotation_.copy(q)
  }
}

const FakeWindow = () => {
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)

  const camControl = useMemo(() => {
    return new FirstPersonCamera(camera, gl.domElement)
  }, [camera, gl])

  useFrame((s) => {
    camControl.update(s.clock.getDelta() * 4)
  })

  return (
    <>
      <CoolGrid />
      <fog attach="fog" args={['#fff', 4, 20]} />

      <color args={['#fff']} attach="background" />

      <PerspectiveCamera position={[0, 0, 5]} makeDefault fov={22} />

      <Window />
    </>
  )
}

export const title = 'FakeWindow'
export const tags = ['private']
export const description = (
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
