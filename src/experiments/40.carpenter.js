import { CameraShake, useCursor, useGLTF } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { folder, useControls } from 'leva'
import { gsap } from 'lib/gsap'
import { Perf } from 'r3f-perf'
import { forwardRef, useEffect, useRef } from 'react'
import * as THREE from 'three'

import { AspectCanvas } from '~/components/common/aspect-canvas'
import { HTMLLayout } from '~/components/layout/html-layout'
import { useMousetrap } from '~/hooks/use-mousetrap'
import { setCameraLookAtEuler } from '~/lib/three'

const config = {
  modelSrc: 'carpenter.glb',
  camera: {
    position: new THREE.Vector3(
      13.559272726347526,
      12.497019208923444,
      -65.30903891308175
    ),
    rotation: new THREE.Euler(0, 0, 0),
    target: new THREE.Vector3(10, 10, 50),
    fov: 25,
    near: 0.01,
    far: 1000,
    rotationMultipliers: { x: 1 / 30, y: 1 / 40 }
  }
}

config.camera.rotation.copy(
  setCameraLookAtEuler(config.camera.position, config.camera.target)
)

const Model = forwardRef((props, ref) => {
  const { nodes, materials } = useGLTF(`/models/${config.modelSrc}`)
  return (
    <group {...props} dispose={null} ref={ref}>
      <group position={[20.24, 7.5, -75.11]} rotation={[0, -Math.PI / 2, 0]}>
        <group name="BUILDING_A_01" scale={0.01}>
          <mesh
            name="BUILDING_A_01_1"
            geometry={nodes.BUILDING_A_01_1.geometry}
            material={materials.BUILDING_B_01_MTL}
          />
          <mesh
            name="BUILDING_A_01_2"
            geometry={nodes.BUILDING_A_01_2.geometry}
            material={materials.BUILDING_C_01}
          />
          <mesh
            name="BUILDING_A_01_3"
            geometry={nodes.BUILDING_A_01_3.geometry}
            material={materials.BUILDING_C_01_001}
          />
          <mesh
            name="BUILDING_A_01_4"
            geometry={nodes.BUILDING_A_01_4.geometry}
            material={materials.BUILDING_D_01}
          />
          <mesh
            name="BUILDING_A_01_5"
            geometry={nodes.BUILDING_A_01_5.geometry}
            material={materials.BUILDING_E_01}
          />
          <mesh
            name="BUILDING_A_01_6"
            geometry={nodes.BUILDING_A_01_6.geometry}
            material={materials.BUILDING_F_01_mtl}
          />
          <mesh
            name="BUILDING_A_01_7"
            geometry={nodes.BUILDING_A_01_7.geometry}
            material={materials.BUILDING_G_01}
          />
          <mesh
            name="BUILDING_A_01_8"
            geometry={nodes.BUILDING_A_01_8.geometry}
            material={materials.BUILDING_I_01_MTL}
          />
          <mesh
            name="BUILDING_A_01_9"
            geometry={nodes.BUILDING_A_01_9.geometry}
            material={materials.Body}
          />
          <mesh
            name="BUILDING_A_01_10"
            geometry={nodes.BUILDING_A_01_10.geometry}
            material={materials.BuildingsTallHouse0044_mtl}
          />
          <mesh
            name="BUILDING_A_01_11"
            geometry={nodes.BUILDING_A_01_11.geometry}
            material={materials.CONCRETO}
          />
          <mesh
            name="BUILDING_A_01_12"
            geometry={nodes.BUILDING_A_01_12.geometry}
            material={materials.Material__2366}
          />
          <mesh
            name="BUILDING_A_01_13"
            geometry={nodes.BUILDING_A_01_13.geometry}
            material={materials.adskMatBUILDING_A_01}
          />
        </group>
      </group>
      <group position={[19.85, 9.05, -42.1]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh
          name="SIGN_EDGE01"
          geometry={nodes.SIGN_EDGE01.geometry}
          material={materials.Material__2885}
          scale={0.01}
        />
      </group>
      <group position={[-66.45, 0.18, -136.59]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh
          name="BLOCK_"
          geometry={nodes.BLOCK_.geometry}
          material={materials.CONCRETO}
          scale={0.01}
        />
      </group>
      <group position={[11.6, 0.18, 11.47]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh
          name="BUSH07"
          geometry={nodes.BUSH07.geometry}
          material={materials.GRASS}
          scale={0.01}
        />
      </group>
      <group position={[0.06, 0, -12.37]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh
          name="Obj_GRASS"
          geometry={nodes.Obj_GRASS.geometry}
          material={materials.GRASS}
          scale={0.01}
        />
      </group>
      <group
        position={[-2.52, 0, -37.01]}
        rotation={[-Math.PI / 2, 0, Math.PI]}
      >
        <mesh
          name="LINE_STREET"
          geometry={nodes.LINE_STREET.geometry}
          material={materials['fallback Material']}
          scale={0.01}
        />
      </group>
      <group
        position={[-25.23, 85.03, 368.57]}
        rotation={[-2.41, 0.27, 1.34]}
        scale={0.36}
      >
        <mesh
          name="SATELLITE_DISK_05"
          geometry={nodes.SATELLITE_DISK_05.geometry}
          material={materials.Black}
          scale={0.01}
        />
      </group>
      <group position={[0.03, 0, -130.51]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh
          name="STREET"
          geometry={nodes.STREET.geometry}
          material={materials.CONCRETO}
          scale={0.01}
        />
      </group>
      <group position={[9.64, 5.32, 265.14]}>
        <group name="STREET_LAMP10" scale={0.01}>
          <mesh
            name="STREET_LAMP10_1"
            geometry={nodes.STREET_LAMP10_1.geometry}
            material={materials.LIGHT_STREET}
          />
          <mesh
            name="STREET_LAMP10_2"
            geometry={nodes.STREET_LAMP10_2.geometry}
            material={materials.Material__2407_002}
          />
          <mesh
            name="STREET_LAMP10_3"
            geometry={nodes.STREET_LAMP10_3.geometry}
            material={materials.Material__2407_004}
          />
          <mesh
            name="STREET_LAMP10_4"
            geometry={nodes.STREET_LAMP10_4.geometry}
            material={materials.Material__2407_005}
          />
          <mesh
            name="STREET_LAMP10_5"
            geometry={nodes.STREET_LAMP10_5.geometry}
            material={materials.Material__2407_007}
          />
        </group>
      </group>
      <group position={[-8.91, 0, 11.04]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh
          name="TRASH02"
          geometry={nodes.TRASH02.geometry}
          material={materials.Material__2513}
          scale={0.01}
        />
      </group>
      <group position={[-11.33, 0, 55.86]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh
          name="TRASH03"
          geometry={nodes.TRASH03.geometry}
          material={materials.Material__2513}
          scale={0.01}
        />
      </group>
      <group
        position={[-16.51, 0, -3.35]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={1.27}
      >
        <group name="TREE_011" scale={0.01}>
          <mesh
            name="TREE_011_1"
            geometry={nodes.TREE_011_1.geometry}
            material={materials.Material__2707}
          />
          <mesh
            name="TREE_011_2"
            geometry={nodes.TREE_011_2.geometry}
            material={materials.Material__2708}
          />
        </group>
      </group>
      <group
        position={[-12.18, 0, 30.56]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={1.27}
      >
        <group name="TREE_012" scale={0.01}>
          <mesh
            name="TREE_012_1"
            geometry={nodes.TREE_012_1.geometry}
            material={materials.Material__2707}
          />
          <mesh
            name="TREE_012_2"
            geometry={nodes.TREE_012_2.geometry}
            material={materials.Material__2708}
          />
        </group>
      </group>
      <group
        position={[11.49, 0, 28.55]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={1.27}
      >
        <group name="TREE_013" scale={0.01}>
          <mesh
            name="TREE_013_1"
            geometry={nodes.TREE_013_1.geometry}
            material={materials.Material__2707}
          />
          <mesh
            name="TREE_013_2"
            geometry={nodes.TREE_013_2.geometry}
            material={materials.Material__2708}
          />
        </group>
      </group>
      <group
        position={[13.15, 0, 51.26]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={1.27}
      >
        <group name="TREE_014" scale={0.01}>
          <mesh
            name="TREE_014_1"
            geometry={nodes.TREE_014_1.geometry}
            material={materials.Material__2707}
          />
          <mesh
            name="TREE_014_2"
            geometry={nodes.TREE_014_2.geometry}
            material={materials.Material__2708}
          />
        </group>
      </group>
      <group
        position={[-17.51, 0, 50.32]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={1.27}
      >
        <group name="TREE_015" scale={0.01}>
          <mesh
            name="TREE_015_1"
            geometry={nodes.TREE_015_1.geometry}
            material={materials.Material__2707}
          />
          <mesh
            name="TREE_015_2"
            geometry={nodes.TREE_015_2.geometry}
            material={materials.Material__2708}
          />
        </group>
      </group>
      <group
        position={[-12.59, 0, 150.95]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={1.27}
      >
        <group name="TREE_016" scale={0.01}>
          <mesh
            name="TREE_016_1"
            geometry={nodes.TREE_016_1.geometry}
            material={materials.Material__2707}
          />
          <mesh
            name="TREE_016_2"
            geometry={nodes.TREE_016_2.geometry}
            material={materials.Material__2708}
          />
        </group>
      </group>
      <group
        position={[-28.59, 65.12, 333.59]}
        rotation={[-1.27, 0.83, -0.39]}
        scale={0.36}
      >
        <mesh
          name="SATELLITE_DISK_006"
          geometry={nodes.SATELLITE_DISK_006.geometry}
          material={materials.Black}
          scale={0.01}
        />
      </group>
      <group
        position={[33.81, 45.85, 50.31]}
        rotation={[-0.77, -0.39, -1.93]}
        scale={0.19}
      >
        <mesh
          name="SATELLITE_DISK_008"
          geometry={nodes.SATELLITE_DISK_008.geometry}
          material={materials.Black}
          scale={0.01}
        />
      </group>

      {/* CARS */}
      <group
        name="CAR_SUB008"
        userData={{ direction: 1 }}
        position={[-4.55, 0, 27.98]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={163.47}
      >
        <group scale={0.01}>
          <mesh
            geometry={nodes.CAR_SUB008_1.geometry}
            material={materials.Black}
          />
          <mesh
            geometry={nodes.CAR_SUB008_2.geometry}
            material={materials.Body}
          />
          <mesh
            geometry={nodes.CAR_SUB008_3.geometry}
            material={materials.Bumpers}
          />
          <mesh
            geometry={nodes.CAR_SUB008_4.geometry}
            material={materials.GLASS_CAR}
          />
          <mesh
            geometry={nodes.CAR_SUB008_5.geometry}
            material={materials.Material__2706_Slot__9_006}
          />
          <mesh
            geometry={nodes.CAR_SUB008_6.geometry}
            material={materials.Silver}
          />
          <mesh
            geometry={nodes.CAR_SUB008_7.geometry}
            material={materials.Underside}
          />
          <mesh
            geometry={nodes.CAR_SUB008_8.geometry}
            material={materials.Wheel}
          />
        </group>
      </group>
      <group
        name="CAR_SUB013"
        userData={{ direction: 1 }}
        position={[-5.08, 0, 119.74]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={163.47}
      >
        <group scale={0.01}>
          <mesh
            geometry={nodes.CAR_SUB013_1.geometry}
            material={materials.Black}
          />
          <mesh
            geometry={nodes.CAR_SUB013_2.geometry}
            material={materials.Body}
          />
          <mesh
            geometry={nodes.CAR_SUB013_3.geometry}
            material={materials.Material__2706_Slot__9_006}
          />
        </group>
      </group>
      <group
        name="CAR_SUB015"
        userData={{ direction: 1 }}
        position={[-4.14, 0, 323.44]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={163.47}
      >
        <group scale={0.01}>
          <mesh
            geometry={nodes.CAR_SUB015_1.geometry}
            material={materials.Black}
          />
          <mesh
            geometry={nodes.CAR_SUB015_2.geometry}
            material={materials.Body}
          />
          <mesh
            geometry={nodes.CAR_SUB015_3.geometry}
            material={materials.Material__2706_Slot__9_006}
          />
        </group>
      </group>
      <group
        name="CAR_SUB017"
        userData={{ direction: 1 }}
        position={[-0.76, 0, 65.92]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={163.47}
      >
        <group scale={0.01}>
          <mesh
            geometry={nodes.CAR_SUB017_1.geometry}
            material={materials.Black}
          />
          <mesh
            geometry={nodes.CAR_SUB017_2.geometry}
            material={materials.Body}
          />
          <mesh
            geometry={nodes.CAR_SUB017_3.geometry}
            material={materials.Material__2706_Slot__9_006}
          />
        </group>
      </group>
      <group
        name="CAR_02"
        userData={{ direction: -1 }}
        position={[6.51, 1.7, 72.6]}
        rotation={[-Math.PI / 2, 0, -Math.PI]}
        scale={[128.5, 248.78, 100]}
      >
        <group scale={0.01}>
          <mesh
            geometry={nodes.CAR_02_1.geometry}
            material={materials.Material_001}
          />
          <mesh
            geometry={nodes.CAR_02_2.geometry}
            material={materials.Material_001__Van_Car_Retro_Wheel_H}
          />
          <mesh
            geometry={nodes.CAR_02_3.geometry}
            material={materials.Material_004__Wheels0073_2_preview_}
          />
          <mesh
            geometry={nodes.CAR_02_4.geometry}
            material={materials.Material__2015_jpg}
          />
        </group>
      </group>
      <group
        name="CAR_SUB006"
        userData={{ direction: -1 }}
        position={[4.06, 0, 2.52]}
        rotation={[-Math.PI / 2, 0, -Math.PI]}
        scale={163.47}
      >
        <group scale={0.01}>
          <mesh
            geometry={nodes.CAR_SUB006_1.geometry}
            material={materials.Black}
          />
          <mesh
            geometry={nodes.CAR_SUB006_2.geometry}
            material={materials.Body}
          />
          <mesh
            geometry={nodes.CAR_SUB006_3.geometry}
            material={materials.Bumpers}
          />
          <mesh
            geometry={nodes.CAR_SUB006_4.geometry}
            material={materials.GLASS_CAR}
          />
          <mesh
            geometry={nodes.CAR_SUB006_5.geometry}
            material={materials.Material__2706_Slot__9_006}
          />
          <mesh
            geometry={nodes.CAR_SUB006_6.geometry}
            material={materials.Silver}
          />
          <mesh
            geometry={nodes.CAR_SUB006_7.geometry}
            material={materials.Underside}
          />
          <mesh
            geometry={nodes.CAR_SUB006_8.geometry}
            material={materials.Wheel}
          />
        </group>
      </group>

      {/* ADS */}
      <group
        position={[-23.05, 17.25, 57.98]}
        rotation={[Math.PI, 0.68, -Math.PI]}
        scale={1.43}
      >
        <mesh
          name="AD_01"
          geometry={nodes.Plane001_Elements6.geometry}
          material={materials.Material__2886}
          scale={0.01}
        />
      </group>
      <group position={[5.36, 0, -45.99]} rotation={[-Math.PI / 2, 0, Math.PI]}>
        <mesh
          name="AD_02"
          geometry={nodes.Plane001_Elements5.geometry}
          material={materials.Material__2886}
          scale={0.01}
        />
      </group>
      <group position={[5.36, 0, -45.99]} rotation={[-Math.PI / 2, 0, Math.PI]}>
        <mesh
          name="AD_03"
          geometry={nodes.Plane001_Elements4.geometry}
          material={materials.Material__2886}
          scale={0.01}
        />
      </group>
      <group
        position={[-38.82, 73.43, 183.49]}
        rotation={[Math.PI, 0, -Math.PI]}
        scale={3.29}
      >
        <mesh
          name="AD_04"
          geometry={nodes.Plane001_Elements3.geometry}
          material={materials.Material__2886}
          scale={0.01}
        />
      </group>
      <group position={[5.36, 0, -45.99]} rotation={[-Math.PI / 2, 0, Math.PI]}>
        <mesh
          name="AD_05"
          geometry={nodes.Plane001_Elements2.geometry}
          material={materials.Material__2886}
          scale={0.01}
        />
      </group>
      <group position={[14.66, 4.94, -42.26]} rotation={[Math.PI, 0, -Math.PI]}>
        <mesh
          name="AD_06"
          geometry={nodes.Plane001_Elements1.geometry}
          material={materials.Material__2886}
          scale={0.01}
        />
      </group>
      <group
        position={[-16.99, 16.44, 115.03]}
        rotation={[Math.PI, 0.68, -Math.PI]}
        scale={1.91}
      >
        <mesh
          name="AD_07"
          geometry={nodes.Object002.geometry}
          material={materials.Material__2886}
          scale={0.01}
        />
      </group>
      <group
        position={[-17.01, 14.64, 56.71]}
        rotation={[Math.PI, 0.92, -Math.PI]}
        scale={2.17}
      >
        <mesh
          name="AD_08"
          geometry={nodes.Plane001_Elements007.geometry}
          material={materials.Material__2886}
          scale={0.01}
        />
      </group>
      <group
        position={[-30.1, 49.31, 187.76]}
        rotation={[-Math.PI, 0, Math.PI / 2]}
        scale={2.92}
      >
        <mesh
          name="AD_09"
          geometry={nodes.Plane001_Elements008.geometry}
          material={materials.Material__2886}
          scale={0.01}
        />
      </group>
      <group
        position={[-37.76, 77.36, 187.76]}
        rotation={[Math.PI, 0, -Math.PI]}
        scale={2.63}
      >
        <mesh
          name="AD_10"
          geometry={nodes.Plane001_Elements009.geometry}
          material={materials.Material__2886}
          scale={0.01}
        />
      </group>
      <group
        position={[-3.61, 31.85, 223.01]}
        rotation={[-Math.PI, 0, Math.PI / 2]}
        scale={3.9}
      >
        <mesh
          name="AD_11"
          geometry={nodes.Plane001_Elements010.geometry}
          material={materials.Material__2886}
          scale={0.01}
        />
      </group>
      <group
        position={[-16.94, 36.91, 230.24]}
        rotation={[Math.PI, 0, Math.PI]}
        scale={2.03}
      >
        <mesh
          name="AD_12"
          geometry={nodes.Plane001_Elements011.geometry}
          material={materials.Material__2886}
          scale={0.01}
        />
      </group>
    </group>
  )
})

const animateCars = (targets = []) => {
  const initialPositions = targets.map((t) => t.position.z)

  const tickerCb = (et) => {
    targets.forEach((t, idx) => {
      const Z_OFFSET = -50
      const RW = 550
      const IP = initialPositions[idx]
      const SPEED = 1

      const res = (IP + et * 100 * SPEED) % RW

      if (t.userData.direction === 1) {
        t.position.z = Z_OFFSET + res
      } else {
        t.position.z = Z_OFFSET + RW - res
      }
    })
  }

  gsap.ticker.add(tickerCb)

  return () => {
    gsap.ticker.remove(tickerCb)
  }
}

const animateAds = (targets = []) => {
  const mapOffsetTargets = targets.map((t) => t.material.map.offset)

  const tween = gsap.fromTo(
    mapOffsetTargets,
    {
      x: 0
    },
    {
      x: (idx) => {
        return 1 / (targets[idx].userData?.frames || 1)
      },
      duration: 1,
      repeatDelay: 6,
      delay: 3,
      repeat: -1
    }
  )

  return () => {
    tween.kill()
  }
}

const CarpenterScene = () => {
  const modelRef = useRef()

  const camera = useThree((s) => s.camera)
  const controls = useControls({
    light: folder({
      ambientLightColor: {
        value: '#ffffff'
      },
      ambientLightIntensity: {
        value: 0.5,
        min: 0,
        max: 1,
        step: 0.01
      }
    })
  })

  useMousetrap([
    {
      keys: 'o',
      callback: () => {
        console.log(camera)
      }
    }
  ])

  useEffect(() => {
    const carTargets = []
    const adTargets = []

    modelRef.current.traverse((o) => {
      if (o.isGroup && o.name.includes('CAR_')) {
        carTargets.push(o)
      }

      if (o.isMesh && o.name.includes('AD_')) {
        adTargets.push(o)
      }
    })

    const cleanCarAnimations = animateCars(carTargets)
    const cleanAdAnimations = animateAds(adTargets)

    return () => {
      cleanCarAnimations()
      cleanAdAnimations()
    }
  }, [])

  return (
    <>
      {/* Animation */}
      <CameraShake intensity={0.4} />

      {/* Helpers */}
      {/* <gridHelper args={[100, 100]} /> */}
      {/* <OrbitControls /> */}

      {/* Ambient */}
      <ambientLight
        intensity={controls.ambientLightIntensity}
        color={controls.ambientLightColor}
      />
      <color attach="background" args={['#F89001']} />
      <fog attach="fog" args={['#F89001', 200, 650]} />

      <Model ref={modelRef} />
    </>
  )
}

CarpenterScene.Title = 'Carpenter'
CarpenterScene.Tags = 'private'
CarpenterScene.Layout = ({ children, ...props }) => {
  const pointer = useCursor((s) => s.pointer)

  return (
    <HTMLLayout {...props}>
      <AspectCanvas
        style={{ cursor: pointer ? 'pointer' : 'auto' }}
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
    </HTMLLayout>
  )
}

export default CarpenterScene
