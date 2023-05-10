import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, GodRays, Noise } from '@react-three/postprocessing'
import glsl from 'glslify'
import { folder } from 'leva'
import { DURATION, gsap } from 'lib/gsap'
import { BlendFunction, KernelSize, Resizer } from 'postprocessing'
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import * as THREE from 'three'

import { AspectCanvas } from '~/components/common/aspect-canvas'
import { useLoader } from '~/components/common/loader'
import { useGsapContext } from '~/hooks/use-gsap-context'
import { useReproducibleControls } from '~/hooks/use-reproducible-controls'
import { useUniforms } from '~/hooks/use-uniforms'

import { HTMLLayout } from '../components/layout/html-layout'
import { trackCursor } from '../lib/three'

/* START OF SHADERS */

/* ----------- PARTICLES SHADER ------------ */

const particlesVert = glsl/* glsl */ `
#pragma glslify: snoise2 = require('glsl-noise/simplex/2d')

uniform float uTime;
uniform float uPixelRatio;
uniform float uSize;
uniform float uParticleVelocity;
uniform float uParticleDisplaceFactor;

attribute float aScale;

void main()
{
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    /* Add noise movement */
    float noiseX = snoise2(vec2(position.x, uTime * uParticleVelocity)) * uParticleDisplaceFactor;
    float noiseY = snoise2(vec2(position.y, uTime * uParticleVelocity)) * uParticleDisplaceFactor;
    float noiseZ = snoise2(vec2(position.z, uTime * uParticleVelocity)) * uParticleDisplaceFactor;

    modelPosition = vec4(
      modelPosition.x + noiseX,
      modelPosition.y + noiseY,
      modelPosition.z + noiseZ,
      modelPosition.w
    );

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;

    gl_Position = projectionPosition;
    
    gl_PointSize = uSize * aScale * uPixelRatio;
    gl_PointSize *= (1.0 / - viewPosition.z);
}
`

const particlesFrag = glsl/* glsl */ `
uniform vec3 uColor;
uniform float uAlpha;

void main()
{
  float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
  float strength = min(0.05 / distanceToCenter - 0.1, uAlpha);

  gl_FragColor = vec4(uColor, strength);
}
`

/* END OF SHADERS */

const config = {
  modelSrc: 'bunker.glb',
  camera: {
    position: new THREE.Vector3(0.7507294368005816, -2, 8.688852630592953),
    rotation: new THREE.Euler(
      0.3679671281735305,
      0.06208526103691726,
      -0.023915566989092085
    ),
    fov: 10,
    rotationMultiplier: {
      x: 0.001,
      y: 0.001
    }
  }
}

const Bunker = (props) => {
  const setLoaded = useLoader((s) => s.setLoaded)
  const scene = useThree((s) => s.scene)

  const { nodes, materials } = useGLTF(
    `/models/${config.modelSrc}`,
    undefined,
    undefined,
    (loader) => {
      loader.manager.onLoad = () => setLoaded()
    }
  )

  useLayoutEffect(() => {
    materials.Mat_in.fog = false
  }, [materials.Mat_in, scene])

  return (
    <group {...props} dispose={null}>
      <mesh
        geometry={nodes.B.geometry}
        material={materials.LIGHT}
        position={[6.00127411, 16.34449577, 4.43831205]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.005795, 0.00223818, 0.005795]}
      />
      <mesh
        geometry={nodes.E.geometry}
        material={materials.LIGHT}
        position={[6.00127411, 16.34449577, 4.43831205]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.005795, 0.00223818, 0.005795]}
      />
      <mesh
        geometry={nodes.K.geometry}
        material={materials.LIGHT}
        position={[6.00127411, 16.34449577, 4.43831205]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.005795, 0.00223818, 0.005795]}
      />
      <mesh
        geometry={nodes.N.geometry}
        material={materials.LIGHT}
        position={[6.00127411, 16.34449577, 4.43831205]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.005795, 0.00223818, 0.005795]}
      />
      <mesh
        geometry={nodes.R.geometry}
        material={materials.LIGHT}
        position={[6.00127411, 16.34449577, 4.43831205]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.005795, 0.00223818, 0.005795]}
      />
      <mesh
        geometry={nodes.U.geometry}
        material={materials.LIGHT}
        position={[6.00127411, 16.34449577, 4.43831205]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.005795, 0.00223818, 0.005795]}
      />
      <mesh
        geometry={nodes.EDF.geometry}
        material={materials.Mat_Edf}
        position={[6.00127506, 16.34449387, 4.43831062]}
        rotation={[Math.PI / 2, -1.2e-7, -Math.PI / 2]}
        scale={0.01}
      />
      <mesh
        geometry={nodes.IN.geometry}
        material={materials.Mat_in}
        position={[6.00127506, 16.34449387, 4.43831062]}
        rotation={[Math.PI / 2, -1.2e-7, -Math.PI / 2]}
        scale={0.01}
      />
    </group>
  )
}

