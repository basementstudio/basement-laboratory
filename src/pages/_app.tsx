import '~/css/global.scss'

import { NextComponentType, NextPageContext } from 'next'
import { AppProps } from 'next/app'
import * as React from 'react'

import { basementLog, gaTrackingId, isClient, isProd } from '~/lib/constants'
import { GAScripts } from '~/lib/ga'

// TODO delete this basement log if not a basement project.
if (isProd && isClient) {
  // eslint-disable-next-line no-console
  console.log(basementLog)
}

export type Page<P = Record<string, unknown>> = NextComponentType<
  NextPageContext,
  Record<string, unknown>,
  P
> & { getLayout?: GetLayoutFn<P> }

export type GetLayoutFn<P = Record<string, unknown>> = (
  props: AppProps<P>
) => React.ReactNode

const App = ({ Component, pageProps }: AppProps) => {
  return (
    <>
      {gaTrackingId && <GAScripts />}

      {/* @ts-ignore */}
      <Component {...pageProps} />
    </>
  )
}

export default App
