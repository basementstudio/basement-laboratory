import * as React from 'react'

export const AspectBox = ({
  ratio,
  children,
  style,
  ...rest
}: { ratio: number } & Omit<JSX.IntrinsicElements['div'], 'ref'>) => {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        paddingBottom: `${100 / ratio}%`
      }}
    >
      <div
        {...rest}
        style={{
          ...style,
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        }}
      >
        {children}
      </div>
    </div>
  )
}
