import * as React from 'react'

export const AspectBox = React.forwardRef<
  HTMLDivElement,
  { ratio: number } & Omit<JSX.IntrinsicElements['div'], 'ref'>
>(({ ratio, children, style, ...rest }, ref) => {
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
        ref={ref}
      >
        {children}
      </div>
    </div>
  )
})