const Sun = forwardRef(function Sun(props, forwardRef) {
  const ref = useRef(null)
  const controls = useReproducibleControls({
    Sun: folder({
      color: { value: '#ff0000' },
      position: { value: [-0.1, -0.15, -0.45] }
    })
  })

  useGsapContext(() => {
    ref.current.visible = false

    gsap
      .timeline()
      .to({}, { duration: 2.5 })
      .call(() => {
        ref.current.visible = true
      })
      .to({}, { duration: 0.05 })
      .call(() => {
        ref.current.visible = false
      })
      .to({}, { duration: 0.05 })
      .call(() => {
        ref.current.visible = true
      })
      .to({}, { duration: 0.05 })
      .call(() => {
        ref.current.visible = false
      })
      .to({}, { duration: 0.2 })
      .call(() => {
        ref.current.visible = true
      })
  }, [])

  useImperativeHandle(forwardRef, () => ref.current, [])

  const width = 2.55
  const height = 1

  return (
    <mesh position={controls.position} rotation={controls.rotation} ref={ref}>
      <boxGeometry args={[width, height, width]} />
      <meshBasicMaterial color={controls.color} />
    </mesh>
  )
})

function Effects() {
  const [material, set] = useState()
  const controls = useReproducibleControls({
    'Post Processing': folder({
      noise: {
        value: true
      },
      noiseOpacity: {
        value: 0.75,
        min: 0,
        max: 1,
        step: 0.01
      }
    })
  })

  return (
    <>
      <Sun ref={set} />
      {material && (
        <EffectComposer multisampling={0}>
          <GodRays
            sun={material}
            blendFunction={BlendFunction.Screen}
            samples={100}
            density={0.9}
            decay={0.92}
            weight={0.4}
            exposure={0.4}
            clampMax={1}
            width={Resizer.AUTO_SIZE}
            height={Resizer.AUTO_SIZE}
            kernelSize={KernelSize.MEDIUM}
            blur={true}
          />
          {controls.noise && <Noise opacity={controls.noiseOpacity} />}
        </EffectComposer>
      )}
    </>
  )
}

const CamAnimation = () => {
  const prevAutoMove = useRef()
  const [autoMove, setAutoMove] = useState(true)

  const { gl, camera } = useThree((state) => ({
    gl: state.gl,
    camera: state.camera
  }))

  const calculateCamPosOnSphericalCoords = useMemo(() => {
    /* Target is the point where the cam should be looking at. AKA the center if the sphere. */
    const target = new THREE.Vector3(0.1, 0.55, 0)
    const offset = new THREE.Vector3()

    /* I don't understand this, quaternions are difficult AF */
    const quat = new THREE.Quaternion().setFromUnitVectors(
      camera.up,
      new THREE.Vector3(0, 1, 0)
    )
    const quatInverse = quat.clone().invert()

    // current position in spherical coordinates
    const spherical = new THREE.Spherical()
    const sphericalDelta = new THREE.Spherical()

    return ({ x = 0, y = 0 }) => {
      // This takes the mouse position and converts it to spherical coordinates -1 to 1 is a complete circunference
      sphericalDelta.theta =
        (gl.domElement.clientHeight * Math.PI * x) /
        gl.domElement.clientHeight /
        40 /* This controls the portion of the circunference to rotate (1 / 40) */
      sphericalDelta.phi =
        -(
          (gl.domElement.clientHeight * Math.PI * y) /
          gl.domElement.clientHeight
        ) /
        30 /* This controls the portion of the circunference to rotate (1 / 30) */

      // Update the camera
      offset.copy(config.camera.position).sub(target)

      // rotate offset to "y-axis-is-up" space
      offset.applyQuaternion(quat)

      // angle from z-axis around y-axis
      spherical.setFromVector3(offset)

      spherical.theta += sphericalDelta.theta
      spherical.phi += sphericalDelta.phi

      offset.setFromSpherical(spherical)

      offset.applyQuaternion(quatInverse)

      /* Reset Delta */
      sphericalDelta.set(0, 0, 0)

      return { target, offset }
    }
  }, [camera, gl])

  const updateCam = useCallback(
    ({ x = 0, y = 0, immediate = false }) => {
      const { offset, target } = calculateCamPosOnSphericalCoords({ x, y })

      gsap[immediate ? 'set' : 'to'](camera.position, {
        overwrite: true,
        duration: DURATION,
        x: offset.x,
        y: offset.y,
        z: offset.z,
        ease: 'power2.out',
        onUpdate: () => {
          camera.lookAt(target)
        }
      })
    },
    [calculateCamPosOnSphericalCoords, camera]
  )

  /* Mouse animation */
  useLayoutEffect(() => {
    const TIMEOUT_DURATION = 2500
    let timeoutId

    updateCam({ x: Math.sin(0), y: Math.cos(0), immediate: true })

    const mouseTracker = trackCursor((cursor) => {
      setAutoMove(false)

      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        setAutoMove(true)
        clearTimeout(timeoutId)
      }, TIMEOUT_DURATION)

      updateCam({ x: cursor.x, y: cursor.y })
    }, gl.domElement)

    return mouseTracker.destroy
  }, [updateCam, gl.domElement])

  /* Automatic animation */
  useGsapContext(() => {
    if (!autoMove) {
      return () => {
        prevAutoMove.current = autoMove
      }
    }

    const { offset, target } = calculateCamPosOnSphericalCoords({
      x: Math.sin(0),
      y: Math.cos(0)
    })
    const trgt = { x: 0, y: 0 }

    const FULL_ROTATION_DURATION = DURATION * 80

    const timeline = gsap.timeline()

    if (prevAutoMove.current !== undefined) {
      timeline.to(camera.position, {
        duration: FULL_ROTATION_DURATION / 4,
        ease: 'none',
        z: offset.z,
        x: offset.x,
        y: offset.y,
        onUpdate: () => {
          camera.lookAt(target)
        }
      })
    }

    timeline.to(trgt, {
      duration: FULL_ROTATION_DURATION,
      repeat: -1,
      ease: 'none',

      x: Math.PI * 2,
      y: Math.PI * 2,

      onUpdate: () => {
        const resX = Math.sin(trgt.x)
        const resY = Math.cos(trgt.y)

        updateCam({
          x: resX,
          y: resY,
          immediate: true
        })
      }
    })

    return () => {
      prevAutoMove.current = autoMove
    }
  }, [updateCam, autoMove, camera])

  return <></>
}

