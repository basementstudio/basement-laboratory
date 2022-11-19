import { Box, OrbitControls, Sphere, useGLTF } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import {
  Bloom,
  EffectComposer,
  Noise,
  Vignette
} from '@react-three/postprocessing'
import { folder } from 'leva'
import { Perf } from 'r3f-perf'
import * as THREE from 'three'

import {
  AspectCanvas,
  FullHeightWrapper
} from '~/components/common/aspect-canvas'
import {
  CamTargetRotation,
  DebugPanelCanvas
} from '~/components/common/cam-target-rotation'
import { useLoader } from '~/components/common/loader'
import { Particles } from '~/components/common/particles'
import { AspectBox } from '~/components/layout/aspect-box'
import { HTMLLayout } from '~/components/layout/html-layout'
import { useMousetrap } from '~/hooks/use-mousetrap'
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
    target: new THREE.Vector3(-0.15, 2.25, 1.12)
  }
}

config.camera.rotation.copy(
  setCameraLookAtEuler(config.camera.position, config.camera.target)
)

const Xero = (props) => {
  const setLoaded = useLoader((s) => s.setLoaded)
  const { nodes, materials } = useGLTF(
    `/models/${config.modelSrc}`,
    undefined,
    undefined,
    (loader) => {
      loader.manager.onLoad = () => setLoaded()
    }
  )

  materials['Cartel.001'].toneMapped = false

  return (
    <group {...props} dispose={null}>
      <mesh
        geometry={nodes.Tube.geometry}
        material={materials.Material}
        position={[-0.88372904, 5.93715239, 2.4232769]}
      />
      <mesh
        geometry={nodes.Sing.geometry}
        material={materials['Cartel.001']}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.00999999}
      />
      <mesh
        geometry={nodes.Base.geometry}
        material={materials['SCENE.001']}
        position={[0.00050449, 0.00366921, 0.00050121]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.00999999}
      />
      {/* <mesh
        geometry={nodes.Ligth.geometry}
        material={materials['Cartel.001']}
        position={[0.03100049, 0, -0.77576327]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.00999999}
      /> */}
    </group>
  )
}

const XeroScene = () => {
  const controls = useReproducibleControls({
    Lights: folder({
      ambientColor: {
        value: '#ffffff'
      },
      ambientIntensity: {
        value: 0.36,
        min: 0,
        max: 1
      }
    }),
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
        value: 0.1,
        min: 0,
        max: 1,
        step: 0.001
      },
      luminanceSmoothing: {
        value: 1,
        min: 0,
        max: 1
      },
      luminanceThreshold: {
        value: 1,
        min: 0,
        max: 1
      }
    }),
    Noise: folder({
      noiseOpacity: {
        value: 0.2,
        min: 0,
        max: 1,
        step: 0.01
      }
    }),
    'Emmisive Material': folder({
      color: {
        value: '#ffffff'
      }
    })
  })

  const state = useThree((s) => ({
    camera: s.camera
  }))

  useMousetrap([
    {
      keys: 'o',
      callback: () => {
        console.log({ cam: state.camera })
      }
    }
  ])

  return (
    <>
      {/* <gridHelper args={[100, 100]} />
      <axesHelper /> */}

      <ambientLight
        color={controls.ambientColor}
        intensity={controls.ambientIntensity}
      />

      <CamTargetRotation
        initialCamPosition={config.camera.position}
        target={config.camera.target}
        rotationMultipliers={{ x: 1 / 30, y: 1 / 40 }}
        // autoRotate
      />

      <Xero position={[0, -3, 0]} />

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
        />

        <Vignette
          opacity={controls.opacity}
          darkness={controls.darkness}
          offset={controls.offset}
        />
      </EffectComposer>

      <Particles />
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
          fov: config.camera.fov
        }
      }}
    >
      <Perf position="bottom-right" minimal={true} />
      {children}
    </AspectCanvas>

    <FullHeightWrapper>
      <AspectBox
        ratio={21 / 9}
        style={{ display: 'flex', alignItems: 'flex-end' }}
      >
        <div style={{ width: 350 }}>
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
    </FullHeightWrapper>
  </HTMLLayout>
)

export default XeroScene
