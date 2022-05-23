import Link from 'next/link'
import React, { FC } from 'react'

import s from './navigation-layout.module.scss'

const NavigationLayout: FC = ({ children }) => {
  return (
    <>
      <div className={s['layout']}>
        <Link href="/">← Back to examples</Link>
      </div>
      {children}
    </>
  )
}

export default NavigationLayout
