import React, { FC } from 'react'
import { CubicBezierCurve3 } from 'three'

import { getBezierCurves } from '~/lib/three'

type BezierDropAreaProps = {
  onDrop: (bezierCurves: CubicBezierCurve3[]) => void
}

export const BezierDropArea: FC<BezierDropAreaProps> = ({ onDrop }) => {
  return (
    <div
      style={{
        marginTop: 8,
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px dashed rgba(255, 255, 255, 0.1)',
        borderRadius: '6px',
        padding: '14px',
        position: 'relative'
      }}
    >
      <input
        type="file"
        style={{ position: 'absolute', inset: 0, opacity: '0' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          const reader = new FileReader()

          reader.onload = (e) => {
            if (typeof e.target?.result !== 'string') return
            const json = JSON.parse(e.target.result)

            onDrop(getBezierCurves(json))
          }

          if (file) {
            reader.readAsText(file)
          } else {
            console.error('No file selected')
          }
        }}
      />
      <p style={{ fontSize: 14, textAlign: 'center' }}>
        Drop your own JSON here
      </p>
    </div>
  )
}
