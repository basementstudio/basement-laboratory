import clsx from 'clsx'
import { forwardRef } from 'react'

import s from './aspect-box.module.scss'

type AspectBoxProps = { ratio: number } & JSX.IntrinsicElements['div']

export const AspectBox = forwardRef<HTMLDivElement, AspectBoxProps>(
  ({ ratio, children, className, style, ...rest }, ref) => (
    <div
      {...rest}
      className={clsx(s['aspect-box'], className)}
      style={{
        ...style,
        ['--ratio' as string]: `${100 / ratio}%`,
        ['--raw-ratio' as string]: ratio
      }}
      ref={ref}
    >
      {children}
    </div>
  )
)
