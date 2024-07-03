import { Center, PerspectiveCamera, useGLTF } from '@react-three/drei'
import { useRef } from 'react'

import { useRenderTexture, useTextureFrame } from './render-texture'

export const InnerScene = () => {
  const groupRef = useRef<THREE.Group>(null)

  const uniformsRef = useRef({
    time: { value: 0 }
  })

  const { scene } = useGLTF('/models/SmileyFace.glb')

  // Get rencer-texture aspect from the context:
  const { aspect } = useRenderTexture()

  useTextureFrame(({ delta }) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y += 1 * delta
    uniformsRef.current.time.value += delta
  })

  return (
    <>
      <color attach="background" args={['#000']} />

      <mesh position={[0, 0, -4]}>
        <planeGeometry args={[7, 7]} />
        <shaderMaterial
          uniforms={uniformsRef.current}
          vertexShader={
            /*glsl*/ `
            varying vec2 vUv;

            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
            `
          }
          fragmentShader={
            /*glsl*/ `

            varying vec2 vUv;
            uniform float time;

            float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
            vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
            vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}

            float noise(vec3 p){
                vec3 a = floor(p);
                vec3 d = p - a;
                d = d * d * (3.0 - 2.0 * d);

                vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
                vec4 k1 = perm(b.xyxy);
                vec4 k2 = perm(k1.xyxy + b.zzww);

                vec4 c = k2 + a.zzzz;
                vec4 k3 = perm(c);
                vec4 k4 = perm(c + 1.0);

                vec4 o1 = fract(k3 * (1.0 / 41.0));
                vec4 o2 = fract(k4 * (1.0 / 41.0));

                vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
                vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);

                return o4.y * d.y + o4.x * (1.0 - d.y);
            }

            void main() {

              float n = noise(vec3(vUv * 8., time * 0.1)) * 2. - 1.;


              vec3 color = vec3(
                smoothstep(0.9, 1.0, sin(n * 10.))
              );

              vec3 orange = vec3(255., 77., 0.) / 255.;

              color *= orange;

              gl_FragColor = vec4(color, 1.0);
            }

            
            `
          }
        />
      </mesh>
      <ambientLight intensity={2} />
      {/* We dont want this camera to follow the screen aspect, but our texture aspect */}
      <PerspectiveCamera
        manual
        aspect={aspect}
        makeDefault
        position={[0, 0, 5]}
      />

      <group ref={groupRef} scale={[1.8, 1.8, 1.8]}>
        <Center>
          <primitive object={scene} />
        </Center>
      </group>

      {/* <group position={[0, -1.3, -2]} scale={[10, 10, 10]}>
        <Backdrop floor={0.25} segments={20}>
          <meshStandardMaterial color="#353540" />
        </Backdrop>
      </group> */}

      {/* <group ref={groupRef}>
        <mesh position={[-1.2, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#a0d" />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="green" />
        </mesh>
        <mesh position={[1.2, 0, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="blue" />
        </mesh>

        <mesh position={[1, 0, 0.5 + 0.25]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="white" />
        </mesh>
      </group> */}
    </>
  )
}
