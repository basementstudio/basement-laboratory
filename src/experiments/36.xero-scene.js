import { Environment, Lightformer, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import {
  Bloom,
  EffectComposer,
  Noise,
  Vignette
} from '@react-three/postprocessing'
import { folder } from 'leva'
import { gsap } from 'lib/gsap'
import { Perf } from 'r3f-perf'
import { forwardRef, useCallback, useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { lerp } from 'three/src/math/MathUtils'

import { AspectCanvas } from '~/components/common/aspect-canvas'
import { CamTargetRotation } from '~/components/common/cam-target-rotation'
import { useLoader } from '~/components/common/loader'
import { Particles } from '~/components/common/particles'
import { HTMLLayout } from '~/components/layout/html-layout'
import { useReproducibleControls } from '~/hooks/use-reproducible-controls'

const setCameraLookAtEuler = (position, target) => {
  /*
  Camera records towards z: -1 of its own coordinate system so we need to use the Matrix4 transformation API
  wich supports this eye -> target coordinate system using the lookAt method. See the source code of the Object3D
  lookAt method for more details:
  
  https://github.com/mrdoob/three.js/blob/f021ec0c9051eb11d110b0c2b93305bffd0942e0/src/core/Object3D.js#L260
*/
  const m = new THREE.Matrix4()

  m.lookAt(position, target, new THREE.Vector3(0, 1, 0))

  return new THREE.Euler().setFromRotationMatrix(m)
}

const config = {
  modelSrc: 'xero.glb',
  camera: {
    position: new THREE.Vector3(3.8974264860083605, 0.82, -2.3958733109675228),
    rotation: new THREE.Euler(0, 0, 0),
    fov: 10,
    near: 0.1,
    far: 10,
    target: new THREE.Vector3(-0.15, 2.25, 1.12),
    rotationMultipliers: { x: 1 / 30, y: 1 / 40 }
  },
  ambient: {
    minMaxIntensity: [0.02, 1]
  },
  neon: {
    target: 0.54
  }
}

config.camera.rotation.copy(
  setCameraLookAtEuler(config.camera.position, config.camera.target)
)

const Xero = forwardRef((props, ref) => {
  const setLoaded = useLoader((s) => s.setLoaded)
  const { nodes, materials } = useGLTF(
    `/models/${config.modelSrc}`,
    undefined,
    undefined,
    (loader) => {
      loader.manager.onLoad = () => setLoaded()
    }
  )

  useLayoutEffect(() => {
    materials['Cartel.001'].toneMapped = false
    materials['Cartel.001'].emissive.setRGB(0, 0, 0)
    materials['Cartel.001'].emissiveIntensity = 1
    materials['Cartel.001'].envMapIntensity = 0
    materials['SCENE.001'].envMapIntensity = 0.08
  }, [])

  return (
    <group {...props} dispose={null}>
      <mesh
        name="Cartel001"
        geometry={nodes.Cartel001.geometry}
        material={materials['Cartel.001']}
        position={[0.49438527, -4.25901508, -0.93923509]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.00999999}
        ref={ref}
      />
      <mesh
        name="SCENE001"
        geometry={nodes.SCENE001.geometry}
        material={materials['SCENE.001']}
        position={[-1.35712373, 1.81302774, -0.00302282]}
        rotation={[Math.PI / 2, -8e-8, Math.PI]}
        scale={0.01}
      />
    </group>
  )
})

const Effects = () => {
  const bloomRef = useRef()

  const controls = useReproducibleControls({
    Vignette: folder({
      offset: {
        value: 0.46,
        min: 0,
        max: 1
      },
      darkness: {
        value: 0.6399999999999999,
        min: 0,
        max: 1
      },
      opacity: {
        value: 0.73,
        min: 0,
        max: 1
      }
    }),
    Bloom: folder({
      radius: {
        value: 0.64,
        min: 0,
        max: 1,
        step: 0.001
      },
      luminanceSmoothing: {
        value: 0.4,
        min: 0,
        max: 1
      },
      luminanceThreshold: {
        value: 0.87,
        min: 0,
        max: 2
      }
    }),
    Noise: folder({
      noiseOpacity: {
        value: 0.2,
        min: 0,
        max: 1,
        step: 0.01
      }
    })
  })

  return (
    <EffectComposer
      disableGamma={false}
      disableRender={false}
      disableRenderPass={false}
      multisamping={0}
      renderIndex={1}
    >
      <Noise opacity={controls.noiseOpacity} />

      <Bloom
        radius={controls.radius}
        luminanceThreshold={controls.luminanceThreshold}
        luminanceSmoothing={controls.luminanceSmoothing}
        mipmapBlur
        ref={bloomRef}
      />

      <Vignette
        opacity={controls.opacity}
        darkness={controls.darkness}
        offset={controls.offset}
      />
    </EffectComposer>
  )
}

function MovingSpots({ positions = [2, 0, 2, 0, 2, 0] }) {
  const group = useRef()

  const interval = 120

  useFrame(
    (state, delta) =>
      (group.current.position.z += delta * 35) > interval &&
      (group.current.position.z = -interval)
  )

  return (
    <group position={[0, 4, 0]} rotation={[0, 0, -Math.PI / 2]}>
      <group ref={group}>
        {positions.map((x, i) => (
          <Lightformer
            key={i}
            form="rect"
            intensity={5}
            rotation={[Math.PI / 2, 0, 0]}
            position={[x, 4, i * 6]}
            scale={[4, 1, 1]}
          />
        ))}
      </group>
    </group>
  )
}

const XeroScene = () => {
  const neonRef = useRef()
  const ambientRef = useRef()

  const updateNeon = useCallback((v) => {
    if (!ambientRef.current || !neonRef.current) {
      console.error('ambientRef or neonRef not found')

      return
    }

    console.log(v)

    const neonColor = v
    const ambientIntensity = lerp(
      config.ambient.minMaxIntensity[0],
      config.ambient.minMaxIntensity[1],
      v
    )

    ambientRef.current.intensity = ambientIntensity
    neonRef.current?.material?.emissive?.setRGB?.(
      neonColor,
      neonColor,
      neonColor
    )
  }, [])

  useLayoutEffect(() => {
    const neon = { value: 0 }
    const trgtValue = 0.54

    const tm = gsap
      .timeline({ delay: 2, onUpdate: () => updateNeon(neon.value) })
      .set(neon, {
        value: trgtValue
      })
      .to(neon, {
        value: 0,
        duration: 0.25,
        delay: 0.2
      })
      .set(neon, {
        value: trgtValue
      })
      .to(neon, {
        value: 0,
        duration: 0.25,
        delay: 0.2
      })
      .to(neon, {
        value: config.neon.target,
        duration: 2,
        delay: 1,
        ease: 'sine.out'
      })

    return () => tm.kill()
  }, [updateNeon])

  return (
    <>
      <ambientLight
        color="white"
        intensity={config.ambient.minMaxIntensity[0]}
        ref={ambientRef}
      />

      <CamTargetRotation
        initialCamPosition={config.camera.position}
        target={config.camera.target}
        rotationMultipliers={config.camera.rotationMultipliers}
        autoRotate
      />

      <Xero position={[-0.5, 1.25, 0.95]} ref={neonRef} />

      <Effects />

      <Environment preset="city" frames={Infinity} resolution={512}>
        <MovingSpots />
      </Environment>

      <Particles size={10} velocity={0.01} />
    </>
  )
}

XeroScene.Title = 'Xero Scene'
XeroScene.Tags = 'three,private'
XeroScene.Layout = ({ children, ...props }) => (
  <HTMLLayout {...props}>
    <AspectCanvas
      ratio={21 / 9}
      config={{
        camera: {
          position: config.camera.position,
          rotation: config.camera.rotation,
          fov: config.camera.fov,
          near: config.camera.near,
          far: config.camera.far
        }
      }}
    >
      <Perf position="bottom-right" minimal={true} />
      {children}
    </AspectCanvas>

    {/* <FullHeightWrapper>
      <AspectBox
        ratio={21 / 9}
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          pointerEvents: 'none'
        }}
      >
        <div style={{ width: 350, pointerEvents: 'none' }}>
          <DebugPanelCanvas>
            <color attach="background" args={['#000']} />
            <gridHelper />
            <axesHelper />
            <OrbitControls />
            <Sphere scale={0.05} position={config.camera.target}>
              <meshBasicMaterial color="red" />
            </Sphere>
            <Box
              scale={0.4}
              position={config.camera.position}
              rotation={config.camera.rotation}
            >
              <axesHelper />
              <meshBasicMaterial color="blue" />
            </Box>
          </DebugPanelCanvas>
        </div>
      </AspectBox>
    </FullHeightWrapper> */}
  </HTMLLayout>
)

export default XeroScene
