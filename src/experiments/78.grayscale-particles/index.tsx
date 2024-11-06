import { PerspectiveCamera } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useControls } from 'leva'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

import { HTMLLayout } from '~/components/layout/html-layout'

interface DisplacementState {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  texture: THREE.Texture
  glowImage: HTMLImageElement
}

const GrayscaleParticles = () => {
  return (
    <div style={{ position: 'fixed', height: '100vh', width: '100vw' }}>
      <Canvas>
        <PerspectiveCamera makeDefault fov={35} position={[0, 0, 15]} />
        <Particles />
      </Canvas>
    </div>
  )
}

const vertexShader = /*glsl*/ `
    uniform vec2 uResolution;
    uniform sampler2D uTexture;
    uniform sampler2D uDisplacementTexture;
    uniform float uTime;
    uniform float uTimeMultiplier;
    uniform float uMouseOverPlane;
    uniform float uDistortion;
    uniform float uPointSize;

    attribute float aIntensity;
    attribute float aAngle;
    varying vec3 vColor;

    float random(vec2 uv) {
        return fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
    }

    vec2 noise(vec2 uv) {
        float x = random(uv + vec2(uTime * uTimeMultiplier));
        float y = random(uv + vec2(uTime * uTimeMultiplier + 100.0));
        return vec2(x, y) * 2.0 - 1.0; // Range from -1 to 1
    }

    float displacementNoise(vec2 uv) {
        vec2 offset = vec2(random(uv + vec2(uTime * uTimeMultiplier * 0.5)), random(uv + vec2(uTime * uTimeMultiplier * 0.5 + 50.0)));
        return random(uv + offset * 0.5) * 0.3 + 0.7; // Range from 0.7 to 1.0
    }

    void main() {
        vec3 newPosition = position;

        vec2 distortedUV = uv + (noise(uv) * uDistortion); // Slightly distort UV coordinates
        float displacement = texture(uDisplacementTexture, distortedUV).r;
        displacement *= displacementNoise(uv); // Multiply by noise

        displacement = smoothstep(0.1, 0.5, displacement);
        vec3 displacementVector = vec3(cos(aAngle) * 0.2, sin(aAngle) * 0.2, 1.0);
        displacementVector = normalize(displacementVector);

        displacementVector *= displacement * uMouseOverPlane;
        displacementVector *= aIntensity;

        newPosition += displacementVector;

        vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectedPosition = projectionMatrix * viewPosition;
        gl_Position = projectedPosition;

        float pictureIntensity = texture(uTexture, uv).r;

        gl_PointSize = 0.05 * uPointSize * pictureIntensity * uResolution.y;
        gl_PointSize *= (1.0 / -viewPosition.z);

        vColor = vec3(pow(pictureIntensity, 3.0));
    }
`

const fragmentShader = /*glsl*/ `
    varying vec3 vColor;

    float sdCircle(in vec2 p, in float r) {
        return length(p) - r;
    }

    void main() {
        vec2 uv = gl_PointCoord;
        float distanceToCenter = distance(uv, vec2(0.5));

        if(distanceToCenter > 0.5) {
            discard;
        }

        gl_FragColor = vec4(vColor, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
    }
`

