import { Center, Environment, Float, useGLTF } from '@react-three/drei'
import { extend, useLoader } from '@react-three/fiber'
import {
  ChromaticAberration,
  EffectComposer,
  Noise
} from '@react-three/postprocessing'
import { button, folder } from 'leva'
import { gsap } from 'lib/gsap'
import { Perf } from 'r3f-perf'
import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef
} from 'react'
import * as THREE from 'three'
import create from 'zustand'

import { AspectCanvas } from '~/components/common/aspect-canvas'
import { CamTargetRotation } from '~/components/common/cam-target-rotation'
import { HTMLLayout } from '~/components/layout/html-layout'
import { useReproducibleControls } from '~/hooks/use-reproducible-controls'

extend({ ThreeAudio: THREE.Audio })

const config = {
  modelSrc: 'cassette.glb',
  modelSrcDebug: 'cassette-debug.glb',
  camera: {
    position: new THREE.Vector3(0, 0, 5),
    rotation: new THREE.Euler(0, 0, 0),
    fov: 20,
    near: 0.1,
    far: 10,
    target: new THREE.Vector3(0, 0, 0),
    rotationMultipliers: { x: 1 / 30, y: 1 / 40 }
  }
}

const Cassette = forwardRef((props, ref) => {
  const { nodes, materials } = useGLTF(
    `/models/${props.debug ? config.modelSrcDebug : config.modelSrc}`
  )

  return (
    <group {...props} dispose={null} ref={ref}>
      <mesh
        name="Engranaje_1"
        geometry={nodes.Engranaje_1.geometry}
        material={materials.Cassette_Raffy_Opaque}
        position={[0.14835949, 0.25913611, -0.00296414]}
      />
      <mesh
        name="Cinta"
        geometry={nodes.Cinta.geometry}
        material={materials.Cassette_Raffy_Opaque}
        position={[-0.03017511, 0.20274492, -0.0025356]}
      />
      <mesh
        name="Metal"
        geometry={nodes.Metal.geometry}
        material={materials.Cassette_Raffy_Opaque}
        position={[0, 0.04688736, -0.00082155]}
      />
      <mesh
        name="Box002"
        geometry={nodes.Box002.geometry}
        material={materials.Cassette_Raffy_Opaque}
        position={[0.00022698, 0.037987, -0.00116331]}
      />
      <mesh
        name="Etiquetas"
        geometry={nodes.Etiquetas.geometry}
        material={materials.Cassette_Raffy_Opaque}
        position={[0, 0.28724205, -0.00283945]}
      />
      <mesh
        name="Tornillos"
        geometry={nodes.Tornillos.geometry}
        material={materials.Cassette_Raffy_Opaque}
        position={[-0.00013302, 0.23077697, -0.02763277]}
      />
      <mesh
        name="Engranaje_2"
        geometry={nodes.Engranaje_2.geometry}
        material={materials.Cassette_Raffy_Opaque}
        position={[-0.14832553, 0.25903481, -0.00301787]}
      />
      <mesh
        name="Plastic"
        geometry={nodes.Plastic.geometry}
        material={materials.Cassette_Raffy_Alpha}
        position={[-0.00001916, 0.2008485, -0.00284882]}
      />
    </group>
  )
})

const Effects = () => {
  const controls = useReproducibleControls({
    RgbShift: folder({
      offset: {
        value: 0.002,
        min: 0,
        max: 0.01,
        step: 0.0001
      }
    }),
    Noise: folder({
      noiseOpacity: {
        value: 0.1,
        min: 0,
        max: 1,
        step: 0.01
      }
    })
  })

  return (
    <EffectComposer multisampling={4}>
      <Noise opacity={controls.noiseOpacity} />

      <ChromaticAberration offset={[controls.offset, controls.offset]} />
    </EffectComposer>
  )
}

// const filterData = (audioBuffer) => {
//   const rawData = audioBuffer.getChannelData(0) // We only need to work with one channel of data
//   const samples = 70 // Number of samples we want to have in our final data set
//   const blockSize = Math.floor(rawData.length / samples) // the number of samples in each subdivision
//   const filteredData = []
//   for (let i = 0; i < samples; i++) {
//     let blockStart = blockSize * i // the location of the first sample in the block
//     let sum = 0
//     for (let j = 0; j < blockSize; j++) {
//       sum = sum + Math.abs(rawData[blockStart + j]) // find the sum of all the samples in the block
//     }
//     filteredData.push(sum / blockSize) // divide the sum by the block size to get the average
//   }
//   return filteredData
// }

const useCursor = create((set) => {
  return {
    pointer: false,
    set
  }
})

const GrotesqueScene = () => {
  const cassetteRef = useRef(null)
  const timelineRef = useRef(null)
  const listener = useMemo(() => new THREE.AudioListener(), [])
  const sound = useMemo(() => {
    const audio = new THREE.Audio(listener)

    audio.onEnded = () => {
      handleClick()
    }

    return audio
  }, [listener, handleClick])
  const audio = useLoader(THREE.AudioLoader, '/audio/grotesque-audio.mp3')

  const handleClick = useCallback(
    (e = {}) => {
      e?.stopPropagation?.()

      if (sound?.isPlaying) {
        sound?.stop()

        timelineRef.current?.kill?.()
        timelineRef.current = null
      } else {
        sound?.play()

        const cassette = cassetteRef.current
        const targets = []

        cassette.traverse((o) => {
          if (o.isMesh && o.name.includes('Engranaje')) {
            targets.push(o.rotation)
          }
        })

        const timeline = gsap.to(targets, {
          overwrite: true,
          duration: 2,
          ease: 'none',
          repeat: -1,
          z: (idx, t) => {
            return t.z + Math.PI * 2
          }
        })

        timelineRef.current = timeline
      }
    },
    [sound]
  )

  const [controls, set] = useReproducibleControls(() => ({
    background: {
      value: '#000'
    },
    volume: {
      value: 0.25,
      min: 0,
      max: 1
    },
    'Play/Pause': button(handleClick)
  }))

  useLayoutEffect(() => {
    if (!audio || !sound) return

    sound.setBuffer(audio)
    sound.setLoop(false)
  }, [sound, audio, set])

  useEffect(() => {
    sound.setVolume(controls.volume)
  }, [sound, controls.volume])

  return (
    <>
      <color attach="background" args={[controls.background]} />

      <Environment preset="city" />

      <CamTargetRotation
        target={config.camera.target}
        initialCamPosition={config.camera.position}
        rotationMultipliers={config.camera.rotationMultipliers}
      />

      <Float>
        <Center>
          <Cassette
            onPointerEnter={() => {
              useCursor.setState({ pointer: true })
            }}
            onPointerLeave={() => {
              useCursor.setState({ pointer: false })
            }}
            onClick={handleClick}
            scale={3}
            ref={cassetteRef}
          />
        </Center>
      </Float>

      <Effects />
    </>
  )
}

GrotesqueScene.Title = 'Grotesque Scene'
GrotesqueScene.Tags = 'three,private'
GrotesqueScene.Layout = ({ children, ...props }) => {
  const pointer = useCursor((s) => s.pointer)

  return (
    <HTMLLayout {...props}>
      <AspectCanvas
        style={{ cursor: pointer ? 'pointer' : 'auto' }}
        ratio={21 / 9}
        config={{
          camera: {
            position: config.camera.position,
            fov: config.camera.fov,
            near: config.camera.near,
            far: config.camera.far
          }
        }}
      >
        <Perf position="bottom-right" minimal={true} />
        {children}
      </AspectCanvas>
    </HTMLLayout>
  )
}

export default GrotesqueScene
