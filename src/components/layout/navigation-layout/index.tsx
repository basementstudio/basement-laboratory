import clsx from 'clsx'
import Link from 'next/link'
import React, { FC, useState } from 'react'

import { Formated } from '~/components/common/formated'
import { useMousetrap } from '~/hooks/use-mousetrap'
import { getExampleGithubUrl } from '~/lib/utils'

import s from './navigation-layout.module.scss'

export type NavigationLayoutProps = {
  title?: string
  description?: string
  slug: string
  children: React.ReactNode
  defaultHidden?: boolean
}

export const NavigationLayout: FC<NavigationLayoutProps> = ({
  children,
  title,
  description,
  slug,
  defaultHidden = false
}) => {
  const [hidden, setHidden] = useState(defaultHidden)

  useMousetrap([
    {
      keys: ['h'],
      callback: () => setHidden((v) => !v)
    }
  ])

  return (
    <>
      <div className={clsx(s['layout'], { [s['hidden']]: hidden })}>
        <Link href="/">← Back to examples</Link>
        <div className={s['heading']}>
          {title && <h1 className={s['title']}>{title}</h1>}
          {description && (
            <Formated className={s['description']}>
              {typeof description === 'string' ? (
                <p>{description}</p>
              ) : (
                description
              )}
            </Formated>
          )}
        </div>
      </div>
      <a
        className={clsx({ [s['hidden']]: hidden })}
        href={getExampleGithubUrl(slug)}
        title="source code"
      >
        <span className={s['source']}>{'<>'}</span>
      </a>
      {children}
    </>
  )
}
