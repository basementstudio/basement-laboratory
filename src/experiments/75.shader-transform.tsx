import {
  Edges,
  Environment,
  Grid,
  PerspectiveCamera,
  ScrollControls,
  useScroll,
  useTexture
} from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { EffectComposer, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { useRef } from 'react'
import * as THREE from 'three'

import { R3FSuspenseLayout } from '~/components/layout/r3f-suspense-layout'

const vertex = /*glsl*/ `
    varying vec2 vUv;
    varying vec3 vView;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main()
    {
        vec4 transformed = modelViewMatrix * vec4(position, 1.0);
        vView = normalize(-transformed.xyz);

        vUv = uv;
        vNormal = normal;
        vPosition = position;

        gl_Position = projectionMatrix * transformed;
    }
`
const fragment = /*glsl*/ `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vView;
    uniform sampler2D uMatcap;
    uniform float uTime;
    uniform float uProgress;

      

    //	Classic Perlin 3D Noise 
    //	by Stefan Gustavson (https://github.com/stegu/webgl-noise)
    //
    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
    vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

    float cnoise(vec3 P){
      vec3 Pi0 = floor(P); // Integer part for indexing
      vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
      Pi0 = mod(Pi0, 289.0);
      Pi1 = mod(Pi1, 289.0);
      vec3 Pf0 = fract(P); // Fractional part for interpolation
      vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
      vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
      vec4 iy = vec4(Pi0.yy, Pi1.yy);
      vec4 iz0 = Pi0.zzzz;
      vec4 iz1 = Pi1.zzzz;

      vec4 ixy = permute(permute(ix) + iy);
      vec4 ixy0 = permute(ixy + iz0);
      vec4 ixy1 = permute(ixy + iz1);

      vec4 gx0 = ixy0 / 7.0;
      vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
      gx0 = fract(gx0);
      vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
      vec4 sz0 = step(gz0, vec4(0.0));
      gx0 -= sz0 * (step(0.0, gx0) - 0.5);
      gy0 -= sz0 * (step(0.0, gy0) - 0.5);

      vec4 gx1 = ixy1 / 7.0;
      vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
      gx1 = fract(gx1);
      vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
      vec4 sz1 = step(gz1, vec4(0.0));
      gx1 -= sz1 * (step(0.0, gx1) - 0.5);
      gy1 -= sz1 * (step(0.0, gy1) - 0.5);

      vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
      vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
      vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
      vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
      vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
      vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
      vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
      vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

      vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
      g000 *= norm0.x;
      g010 *= norm0.y;
      g100 *= norm0.z;
      g110 *= norm0.w;
      vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
      g001 *= norm1.x;
      g011 *= norm1.y;
      g101 *= norm1.z;
      g111 *= norm1.w;

      float n000 = dot(g000, Pf0);
      float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
      float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
      float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
      float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
      float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
      float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
      float n111 = dot(g111, Pf1);

      vec3 fade_xyz = fade(Pf0);
      vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
      vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
      float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
      return 2.2 * n_xyz;
    }
    
 
    void main() {
      vec3 a = vec3(0.5, 0.5, 0.5);
      vec3 b = vec3(0.5, 0.5, 0.5);
      vec3 c = vec3(1.0, 1.0, 1.0);
      vec3 d = vec3(0.00, 0.33, 0.67);

      vec3 viewDir = normalize(vView); 
      vec3 x = normalize(vec3(viewDir.z, 0.0, -viewDir.x));
      vec3 y = cross(viewDir, x);
      vec2 uv = vec2(dot(x, vNormal), dot(y, vNormal)) * 0.495 + 0.5;

      vec4 color = texture2D(uMatcap, uv);
      gl_FragColor = vec4(vNormal, 1.0); 

      float diff = abs(dot(vNormal, normalize(vec3(1.0, 1.0, 0.0)))) + abs(dot(vNormal, normalize(vec3(1.0, -1.0, 0.0))));
      diff *= 0.5;

     
   
      
      float noise = 0.5 * (cnoise(vPosition) + 1.0) + uProgress - vPosition.y * 0.08;
      float step = smoothstep(0.1, 0.09,noise);
      vec3 animateColor = a + b * cos(2.0 * 3.1415 * (c * diff + d + uTime / 3.0));
      
      vec4 final = mix(color, vec4(animateColor, 1.0), step);

      gl_FragColor = final; 
    }
`
interface ExtendedScrollControlsState extends ScrollControlsState {
  scroll: {
    current: number
  }
}

interface ScrollControlsState {
  scroll: {
    current: number
  }
}

const Experience = () => {
  const matcap = useTexture('/matcaps/darkblue.png')
  const pyramidGeometry = new THREE.CylinderGeometry(0, 4, 5, 4, 1)
  const pyramidRef = useRef<THREE.Mesh>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)
  const data: ExtendedScrollControlsState =
    useScroll() as unknown as ExtendedScrollControlsState

  const customMaterial = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uLevel: { value: 0 },
      uPlayhead: { value: 0 },
      uDivisionColor: { value: 0 },
      uMatcap: { value: matcap },
      uProgress: { value: 0 }
    },

    transparent: true,
    vertexShader: vertex,
    fragmentShader: fragment
  })

  useFrame((_state, delta) => {
    customMaterial.uniforms.uProgress.value = -data.scroll.current
    customMaterial.uniforms.uTime.value += delta
    cameraRef.current?.position.set(0, 3, 10 - data.scroll.current * 6)
    cameraRef.current?.lookAt(0, 0, 0)
    const rotationAngle = data.scroll.current * Math.PI
    pyramidRef.current?.rotation.set(0, rotationAngle, 0)
  })

  return (
    <>
      <PerspectiveCamera ref={cameraRef} makeDefault />
      <mesh
        ref={pyramidRef}
        geometry={pyramidGeometry}
        material={customMaterial}
        position={[0, 1, 0]}
        rotation={[0, 0, 0]}
        scale={0.4}
      >
        <Edges linewidth={2} scale={1} threshold={15} color="white" />
      </mesh>
      <Grid
        position={[0, -0.01, 0]}
        args={[10.5, 10.5]}
        cellSize={0.6}
        cellThickness={1.0}
        cellColor={'#727272'}
        sectionSize={3.3}
        sectionThickness={1.5}
        sectionColor={'#8d8d8d'}
        fadeDistance={25}
        fadeStrength={1.0}
        infiniteGrid
      />
      <Environment preset="sunset" />
    </>
  )
}

const ShaderTransform = () => {
  return (
    <>
      <ScrollControls pages={2} damping={0.1}>
        <Experience />
        <EffectComposer>
          <Noise premultiply blendFunction={BlendFunction.ADD} />
        </EffectComposer>
      </ScrollControls>
    </>
  )
}

ShaderTransform.Layout = R3FSuspenseLayout

ShaderTransform.Title = 'Shader transform'
ShaderTransform.Description =
  'Animate transition between matcap texture and shader based on scroll'

export default ShaderTransform
