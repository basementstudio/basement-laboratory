import { Head, Html, Main, NextScript } from 'next/document'

import { model } from '~/lib/builders/model'

// @ts-ignore
globalThis.model = model

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body style={{ opacity: 0 }}>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
