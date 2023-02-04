import clsx from 'clsx'
import React, { FC } from 'react'

import s from './formated.module.scss'

type FormatedProps = {
  children: React.ReactNode
  className?: string
}

export const Formated: FC<FormatedProps> = ({ children, className }) => {
  return <div className={clsx(s['formated'], className)}>{children}</div>
}
