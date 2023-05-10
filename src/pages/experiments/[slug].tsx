import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next'
import * as React from 'react'

import { Meta } from '~/components/common/meta'
import { R3FCanvasLayout } from '~/components/layout/r3f-canvas-layout'
import { getAllExperimentSlugs } from '~/lib/utils'

type Module<P> = {
  default: P
  title?: React.ReactNode
  description?: React.ReactNode
}

type Component<P = Record<string, unknown>> = React.FC<P> & {
  Layout?: React.FunctionComponent<React.PropsWithChildren>
  getLayout?: GetLayoutFn<P>
}

type GetLayoutFn<P = Record<string, unknown>> = React.FC<{
  Component: React.FunctionComponent<P>
  title?: React.ReactNode
  description?: React.ReactNode
  slug: string
}>

const resolveLayout = (Comp: Module<Component>): GetLayoutFn => {
  const Component = Comp.default

  if (Component?.getLayout) {
    return Component.getLayout
  }

  if (Component?.Layout) {
    const Layout = Component.Layout

    return ({ Component, ...rest }) => (
      <Layout {...rest}>
        <Component />
      </Layout>
    )
  }

  return ({ Component, ...rest }) => {
    return (
      <R3FCanvasLayout {...rest}>
        <Component />
      </R3FCanvasLayout>
    )
  }
}

const Experiment = ({
  slug
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  const [Component, setComponent] = React.useState<Module<Component>>()

  React.useEffect(() => {
    import(`~/experiments/${slug}`).then((Comp) => {
      setComponent(Comp)
    })
  }, [slug])

  if (!Component) {
    return (
      <>
        <Meta />
        <div>Loading...</div>
      </>
    )
  }

  const Layout = resolveLayout(Component)

  return (
    <>
      <Meta />
      <Layout
        Component={Component.default}
        title={Component.title}
        description={Component.description}
        slug={slug}
      />
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const allSlugs = await getAllExperimentSlugs()

  const paths = allSlugs.map((slug) => {
    return {
      params: {
        slug
      }
    }
  })

  return {
    paths,
    fallback: false
  }
}

export const getStaticProps: GetStaticProps = ({ params }) => {
  if (!params?.slug) {
    return { notFound: true }
  }

  return {
    props: {
      slug: params.slug
    }
  }
}

export default Experiment