function Particles(): JSX.Element {
  const meshRef = useRef<THREE.Points>(null)
  const { viewport, size } = useThree()

  // Controls
  const controls = useControls({
    showDisplacementCanvas: { value: false },
    texture: {
      value: '/images/hand.png',
      options: ['/images/hand.png', '/images/demon.png', 'random']
    },
    timeMultiplier: { value: 0, min: 0, max: 0.01, step: 0.0001 },
    distortion: { value: 0.03, min: 0, max: 1, step: 0.001 },
    pointSize: { value: 1, min: 0, max: 10, step: 0.001 }
  })

  // Displacement setup
  const displacement = useMemo<DisplacementState>(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128

    canvas.style.position = 'fixed'
    canvas.style.bottom = '0'
    canvas.style.right = '0'
    canvas.style.width = '256px'
    canvas.style.height = '256px'
    canvas.style.zIndex = '100'
    canvas.style.border = '1px solid gray'
    canvas.style.pointerEvents = 'none'
    canvas.style.display = controls.showDisplacementCanvas ? 'block' : 'none'
    document.body.appendChild(canvas)

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get 2D context')

    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const texture = new THREE.CanvasTexture(canvas)

    const glowImage = new Image()
    glowImage.src = '/images/glow.png'

    return { canvas, ctx, texture, glowImage }
  }, [controls.showDisplacementCanvas])

  // Geometry and material setup
  const { geometry, material } = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(10, 10, 128, 128)

    const intensitiesArray = new Float32Array(
      geometry.attributes.position.count
    )
    const anglesArray = new Float32Array(geometry.attributes.position.count)

    for (let i = 0; i < intensitiesArray.length; i++) {
      intensitiesArray[i] = Math.random()
      anglesArray[i] = Math.random() * Math.PI * 2
    }

    geometry.setAttribute(
      'aIntensity',
      new THREE.BufferAttribute(intensitiesArray, 1)
    )
    geometry.setAttribute('aAngle', new THREE.BufferAttribute(anglesArray, 1))

    // Create the material directly instead of just props
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uResolution: { value: new THREE.Vector2() },
        uTexture: { value: null }, // We'll set this in the useEffect
        uDisplacementTexture: { value: displacement.texture },
        uTime: { value: 0 },
        uTimeMultiplier: { value: 0 },
        uMouseOverPlane: { value: 0 },
        uPointSize: { value: 1.0 },
        uDistortion: { value: 0.03 }
      },
      blending: THREE.AdditiveBlending
    })

    return { geometry, material }
  }, [displacement.texture])

  // Mouse interaction
  const mouse = useRef(new THREE.Vector2(-999, -999))
  const canvasPosition = useRef(new THREE.Vector2(-999, -999))
  const planeRef = useRef<THREE.Mesh>(null)

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      mouse.current.x = (event.clientX / size.width) * 2 - 1
      mouse.current.y = -(event.clientY / size.height) * 2 + 1
    }

    window.addEventListener('pointermove', handlePointerMove)
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [size])

  // Animation loop
  useFrame((state) => {
    if (!meshRef.current) return
    if (!planeRef.current) return

    const material = meshRef.current.material as THREE.ShaderMaterial
    const uniforms = material.uniforms

    // Update uniforms
    uniforms.uTime.value = state.clock.elapsedTime
    uniforms.uTimeMultiplier.value = controls.timeMultiplier
    uniforms.uDistortion.value = controls.distortion
    uniforms.uPointSize.value = controls.pointSize
    uniforms.uResolution.value.set(
      size.width * viewport.dpr,
      size.height * viewport.dpr
    )

    // Raycasting
    const raycaster = state.raycaster
    raycaster.setFromCamera(mouse.current, state.camera)
    const intersects = raycaster.intersectObject(planeRef.current)

    if (intersects.length > 0) {
      const uv = intersects[0].uv
      if (uv) {
        canvasPosition.current.x = uv.x * displacement.canvas.width
        canvasPosition.current.y = (1 - uv.y) * displacement.canvas.height
        uniforms.uMouseOverPlane.value +=
          (1.0 - uniforms.uMouseOverPlane.value) * 0.1
      }
    } else {
      canvasPosition.current.set(-999, -999)
      uniforms.uMouseOverPlane.value +=
        (0.0 - uniforms.uMouseOverPlane.value) * 0.1
    }

    // Update displacement canvas
    displacement.ctx.globalCompositeOperation = 'source-over'
    displacement.ctx.globalAlpha = 0.05
    displacement.ctx.fillRect(
      0,
      0,
      displacement.canvas.width,
      displacement.canvas.height
    )

    const glowSize = displacement.canvas.width * 0.15
    displacement.ctx.globalCompositeOperation = 'lighten'
    displacement.ctx.globalAlpha = 1

    displacement.ctx.drawImage(
      displacement.glowImage,
      canvasPosition.current.x - glowSize / 2,
      canvasPosition.current.y - glowSize / 2,
      glowSize,
      glowSize
    )

    displacement.texture.needsUpdate = true
  })

  // Texture loading effect
  useEffect(() => {
    if (!meshRef.current) return

    const loadTexture = (url: string) => {
      new THREE.TextureLoader().load(
        url,
        (texture) => {
          // If there was a previous texture, dispose it
          if (material.uniforms.uTexture.value) {
            material.uniforms.uTexture.value.dispose()
          }

          // Update the uniform
          material.uniforms.uTexture.value = texture
          material.needsUpdate = true
        },
        undefined,
        (error) => {
          console.error('Error loading texture:', error)
        }
      )
    }

    if (controls.texture === 'random') {
      const random = Math.floor(Math.random() * 100) + 1
      const url = `https://picsum.photos/128/128?grayscale&random=${random}`
      loadTexture(url)
    } else {
      loadTexture(controls.texture)
    }
  }, [controls.texture, material])

  // Add cleanup for displacement texture
  useEffect(() => {
    return () => {
      displacement.texture.dispose()
      document.body.removeChild(displacement.canvas)
    }
  }, [displacement])

  return (
    <>
      <points ref={meshRef} geometry={geometry}>
        <primitive object={material} attach="material" />
      </points>

      <mesh ref={planeRef} visible={false}>
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial color="red" />
      </mesh>
    </>
  )
}

GrayscaleParticles.Layout = HTMLLayout

GrayscaleParticles.Title = 'Grayscale Particles'
GrayscaleParticles.Description = 'Grayscale particles'

export default GrayscaleParticles