const BunkerScene = () => {
  const controls = useReproducibleControls({
    /* Fog */
    fogColor: { value: '#000' },
    // fogDensity: { min: 0, max: 0.1, value: 0.05, step: 0.0001 },
    fogNear: { min: 0, max: 100, value: 8.8, step: 0.1 },
    fogFar: { min: 0, max: 100, value: 9.6, step: 0.1 },

    /* Light */
    ambientLightIntensity: { value: 0.8, min: 0, max: 1, step: 0.01 },

    /* Particles */
    Particles: folder({
      uSize: { value: 25, min: 0, max: 300, step: 1 },
      uColor: { value: '#fff' },
      uAlpha: { value: 0.25, min: 0, max: 1, step: 0.01 },
      uParticleVelocity: { value: 0.1, min: 0, max: 1, step: 0.01 },
      uParticleDisplaceFactor: { value: 0.5, min: 0, max: 1, step: 0.01 }
    })
  })

  const dustParticlesGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()

    const count = 1000

    const positions = new Float32Array(count * 3)
    const scale = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10

      scale[i] = 1
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scale, 1))

    return geometry
  }, [])

  const particleUniforms = useUniforms(
    {
      uTime: { value: 0 },
      uParticleVelocity: { value: 0.1 },
      uParticleDisplaceFactor: { value: 0.5 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uSize: { value: controls.particleSize },
      uColor: { value: new THREE.Color(controls.particleColor) },
      uAlpha: { value: controls.uAlpha }
    },
    controls,
    {
      middlewares: {
        uColor: (curr, input) => {
          curr?.set(input)
        }
      }
    }
  )

  useFrame((state) => {
    particleUniforms.current.uTime.value = state.clock.getElapsedTime()
  })

  return (
    <>
      {/* Ambient */}
      <fog
        attach="fog"
        args={[controls.fogColor, controls.fogNear, controls.fogFar]}
      />
      <ambientLight intensity={controls.ambientLightIntensity} />

      {/* <OrbitControls /> */}
      <CamAnimation />

      {/* Model */}
      <group rotation={[0, -Math.PI / 5.5, 0]}>
        <Bunker position={[0, -3, 0]} scale={0.2} />

        {/* Effects contains the God Lights sun, thats why it's inside de main rotation group */}
        <Effects />
      </group>

      {/* Particles */}
      <points geometry={dustParticlesGeometry} dispose={null}>
        <shaderMaterial
          uniforms={particleUniforms.current}
          vertexShader={particlesVert}
          fragmentShader={particlesFrag}
          transparent={true}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </>
  )
}

export const title = 'Bunker Scene'
export const tags = ['three', 'private']
BunkerScene.Layout = ({ children, ...props }) => (
  <HTMLLayout {...props}>
    <AspectCanvas
      ratio={21 / 9}
      config={{
        camera: {
          position: config.camera.position,
          rotation: config.camera.rotation,
          fov: config.camera.fov
        }
      }}
    >
      {children}
    </AspectCanvas>
  </HTMLLayout>
)

export default BunkerScene
