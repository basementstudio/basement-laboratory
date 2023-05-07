import { Center, OrbitControls } from '@react-three/drei'
import { Canvas, useLoader } from '@react-three/fiber'
import { Dispatch, SetStateAction, Suspense, useState } from 'react'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import { HTMLLayout } from '~/components/layout/html-layout'

const GLTF = ({ setPerc }: { setPerc: Dispatch<SetStateAction<number>> }) => {
  const gltf = useLoader(
    GLTFLoader,
    '/api/57.content-length-api?path=/models/cupcake.glb',
    undefined,
    (xhr) => {
      const percentComplete = (xhr.loaded / xhr.total) * 100
      setPerc(percentComplete)
    }
  )

  return <primitive object={gltf.scene} />
}

const AssetProgress = () => {
  const [percentage, setPercentage] = useState(0)

  const roundedPercentage = Math.round(percentage)

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}
      >
        {roundedPercentage != 100 && (
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontWeight: 600 }}>{roundedPercentage}%</span>
            <div style={{ width: 400, height: 3, marginTop: 12 }}>
              <div
                style={{
                  background: 'white',
                  height: '100%',
                  width: roundedPercentage + '%'
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div style={{ position: 'fixed', height: '100vh', width: '100vw' }}>
        <Canvas>
          <OrbitControls />
          <ambientLight intensity={2} />
          <Suspense fallback={<></>}>
            <Center scale={0.8}>
              <GLTF setPerc={setPercentage} />
            </Center>
          </Suspense>
        </Canvas>
      </div>
    </>
  )
}

AssetProgress.Title = 'Asset Progress'
AssetProgress.Description = 'Loading progress of assets'
AssetProgress.Layout = HTMLLayout

export default AssetProgress
