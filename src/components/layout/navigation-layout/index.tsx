import Link from 'next/link'
import React, { FC } from 'react'

import s from './navigation-layout.module.scss'

export type NavigationLayoutProps = {
  title?: string
  description?: string
}

export const NavigationLayout: FC<NavigationLayoutProps> = ({
  children,
  title,
  description
}) => {
  return (
    <>
      <div className={s['layout']}>
        <Link href="/">← Back to examples</Link>
        <div className={s['heading']}>
          {title && <h1 className={s['title']}>{title}</h1>}
          {description && <p className={s['description']}>{description}</p>}
        </div>
      </div>
      {children}
    </>
  )
}
