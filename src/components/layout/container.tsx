import clsx from 'clsx'
import * as React from 'react'

export const Container = React.forwardRef<
  HTMLDivElement,
  JSX.IntrinsicElements['div']
>(({ className, ...props }, ref) => {
  return (
    <div
      {...props}
      className={clsx(
        // TODO: Put some padding, max width, and margin-x auto in here!
        className
      )}
      ref={ref}
    />
  )
})

export type ContainerProps = React.ComponentProps<typeof Container>
