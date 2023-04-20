import { CameraShake, SpotLight, useGLTF } from '@react-three/drei'
import { applyProps } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { folder, useControls } from 'leva'
import { gsap } from 'lib/gsap'
import { range } from 'lodash'
import { Perf } from 'r3f-perf'
import { forwardRef, memo, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

import { AspectCanvas } from '~/components/common/aspect-canvas'
import { HTMLLayout } from '~/components/layout/html-layout'
import { useUniforms } from '~/hooks/use-uniforms'
import { getCameraLookAtEuler } from '~/lib/three'

const config = {
  modelSrc: 'carpenter.glb',
  camera: {
    position: new THREE.Vector3(13, 8.6, -80),
    rotation: new THREE.Euler(0, 0, 0),
    target: new THREE.Vector3(6, 22, 50),
    fov: 18,
    near: 1,
    far: 1000,
    rotationMultipliers: { x: 1 / 30, y: 1 / 40 }
  }
}

config.camera.rotation.copy(
  getCameraLookAtEuler(config.camera.position, config.camera.target)
)

const Model = memo(
  forwardRef((props, ref) => {
    const { nodes, materials } = useGLTF(`/models/${config.modelSrc}`)

    const adMaterials = useMemo(
      () =>
        range(9).map(() => {
          const clone = materials.Material__3097.clone()

          clone.map = materials.Material__3097.map.clone()

          clone.map.wrapS = THREE.RepeatWrapping
          clone.map.wrapT = THREE.RepeatWrapping

          return clone
        }),
      [materials.Material__3097]
    )

    useEffect(() => {
      applyProps(materials.Material__2886, {
        color: '#fff',
        toneMapped: false,
        emissive: '#fff',
        emissiveIntensity: 0.4
      })
    }, [materials.Material__2886, materials.Material__3097])

    return (
      <group {...props} dispose={null} ref={ref}>
        <group
          position={[20.24290527, 7.5, -75.11006836]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          <group name="BUILDING_A_01" scale={0.01}>
            <mesh
              name="BUILDING_A_01_1"
              geometry={nodes.BUILDING_A_01_1.geometry}
              material={materials.BUILDING_B_01_MTL}
            />
            <mesh
              name="BUILDING_A_01_2"
              geometry={nodes.BUILDING_A_01_2.geometry}
              material={materials.BUILDING_C_01_001}
            />
            <mesh
              name="BUILDING_A_01_3"
              geometry={nodes.BUILDING_A_01_3.geometry}
              material={materials.BUILDING_D_01}
            />
            <mesh
              name="BUILDING_A_01_4"
              geometry={nodes.BUILDING_A_01_4.geometry}
              material={materials.BUILDING_E_01}
            />
            <mesh
              name="BUILDING_A_01_5"
              geometry={nodes.BUILDING_A_01_5.geometry}
              material={materials.BUILDING_F_01_mtl}
            />
            <mesh
              name="BUILDING_A_01_6"
              geometry={nodes.BUILDING_A_01_6.geometry}
              material={materials.BUILDING_G_01}
            />
            <mesh
              name="BUILDING_A_01_7"
              geometry={nodes.BUILDING_A_01_7.geometry}
              material={materials.BUILDING_I_01_MTL}
            />
            <mesh
              name="BUILDING_A_01_8"
              geometry={nodes.BUILDING_A_01_8.geometry}
              material={materials.Body}
            />
            <mesh
              name="BUILDING_A_01_9"
              geometry={nodes.BUILDING_A_01_9.geometry}
              material={materials.BuildingsTallHouse0044_mtl}
            />
            <mesh
              name="BUILDING_A_01_10"
              geometry={nodes.BUILDING_A_01_10.geometry}
              material={materials.Material__2366}
            />
            <mesh
              name="BUILDING_A_01_11"
              geometry={nodes.BUILDING_A_01_11.geometry}
              material={materials.Material__3100}
            />
            <mesh
              name="BUILDING_A_01_12"
              geometry={nodes.BUILDING_A_01_12.geometry}
              material={materials.Material__3101}
            />
            <mesh
              name="BUILDING_A_01_13"
              geometry={nodes.BUILDING_A_01_13.geometry}
              material={materials.adskMatBUILDING_A_01}
            />
          </group>
        </group>
        <group
          position={[19.85488281, 9.04644958, -42.1044043]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          <mesh
            name="SIGN_EDGE01"
            geometry={nodes.SIGN_EDGE01.geometry}
            material={materials.Material__3116}
            scale={0.01}
          />
        </group>
        <group
          userData={{ direction: -1 }}
          name="CAR_02"
          position={[6.50623718, 1.69752884, 72.60331055]}
          rotation={[-Math.PI / 2, 0, -Math.PI]}
          scale={[128.49850464, 248.77505493, 100]}
        >
          <group scale={0.01}>
            <mesh
              name="CAR_02_1"
              geometry={nodes.CAR_02_1.geometry}
              material={materials.Material_001}
            />
            <mesh
              name="CAR_02_2"
              geometry={nodes.CAR_02_2.geometry}
              material={materials.Material_001__Van_Car_Retro_Wheel_H}
            />
            <mesh
              name="CAR_02_3"
              geometry={nodes.CAR_02_3.geometry}
              material={materials.Material_004__Wheels0073_2_preview_}
            />
            <mesh
              name="CAR_02_4"
              geometry={nodes.CAR_02_4.geometry}
              material={materials.Material__2015_jpg}
            />
          </group>
        </group>
        <group
          userData={{ direction: -1 }}
          name="CAR_SUB006"
          position={[4.06061371, 0.00092232, 2.52067139]}
          rotation={[-Math.PI / 2, 0, -Math.PI]}
          scale={163.47395325}
        >
          <group scale={0.01}>
            <mesh
              name="CAR_SUB006_1"
              geometry={nodes.CAR_SUB006_1.geometry}
              material={materials.Black}
            />
            <mesh
              name="CAR_SUB006_2"
              geometry={nodes.CAR_SUB006_2.geometry}
              material={materials.Body}
            />
            <mesh
              name="CAR_SUB006_3"
              geometry={nodes.CAR_SUB006_3.geometry}
              material={materials.Bumpers}
            />
            <mesh
              name="CAR_SUB006_4"
              geometry={nodes.CAR_SUB006_4.geometry}
              material={materials.GLASS_CAR}
            />
            <mesh
              name="CAR_SUB006_5"
              geometry={nodes.CAR_SUB006_5.geometry}
              material={materials.Material__2706_Slot__9_006}
            />
            <mesh
              name="CAR_SUB006_6"
              geometry={nodes.CAR_SUB006_6.geometry}
              material={materials.Silver}
            />
            <mesh
              name="CAR_SUB006_7"
              geometry={nodes.CAR_SUB006_7.geometry}
              material={materials.Underside}
            />
            <mesh
              name="CAR_SUB006_8"
              geometry={nodes.CAR_SUB006_8.geometry}
              material={materials.Wheel}
            />
          </group>
        </group>
        <group
          position={[-66.44602539, 0.17994535, -136.67897461]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <mesh
            name="BLOCK_"
            geometry={nodes.BLOCK_.geometry}
            material={materials.CONCRETO}
            scale={0.01}
          />
        </group>
        <group
          position={[11.59700439, 0.17999908, 11.47289795]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <mesh
            name="BUSH07"
            geometry={nodes.BUSH07.geometry}
            material={materials.GRASS}
            scale={0.01}
          />
        </group>
        <group
          position={[-25.2319043, 85.03470703, 368.57351563]}
          rotation={[-2.41268616, 0.26509684, 1.34097468]}
          scale={[0.35757797, 0.35757798, 0.357578]}
        >
          <mesh
            name="SATELLITE_DISK_05"
            geometry={nodes.SATELLITE_DISK_05.geometry}
            material={materials.Black}
            scale={0.01}
          />
        </group>
        <group position={[9.6367627, 5.31692017, 265.14117187]}>
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
        <group
          position={[-9.37879395, 0, 11.03919312]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <mesh
            name="TRASH02"
            geometry={nodes.TRASH02.geometry}
            material={materials.Material__2513}
            scale={0.01}
          />
        </group>
        <group
          position={[-11.33277222, 0, 55.86419922]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <mesh
            name="TRASH03"
            geometry={nodes.TRASH03.geometry}
            material={materials.Material__2513}
            scale={0.01}
          />
        </group>
        <group
          position={[-16.51373535, 0, -3.35139343]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={1.27090001}
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
          position={[-12.18497803, 0, 30.55618652]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={1.27090001}
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
          position={[11.49327637, 0, 28.55454346]}
          rotation={[-Math.PI / 2, 0, 0]}
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
          position={[13.14914551, 0, 51.25870117]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={1.27090001}
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
          position={[-17.51170288, 0, 50.3191748]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={1.27090001}
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
          position={[-12.58848877, 0, 150.94780273]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={1.27090001}
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
          userData={{ direction: 1 }}
          name="CAR_SUB008"
          position={[-4.55164459, 0.00092232, 27.97769043]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={163.47395325}
        >
          <group scale={0.01}>
            <mesh
              name="CAR_SUB008_1"
              geometry={nodes.CAR_SUB008_1.geometry}
              material={materials.Black}
            />
            <mesh
              name="CAR_SUB008_2"
              geometry={nodes.CAR_SUB008_2.geometry}
              material={materials.Body}
            />
            <mesh
              name="CAR_SUB008_3"
              geometry={nodes.CAR_SUB008_3.geometry}
              material={materials.Bumpers}
            />
            <mesh
              name="CAR_SUB008_4"
              geometry={nodes.CAR_SUB008_4.geometry}
              material={materials.GLASS_CAR}
            />
            <mesh
              name="CAR_SUB008_5"
              geometry={nodes.CAR_SUB008_5.geometry}
              material={materials.Material__2706_Slot__9_006}
            />
            <mesh
              name="CAR_SUB008_6"
              geometry={nodes.CAR_SUB008_6.geometry}
              material={materials.Silver}
            />
            <mesh
              name="CAR_SUB008_7"
              geometry={nodes.CAR_SUB008_7.geometry}
              material={materials.Underside}
            />
            <mesh
              name="CAR_SUB008_8"
              geometry={nodes.CAR_SUB008_8.geometry}
              material={materials.Wheel}
            />
          </group>
        </group>
        <group
          position={[-28.58730225, 65.11919434, 333.59164063]}
          rotation={[-1.27160608, 0.83298468, -0.39495217]}
          scale={[0.35757797, 0.35757801, 0.357578]}
        >
          <mesh
            name="SATELLITE_DISK_006"
            geometry={nodes.SATELLITE_DISK_006.geometry}
            material={materials.Black}
            scale={0.01}
          />
        </group>
        <group
          position={[33.80893311, 45.84895508, 50.30607422]}
          rotation={[-0.76960796, -0.39306615, -1.92615527]}
          scale={[0.19313901, 0.19313899, 0.19313899]}
        >
          <mesh
            name="SATELLITE_DISK_008"
            geometry={nodes.SATELLITE_DISK_008.geometry}
            material={materials.Black}
            scale={0.01}
          />
        </group>
        <group
          position={[-23.04500244, 17.2481958, 57.9818457]}
          rotation={[Math.PI, 0.68231664, -Math.PI]}
          scale={[1.42569998, 1.42569995, 1.42569998]}
        >
          <mesh
            name="Plane001_Elements6"
            geometry={nodes.Plane001_Elements6.geometry}
            material={materials.Material__2886}
            scale={0.01}
          />
        </group>
        <group
          position={[-38.81943604, 73.42518555, 183.56888672]}
          rotation={[Math.PI, 9e-8, -Math.PI]}
          scale={3.29299664}
        >
          <mesh
            name="Plane001_Elements3"
            geometry={nodes.Plane001_Elements3.geometry}
            material={materials.Material__2886}
            scale={0.01}
          />
        </group>
        <group
          position={[14.662229, 4.93821411, -42.26151855]}
          rotation={[Math.PI, 9e-8, -Math.PI]}
        >
          <mesh
            name="Plane001_Elements1"
            geometry={nodes.Plane001_Elements1.geometry}
            material={materials.Material__2886}
            scale={0.01}
          />
        </group>
        <group
          position={[-16.99103516, 16.4409082, 115.02702148]}
          rotation={[Math.PI, 0.68231665, -Math.PI]}
          scale={[1.90945, 1.90945005, 1.90945]}
        >
          <mesh
            name="Object002"
            geometry={nodes.Object002.geometry}
            material={materials.Material__2886}
            scale={0.01}
          />
        </group>
        <group
          position={[-17.00810303, 14.64256348, 56.70825195]}
          rotation={[Math.PI, 0.91503315, -Math.PI]}
          scale={[2.16962953, 2.16962957, 2.16962953]}
        >
          <mesh
            name="Plane001_Elements007"
            geometry={nodes.Plane001_Elements007.geometry}
            material={materials.Material__2886}
            scale={0.01}
          />
        </group>
        <group
          position={[-29.98067627, 49.30876953, 187.76476562]}
          rotation={[-Math.PI, 8.5e-7, Math.PI / 2]}
          scale={2.91564989}
        >
          <mesh
            name="Plane001_Elements008"
            geometry={nodes.Plane001_Elements008.geometry}
            material={materials.Material__2886}
            scale={0.01}
          />
        </group>
        <group
          position={[-37.75820313, 77.3627832, 187.76480469]}
          rotation={[Math.PI, 9e-8, -Math.PI]}
          scale={2.63498783}
        >
          <mesh
            name="Plane001_Elements009"
            geometry={nodes.Plane001_Elements009.geometry}
            material={materials.Material__2886}
            scale={0.01}
          />
        </group>
        <group
          position={[-3.61268921, 31.84890137, 223.01242188]}
          rotation={[-Math.PI, 1.3e-7, Math.PI / 2]}
          scale={3.90494275}
        >
          <mesh
            name="Plane001_Elements010"
            geometry={nodes.Plane001_Elements010.geometry}
            material={materials.Material__2886}
            scale={0.01}
          />
        </group>
        <group
          position={[-16.94065552, 36.90569336, 230.240625]}
          rotation={[Math.PI, 9e-8, Math.PI]}
          scale={2.03309631}
        >
          <mesh
            name="Plane001_Elements011"
            geometry={nodes.Plane001_Elements011.geometry}
            material={materials.Material__2886}
            scale={0.01}
          />
        </group>

        <group
          position={[-29.98067627, 49.30876953, 187.34767578]}
          rotation={[-Math.PI, 8.5e-7, Math.PI / 2]}
          scale={2.91564989}
        >
          <mesh
            name="AD_Plane001_Elements012"
            geometry={nodes.AD_Plane001_Elements012.geometry}
            material={adMaterials[0]}
            scale={0.01}
          />
        </group>
        <group
          position={[-37.75820313, 77.3627832, 187.48494141]}
          rotation={[Math.PI, 9e-8, -Math.PI]}
          scale={2.63498783}
        >
          <mesh
            name="AD_Plane001_Elements013"
            geometry={nodes.AD_Plane001_Elements013.geometry}
            material={adMaterials[1]}
            scale={0.01}
          />
        </group>
        <group
          position={[-3.61268921, 31.84890137, 222.85240234]}
          rotation={[-Math.PI, 1.3e-7, Math.PI / 2]}
          scale={3.90494275}
        >
          <mesh
            name="AD_Plane001_Elements014"
            geometry={nodes.AD_Plane001_Elements014.geometry}
            material={adMaterials[2]}
            scale={0.01}
          />
        </group>
        <group
          position={[-16.94065552, 36.90569336, 230.04699219]}
          rotation={[Math.PI, 9e-8, Math.PI]}
          scale={2.03309631}
        >
          <mesh
            name="AD_Plane001_Elements015"
            geometry={nodes.AD_Plane001_Elements015.geometry}
            material={adMaterials[3]}
            // userData={{ frames: 2 }}
            scale={0.01}
          />
        </group>
        <group
          position={[14.662229, 4.93821411, -42.29197754]}
          rotation={[Math.PI, 9e-8, -Math.PI]}
        >
          <mesh
            name="AD_Plane001_Elements016"
            geometry={nodes.AD_Plane001_Elements016.geometry}
            material={adMaterials[4]}
            scale={0.01}
          />
        </group>
        <group
          position={[-38.81943604, 73.42518555, 183.35136719]}
          rotation={[Math.PI, 9e-8, -Math.PI]}
          scale={3.29299664}
        >
          <mesh
            name="AD_Plane001_Elements017"
            geometry={nodes.AD_Plane001_Elements017.geometry}
            material={adMaterials[5]}
            scale={0.01}
          />
        </group>
        <group
          position={[-16.89804199, 16.4409082, 114.98830078]}
          rotation={[Math.PI, 0.68231665, -Math.PI]}
          scale={[1.90945, 1.90945005, 1.90945]}
        >
          <mesh
            name="AD_Object003"
            geometry={nodes.AD_Object003.geometry}
            material={adMaterials[6]}
            scale={0.01}
          />
        </group>
        <group
          position={[-23.02143799, 17.2481958, 57.95930176]}
          rotation={[Math.PI, 0.68231664, -Math.PI]}
          scale={[1.42569998, 1.42569995, 1.42569998]}
        >
          <mesh
            name="AD_Plane001_Elements018"
            geometry={nodes.AD_Plane001_Elements018.geometry}
            material={adMaterials[7]}
            scale={0.01}
            // userData={{ frames: 2 }}
          />
        </group>
        <group
          position={[-16.97102173, 14.64256348, 56.6913916]}
          rotation={[Math.PI, 0.91503315, -Math.PI]}
          scale={[2.16962953, 2.16962957, 2.16962953]}
        >
          <mesh
            name="AD_Plane001_Elements019"
            geometry={nodes.AD_Plane001_Elements019.geometry}
            material={adMaterials[8]}
            scale={0.01}
          />
        </group>
        <group
          userData={{ direction: 1 }}
          name="CAR_SUB018"
          position={[-0.88415924, 0.00092232, 64.17369141]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={163.47395325}
        >
          <group scale={0.01}>
            <mesh
              name="CAR_SUB018_1"
              geometry={nodes.CAR_SUB018_1.geometry}
              material={materials.Black}
            />
            <mesh
              name="CAR_SUB018_2"
              geometry={nodes.CAR_SUB018_2.geometry}
              material={materials.Body}
            />
            <mesh
              name="CAR_SUB018_3"
              geometry={nodes.CAR_SUB018_3.geometry}
              material={materials.Bumpers}
            />
            <mesh
              name="CAR_SUB018_4"
              geometry={nodes.CAR_SUB018_4.geometry}
              material={materials.GLASS_CAR}
            />
            <mesh
              name="CAR_SUB018_5"
              geometry={nodes.CAR_SUB018_5.geometry}
              material={materials.Material__2706_Slot__9_006}
            />
            <mesh
              name="CAR_SUB018_6"
              geometry={nodes.CAR_SUB018_6.geometry}
              material={materials.Silver}
            />
            <mesh
              name="CAR_SUB018_7"
              geometry={nodes.CAR_SUB018_7.geometry}
              material={materials.Underside}
            />
            <mesh
              name="CAR_SUB018_8"
              geometry={nodes.CAR_SUB018_8.geometry}
              material={materials.Wheel}
            />
          </group>
        </group>
        <group
          userData={{ direction: 1 }}
          name="CAR_SUB019"
          position={[-4.33198456, 0.00092232, 120.59728516]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={163.47395325}
        >
          <group scale={0.01}>
            <mesh
              name="CAR_SUB019_1"
              geometry={nodes.CAR_SUB019_1.geometry}
              material={materials.Black}
            />
            <mesh
              name="CAR_SUB019_2"
              geometry={nodes.CAR_SUB019_2.geometry}
              material={materials.Body}
            />
            <mesh
              name="CAR_SUB019_3"
              geometry={nodes.CAR_SUB019_3.geometry}
              material={materials.Bumpers}
            />
            <mesh
              name="CAR_SUB019_4"
              geometry={nodes.CAR_SUB019_4.geometry}
              material={materials.GLASS_CAR}
            />
            <mesh
              name="CAR_SUB019_5"
              geometry={nodes.CAR_SUB019_5.geometry}
              material={materials.Material__2706_Slot__9_006}
            />
            <mesh
              name="CAR_SUB019_6"
              geometry={nodes.CAR_SUB019_6.geometry}
              material={materials.Silver}
            />
            <mesh
              name="CAR_SUB019_7"
              geometry={nodes.CAR_SUB019_7.geometry}
              material={materials.Underside}
            />
            <mesh
              name="CAR_SUB019_8"
              geometry={nodes.CAR_SUB019_8.geometry}
              material={materials.Wheel}
            />
          </group>
        </group>
        <group
          position={[1.36417267, 0.13444726, -0.34884857]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[0.841483, 0.841483, 1]}
        >
          <mesh
            name="Cylinder001"
            geometry={nodes.Cylinder001.geometry}
            material={materials.Material__3103}
            scale={0.01}
          />
        </group>
        <group
          position={[0.3577002, 0, -130.88760742]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <group name="STREET001" scale={0.01}>
            <mesh
              name="STREET001_1"
              geometry={nodes.STREET001_1.geometry}
              material={materials.Material__3102}
            />
            <mesh
              name="STREET001_2"
              geometry={nodes.STREET001_2.geometry}
              material={materials.Material__3103}
            />
          </group>
        </group>
        <group
          position={[1.36417267, 0.13444726, -0.34884857]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[0.841483, 0.841483, 1]}
        >
          <mesh
            name="Object003"
            geometry={nodes.Object003.geometry}
            material={materials.GRASS}
            scale={0.01}
          />
        </group>
        <group
          position={[1.36417267, 0.13444726, 50.70003906]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[0.841483, 0.841483, 1]}
        >
          <mesh
            name="Cylinder002"
            geometry={nodes.Cylinder002.geometry}
            material={materials.Material__3103}
            scale={0.01}
          />
        </group>
        <group
          position={[1.36417267, 0.13444726, 50.70003906]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[0.841483, 0.841483, 1]}
        >
          <mesh
            name="Object004"
            geometry={nodes.Object004.geometry}
            material={materials.GRASS}
            scale={0.01}
          />
        </group>
        <group
          position={[1.36417267, 0.13444726, 115.55962891]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[0.841483, 0.841483, 1]}
        >
          <mesh
            name="Cylinder003"
            geometry={nodes.Cylinder003.geometry}
            material={materials.Material__3103}
            scale={0.01}
          />
        </group>
        <group
          position={[1.36417267, 0.13444726, 115.55962891]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[0.841483, 0.841483, 1]}
        >
          <mesh
            name="Object005"
            geometry={nodes.Object005.geometry}
            material={materials.GRASS}
            scale={0.01}
          />
        </group>
        <group
          position={[1.36417267, 0.13444726, 169.83185547]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[0.841483, 0.841483, 1]}
        >
          <mesh
            name="Cylinder004"
            geometry={nodes.Cylinder004.geometry}
            material={materials.Material__3103}
            scale={0.01}
          />
        </group>
        <group
          position={[1.36417267, 0.13444726, 169.83185547]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[0.841483, 0.841483, 1]}
        >
          <mesh
            name="Object006"
            geometry={nodes.Object006.geometry}
            material={materials.GRASS}
            scale={0.01}
          />
        </group>
        <group
          position={[20.20615601, 12.75339844, -42.1044043]}
          rotation={[-Math.PI / 2, -Math.PI / 2, 0]}
        >
          <mesh
            name="Cylinder005"
            geometry={nodes.Cylinder005.geometry}
            material={materials.Material__3116}
            scale={0.01}
          />
        </group>
        <group
          position={[20.24290527, 7.5, -75.11006836]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          <mesh
            name="Object007"
            geometry={nodes.Object007.geometry}
            material={materials.BUILDING_D_01}
            scale={0.01}
          />
        </group>
      </group>
    )
  })
)

const animateCars = (targets = []) => {
  const initialPositions = targets.map((t) => t.position.z)

  const tickerCb = (et) => {
    /* https://www.desmos.com/calculator/or0za8qqas?lang=es */
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

  const tweens = mapOffsetTargets.map((t) => {
    return gsap.fromTo(
      t,
      { x: 0 },
      {
        x: 1,
        duration: 1,
        repeatDelay: 7 + Math.random() * 2,
        delay: 2 + Math.random() * 2,
        repeat: -1
      }
    )
  })

  return () => {
    tweens.forEach((t) => t.kill())
  }
}

const Effects = forwardRef(({ scene }, ref) => {
  const controls = useControls({
    bloom: folder({
      luminanceThreshold: {
        value: 0,
        min: 0,
        max: 1
      },
      luminanceSmoothing: {
        value: 0.7,
        min: 0,
        max: 1
      },
      bloomIntensity: {
        value: 0.5,
        min: 0,
        max: 1
      }
    })
  })

  return (
    <EffectComposer
      scene={scene}
      disableNormalPass={true}
      multisampling={0}
      stencilBuffer={true}
      ref={ref}
    >
      <Bloom
        luminanceThreshold={controls.luminanceThreshold}
        luminanceSmoothing={controls.luminanceSmoothing}
        intensity={controls.intensity}
        height={300}
      />
    </EffectComposer>
  )
})

const VolumetricSpotLight = ({ position, rotation }) => {
  const controls = useControls({
    volumetricSpot: folder({
      attenuation: {
        value: 7.3,
        min: 0,
        max: 10
      },
      anglePower: {
        value: 5.0,
        min: 0,
        max: 10
      },
      lightColor: {
        value: '#0815ce'
      },
      bottomRadius: {
        value: 10,
        min: 0,
        max: 10
      },
      topRadius: {
        value: 0.1,
        min: 0,
        max: 10
      }
    })
  })

  const height = 12

  const uniforms = useUniforms(
    {
      attenuation: {
        value: 6.1
      },
      anglePower: {
        value: 6.5
      },
      spotPosition: {
        value: new THREE.Vector3(...position)
      },
      lightColor: {
        value: new THREE.Color('cyan')
      }
    },
    controls,
    {
      middlewares: {
        lightColor: (curr, input) => {
          curr?.set(input)
        }
      }
    }
  )

  return (
    <mesh position={position} rotation={rotation}>
      <cylinderGeometry
        args={[
          controls.topRadius,
          controls.bottomRadius,
          height,
          32 * 2,
          20,
          true
        ]}
      />
      <shaderMaterial
        toneMapped={true}
        uniforms={uniforms.current}
        // eslint-disable-next-line prettier/prettier
        vertexShader={/* glsl */ `
          varying vec3 vNormal;
          varying vec3 vWorldPosition;

          void main(){
            // compute intensity
            vNormal		= normalize( normalMatrix * normal );

            vec4 worldPosition	= modelMatrix * vec4( position, 1.0 );
            vWorldPosition		= worldPosition.xyz;

            // set gl_Position
            gl_Position	= projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
          }
        `
        }
        // eslint-disable-next-line prettier/prettier
        fragmentShader={/* glsl */ `
          varying vec3		vNormal;
          varying vec3		vWorldPosition;

          uniform vec3		lightColor;

          uniform vec3		spotPosition;

          uniform float		attenuation;
          uniform float		anglePower;

          void main(){
            float intensity;

            // distance attenuation
            intensity	= distance(vWorldPosition, spotPosition)/attenuation;
            intensity	= 1.0 - clamp(intensity, 0.0, 1.0);

            // intensity on angle
            vec3 normal	= vec3(vNormal.x, vNormal.y, abs(vNormal.z));
            float angleIntensity	= pow( dot(normal, vec3(0.0, 0.0, 1.0)), anglePower );
            intensity	= intensity * angleIntensity;

            // set the final color
            gl_FragColor	= vec4( lightColor, intensity);
          }
        `
        }
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}

const SpotLights = () => {
  return (
    <>
      <VolumetricSpotLight
        position={[-4.8, 2.55, 19.85]}
        rotation={[0, 0, 0.2]}
      />
      <VolumetricSpotLight
        position={[7.5, 2.55, 21.9]}
        rotation={[0, 0, -0.2]}
      />
      <VolumetricSpotLight
        position={[-4.8, 2.55, 74.4]}
        rotation={[0, 0, 0.2]}
      />
      <VolumetricSpotLight
        position={[7.5, 2.55, 112.7]}
        rotation={[0, 0, -0.2]}
      />
      <VolumetricSpotLight
        position={[-4.8, 2.55, 108.9]}
        rotation={[0, 0, 0.2]}
      />
      <VolumetricSpotLight
        position={[-4.8, 2.55, 165.2]}
        rotation={[0, 0, 0.2]}
      />
      <VolumetricSpotLight
        position={[7.5, 2.55, 194.53]}
        rotation={[0, 0, -0.2]}
      />
    </>
  )
}

const spotlightTarget = new THREE.Object3D()
spotlightTarget.position.set(-0, 0, 300)

const CarpenterScene = () => {
  const composerRef = useRef()

  const spotlightRef = useRef()
  const modelRef = useRef()

  const controls = useControls({
    light: folder({
      ambientLightColor: {
        value: '#000ed1'
      },
      ambientLightIntensity: {
        value: 0.2,
        min: 0,
        max: 1,
        step: 0.01
      },
      spotlightTargetPos: {
        value: new THREE.Vector3(0, 0, 100)
      }
    }),
    fog: folder({
      fogColor: {
        value: '#000110'
      }
    })
  })

  useEffect(() => {
    if (!modelRef.current) return

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
      <CameraShake intensity={0.25} />

      {/* Effects */}
      <ambientLight
        intensity={controls.ambientLightIntensity}
        color={controls.ambientLightColor}
      />

      <SpotLights />

      <SpotLight
        distance={400}
        position={[20, 250, -120]}
        target={spotlightTarget}
        angle={Math.PI / 4}
        penumbra={0}
        intensity={0.6}
        color="#0e1df2"
        ref={spotlightRef}
      />

      <Model ref={modelRef} />

      <Effects ref={composerRef} />

      <color attach="background" args={[controls.fogColor]} />
    </>
  )
}

CarpenterScene.Title = 'Carpenter'
CarpenterScene.Tags = 'private'
CarpenterScene.Layout = ({ children, ...props }) => {
  // const pointer = useCursor((s) => s.pointer)

  return (
    <HTMLLayout {...props}>
      <AspectCanvas
        // style={{ cursor: pointer ? 'pointer' : 'auto' }}
        ratio={21 / 9}
        config={{
          onCreated: (state) => {
            /* Enable shader transparency */
            const glContext = state.gl.getContext()

            glContext.enable(glContext.BLEND)
            glContext.blendFunc(
              glContext.SRC_ALPHA,
              glContext.ONE_MINUS_SRC_ALPHA
            )
          },
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
