import Link from 'next/link'
import React, { FC } from 'react'

import { getExampleGithubUrl } from '~/lib/utils'

import s from './navigation-layout.module.scss'

export type NavigationLayoutProps = {
  title?: string
  description?: string
  slug: string
}

export const NavigationLayout: FC<NavigationLayoutProps> = ({
  children,
  title,
  description,
  slug
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
      <Link href={getExampleGithubUrl(slug)}>
        <a>
          <span className={s['source']}>{'<>'}</span>
        </a>
      </Link>
      {children}
    </>
  )
}
