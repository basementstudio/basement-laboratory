import { PerspectiveCamera, useGLTF, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { folder, useControls } from 'leva'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'

import { R3FCanvasLayout } from '~/components/layout/r3f-canvas-layout'

type GLTFResult = GLTF & {
  nodes: {
    Plane: THREE.Mesh
  }
  materials: Record<any, any>
}

const TextureFilteringMap = {
  NearestFilter: THREE.NearestFilter,
  NearestMipmapNearestFilter: THREE.NearestMipmapNearestFilter,
  NearestMipmapLinearFilter: THREE.NearestMipmapLinearFilter,
  LinearFilter: THREE.LinearFilter,
  LinearMipmapNearestFilter: THREE.LinearMipmapNearestFilter,
  LinearMipmapLinearFilter: THREE.LinearMipmapLinearFilter
}

const HarveyHero = () => {
  const modelRef = useRef<THREE.Mesh>()
  const { nodes } = useGLTF(
    '/models/71.plane-shapekeys-low.glb'
  ) as unknown as GLTFResult

  const config = useControls('Options', {
    camera: folder({
      cameraPositionX: {
        value: 0,
        min: -20,
        max: 20,
        step: 0.1
      },
      cameraPositionY: {
        value: 0,
        min: -20,
        max: 20,
        step: 0.1
      },
      cameraPositionZ: {
        value: 0.3,
        min: -20,
        max: 20,
        step: 0.1
      },
      near: {
        value: 0.1,
        min: 0,
        max: 10,
        step: 0.1
      },
      far: {
        value: 10,
        min: 0,
        max: 100,
        step: 0.1
      }
    }),
    texture: folder({
      textureRepeat: {
        value: 190,
        min: 0,
        max: 1024,
        step: 2
      },
      textureAnisotropy: {
        value: 16,
        min: 0,
        max: 16,
        step: 1
      },
      textureMinFilter: {
        value: 'LinearMipmapLinearFilter',
        options: [
          'NearestFilter',
          'NearestMipmapNearestFilter',
          'NearestMipmapLinearFilter',
          'LinearFilter',
          'LinearMipmapNearestFilter',
          'LinearMipmapLinearFilter'
        ]
      },
      textureMagFilter: {
        value: 'LinearFilter',
        options: ['NearestFilter', 'LinearFilter']
      },
      textureOffsetX: {
        value: 0.5,
        min: 0,
        max: 5,
        step: 0.001
      },
      textureOffsetY: {
        value: 0.5,
        min: 0,
        max: 5,
        step: 0.01
      }
    }),
    material: folder({
      materialColor: {
        value: '#ffffff'
      },
      materialEmissive: {
        value: '#0d33f2'
      },
      materialWireframe: {
        value: false
      }
    }),
    ambientLight: folder({
      ambientLightInstensity: {
        value: 3,
        min: 0,
        max: 10,
        step: 0.1
      },
      ambientLightColor: {
        value: '#ffffff'
      }
    }),
    morphInfluenceSinFrequency: {
      value: 0.25,
      min: 0,
      max: 5,
      step: 0.01
    }
  })

  const texture = useTexture('/textures/71.512-low.png')

  useEffect(() => {
    const t = texture as THREE.Texture
    t.repeat = new THREE.Vector2(config.textureRepeat, config.textureRepeat)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.anisotropy = config.textureAnisotropy
    t.minFilter =
      TextureFilteringMap[
        config.textureMinFilter as keyof typeof TextureFilteringMap
      ]
    // @ts-ignore
    t.magFilter =
      TextureFilteringMap[
        config.textureMagFilter as keyof typeof TextureFilteringMap
      ]
    texture.needsUpdate = true
  }, [
    config.textureAnisotropy,
    config.textureMagFilter,
    config.textureMinFilter,
    config.textureRepeat,
    texture
  ])

  useFrame((state) => {
    if (modelRef.current) {
      if (!config.materialWireframe) {
        // @ts-ignore
        modelRef.current.material.map.offset.x -= config.textureOffsetX * 0.01
        // @ts-ignore
        modelRef.current.material.map.offset.y += config.textureOffsetY * 0.01
      }

      const time = state.clock.getElapsedTime()
      const frequency = config.morphInfluenceSinFrequency * 0.1
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      modelRef.current.morphTargetInfluences![0] =
        0.5 * (1 + Math.sin(2 * Math.PI * frequency * time))
    }
  })

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={[
          config.cameraPositionX,
          config.cameraPositionY,
          config.cameraPositionZ
        ]}
        near={config.near}
        far={config.far}
      />

      <ambientLight
        intensity={config.ambientLightInstensity}
        color={config.ambientLightColor}
      />

      <group dispose={null}>
        <mesh
          ref={modelRef}
          rotation={[0, -Math.PI / 1.6, 0]}
          name="Plane"
          castShadow
          receiveShadow
          geometry={nodes.Plane.geometry}
          material={nodes.Plane.material}
          morphTargetDictionary={nodes.Plane.morphTargetDictionary}
          morphTargetInfluences={nodes.Plane.morphTargetInfluences}
        >
          <meshStandardMaterial
            map={texture}
            color={config.materialColor}
            emissive={config.materialEmissive}
            wireframe={config.materialWireframe}
          />
        </mesh>
      </group>
    </>
  )
}

HarveyHero.Title = 'Abstract geometric waves in motion'
HarveyHero.Description = <></>
HarveyHero.Layout = (props: any) => {
  const config = useControls('Options', {
    removeVignnette: {
      value: false
    }
  })

  return (
    <>
      <div
        style={{
          backgroundColor: '#F9FAFB',
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh'
        }}
      >
        {!config.removeVignnette && (
          <div
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(255,255,255,0) 0%,rgba(255,255,255,1) 70%,rgba(255,255,255,1) 100%)',
              position: 'absolute',
              inset: 0,
              zIndex: 10
            }}
          />
        )}
        <R3FCanvasLayout
          gl={{
            antialias: false,
            autoClear: false,
            alpha: false,
            powerPreference: 'high-performance',
            outputColorSpace: THREE.SRGBColorSpace,
            toneMapping: THREE.NoToneMapping
          }}
          {...props}
        />
      </div>
    </>
  )
}
HarveyHero.Tags = 'private'

export default HarveyHero
