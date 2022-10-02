import Document, {
  DocumentContext,
  Head,
  Html,
  Main,
  NextScript
} from 'next/document'

import { model } from '~/lib/builders/model'

// @ts-ignore
globalThis.model = model

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render() {
    return (
      <Html lang="en">
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
