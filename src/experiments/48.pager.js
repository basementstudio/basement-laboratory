import {
  Environment,
  OrthographicCamera,
  PerspectiveCamera,
  Text,
  useFBO,
  useGLTF
} from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import glsl from 'glslify'
import { useControls } from 'leva'
import { gsap } from 'lib/gsap'
import { useCallback, useMemo, useRef } from 'react'
import * as THREE from 'three'

import { useToggleState } from '~/hooks/use-toggle-state'

const texts = [
  'HELLO, WORLD!',
  'THIS IS A PAGER',
  'THIS SHOULD ALSO ALLOW SCROLLING OF THE TEXT. I THINK.'
]

const Pager = () => {
  const { handleOff, handleOn, isOn } = useToggleState(true)
  const controls = useControls({
    fontSize: {
      min: 1,
      max: 40,
      value: 4.25,
      step: 0.05
    },
    pixelDensity: {
      min: 10,
      max: 512,
      value: 128
    }
  })
  const { nodes, materials } = useGLTF('/models/Pager_v5.glb')
  const { gl } = useThree()
  const pagerRef = useRef()
  const planeRef = useRef()
  const screenSceneRef = useRef()
  const screenCameraRef = useRef()
  const arrowHelperRef = useRef()

  const boxRef1 = useRef()
  const boxRef2 = useRef()
  const boxRef3 = useRef()

  const screenSize = useMemo(() => {
    const _screenSize = new THREE.Vector3()

    nodes.Screen.geometry.computeBoundingBox()
    nodes.Screen.geometry.boundingBox.getSize(_screenSize)

    return _screenSize
  }, [nodes])

  const TARGET_HEIGHT = controls.pixelDensity

  const trgt = useFBO(
    TARGET_HEIGHT * (screenSize.x / screenSize.z),
    TARGET_HEIGHT,
    {
      magFilter: THREE.NearestFilter,
      minFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat
    }
  )

  useFrame(() => {
    screenSceneRef.current.visible = true
    // screenCameraRef.current.aspect = screenSize.x / screenSize.z
    screenCameraRef.current.updateProjectionMatrix()

    gl.setRenderTarget(trgt)
    gl.render(screenSceneRef.current, screenCameraRef.current)

    planeRef.current.material.uniforms.uTexture.value = trgt.texture
    screenSceneRef.current.visible = false

    gl.setRenderTarget(null)

    if (boxRef1.current) {
      boxRef1.current.rotation.y += 0.02
      boxRef1.current.rotation.x += 0.016
    }

    if (boxRef2.current) {
      boxRef2.current.rotation.y += 0.01
      boxRef2.current.rotation.x += 0.008
    }

    if (boxRef3.current) {
      boxRef3.current.rotation.y += 0.04
      boxRef3.current.rotation.x += 0.032
    }
  })

  const handlePointerDown = useCallback((e) => {
    e.stopPropagation()

    const buttonSize = new THREE.Vector3()

    e.object.geometry.computeBoundingBox()
    e.object.geometry.boundingBox.getSize(buttonSize)

    if (e.object.userData.pressed) return

    gsap.to(e.object.position, {
      overwrite: true,
      z: `-=${buttonSize.z}`,
      duration: 0.1,
      onStart: () => {
        e.object.userData.pressed = true
      }
    })
  }, [])

  const handlePointerUp = useCallback((e) => {
    e.stopPropagation()

    const buttonSize = new THREE.Vector3()

    e.object.geometry.computeBoundingBox()
    e.object.geometry.boundingBox.getSize(buttonSize)

    if (!e.object.userData.pressed) return

    gsap.to(e.object.position, {
      overwrite: true,
      z: `+=${buttonSize.z}`,
      duration: 0.1,
      onEnd: () => {
        e.object.userData.pressed = false
      }
    })
  }, [])

  const handlePush = useCallback((e) => {
    if (e.buttons != 1) return
    e.stopPropagation()

    /* Get pager measurements */
    const boundingBox = new THREE.Box3()
    const center = new THREE.Vector3()
    const size = new THREE.Vector3()
    boundingBox.setFromObject(pagerRef.current)
    boundingBox.getCenter(center)
    boundingBox.getSize(size)

    /* Get intersection direction info */
    const direction = e.point.sub(center)
    const length = direction.length()
    /* 1 on x,y the edges & 0 on the center on both */
    const normalizedDirection = direction
      .clone()
      .divide(size.clone().divideScalar(2))

    if (arrowHelperRef.current) {
      arrowHelperRef.current.position.copy(center)
      arrowHelperRef.current.setDirection(direction.clone().normalize())
      arrowHelperRef.current.setLength(length)
    }

    const tiltPIDivisor = 50
    const xTilt = normalizedDirection.x * (Math.PI / tiltPIDivisor)
    const yTilt = -normalizedDirection.y * (Math.PI / tiltPIDivisor)

    gsap.to(pagerRef.current.rotation, {
      overwrite: true,
      x: yTilt,
      y: xTilt,
      duration: 0.25
    })
  }, [])

  const handleRelease = useCallback(() => {
    gsap.to(pagerRef.current.rotation, {
      overwrite: true,
      x: 0,
      y: 0,
      duration: 0.25
    })
  }, [])

  return (
    <>
      {/* <axesHelper args={[1, 10]} />
      <gridHelper args={[100, 100]} /> */}
      {/* <arrowHelper ref={arrowHelperRef} /> */}

      <color attach="background" args={['white']} />
      <PerspectiveCamera fov={35} makeDefault position={[0, 0, 25]} />
      <OrthographicCamera
        top={(screenSize.z * 3) / 2}
        bottom={(-screenSize.z * 3) / 2}
        left={(-screenSize.x * 3) / 2}
        right={(screenSize.x * 3) / 2}
        position={[0, 0, 30]}
        manual
        ref={screenCameraRef}
      />
      <Environment preset="city" />
      {/* <OrbitControls /> */}

      <group
        onPointerMove={handlePush}
        onPointerDown={handlePush}
        onPointerUp={handleRelease}
        onPointerOut={handleRelease}
        onPointerLeave={handleRelease}
        onPointerMissed={handleRelease}
        onPointerCancel={handleRelease}
        ref={pagerRef}
      >
        <mesh
          name="Screen"
          geometry={nodes.Screen.geometry}
          position={[-0.2351637, 1.75619757, 0.04822026]}
          rotation={[Math.PI / 2, 0, -Math.PI]}
          ref={planeRef}
          scale={-1}
        >
          <shaderMaterial
            vertexShader={`
              varying vec2 vUv;
              void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `}
            fragmentShader={glsl/* glsl */ `
            uniform sampler2D uTexture;
            uniform float uRatio;
            uniform vec2 uResolution;
            uniform float uPixelationFactor;
            uniform vec3 uBackground;

            varying vec2 vUv;

            void main() {
              vec2 uv = vUv;

              /* Sample the texture with the pixel coordinate */
              vec4 frag = texture2D(uTexture, uv);

              gl_FragColor = frag;

              if(frag.a < 0.1) {
                gl_FragColor = vec4(uBackground, 1.0);
              }
            }
          `}
            uniforms={{
              // Aka height pixels, width is calculated based on the aspect ratio
              uBackground: { value: new THREE.Color('#719E83') },
              uTexture: { value: null },
              uRatio: { value: screenSize.x / screenSize.z },
              uResolution: {
                value: [trgt.viewport.width, trgt.viewport.height]
              }
            }}
          />
        </mesh>
        <mesh
          name="Screen_glass"
          geometry={nodes.Screen_glass.geometry}
          material={materials.Alpha}
          position={[-0.01114273, -0.0750183, 0.22505513]}
          scale={[4.0678606, 4.13221264, 4.0140748]}
        />
        <mesh
          name="Pager"
          geometry={nodes.Pager.geometry}
          material={materials.Pager}
          position={[0, -0.02695861, 0.03751168]}
          scale={3.99999952}
        />
        <mesh
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          name="Button_Right"
          geometry={nodes.Button_Right.geometry}
          material={materials.Pager}
          scale={3.99999952}
        />
        <mesh
          onClick={handleOff}
          onPointerUp={handlePointerUp}
          onPointerDown={handlePointerDown}
          name="Button_red"
          geometry={nodes.Button_red.geometry}
          material={materials.Pager}
          scale={3.99999952}
        />
        <mesh
          onPointerUp={handlePointerUp}
          onPointerDown={handlePointerDown}
          name="Button_Left"
          geometry={nodes.Button_Left.geometry}
          material={materials.Pager}
          scale={3.99999952}
        />
        <mesh
          onPointerUp={handlePointerUp}
          onPointerDown={handlePointerDown}
          name="Button_Up"
          geometry={nodes.Button_Up.geometry}
          material={materials.Pager}
          scale={3.99999952}
        />
        <mesh
          onPointerUp={handlePointerUp}
          onPointerDown={handlePointerDown}
          name="Button_Down"
          geometry={nodes.Button_Down.geometry}
          material={materials.Pager}
          scale={3.99999952}
        />
        <mesh
          onClick={handleOn}
          onPointerUp={handlePointerUp}
          onPointerDown={handlePointerDown}
          name="Button_green"
          geometry={nodes.Button_green.geometry}
          material={materials.Pager}
          scale={3.99999952}
        />
      </group>

      <scene ref={screenSceneRef}>
        {/* <color attach="background" args={['#719E83']} /> */}
        <group visible={isOn}>
          {/* <mesh ref={boxRef1}>
            <boxBufferGeometry args={[5, 5, 5]} />
            <meshNormalMaterial />
          </mesh>
          <mesh position={[-15, 0, 0]} ref={boxRef2}>
            <boxBufferGeometry args={[5, 5, 5]} />
            <meshNormalMaterial />
          </mesh>
          <mesh position={[15, 0, 0]} ref={boxRef3}>
            <boxBufferGeometry args={[5, 5, 5]} />
            <meshNormalMaterial />
          </mesh> */}
          <Text
            maxWidth={(screenSize.x - 1) * 3}
            color={'#000000'}
            lineHeight={1}
            // 6x10 grid of font
            font="/fonts/gnu-unifont/GnuUnifont.ttf"
            fontSize={controls.fontSize}
          >
            {texts[2]}
          </Text>
        </group>
      </scene>
    </>
  )
}

Pager.Title = 'Pager'
Pager.Description = <></>
Pager.Tags = 'private'

export default Pager
