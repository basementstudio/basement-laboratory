import { CameraShake, PresentationControls, useGLTF } from '@react-three/drei'
import {
  ChromaticAberration,
  EffectComposer,
  Noise,
  Scanline
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { useRef } from 'react'

const RGBShiftedModel = () => {
  const { nodes, materials } = useGLTF('/models/SmileyFace.glb')
  const aberrationRef = useRef()

  return (
    <>
      <CameraShake />

      <EffectComposer>
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={[0.002, 0.002]}
          ref={aberrationRef}
        />
        <Noise opacity={0.1} />
        <Scanline density={1} />
      </EffectComposer>
      <PresentationControls>
        <group scale={3} position={[-0.04, 0.45, 0]}>
          <mesh
            geometry={nodes.Cylinder003.geometry}
            material={materials['m_Smiley-v2']}
          />
          <mesh
            geometry={nodes.Cylinder003_1.geometry}
            material={materials.m_Outline}
          />
        </group>
      </PresentationControls>
    </>
  )
}

export const title = 'RGB shifted smiley face'
export const description = (
  <p>
    This is a <code>glb</code> + <code>postprocessing</code> example. Made with{' '}
    <a href="https://github.com/pmndrs/drei">react-three-drei</a> &{' '}
    <a href="https://github.com/pmndrs/react-postprocessing">
      react-three-postprocessing
    </a>
    .
  </p>
)
export const tags = ['3d', 'postprocessing']

export default RGBShiftedModel
