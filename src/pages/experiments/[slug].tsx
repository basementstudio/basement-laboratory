import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next'
import { ParsedUrlQuery } from 'querystring'
import { FC, useEffect, useState } from 'react'

import { R3FCanvasLayout } from '~/components/layout/r3f-canvas-layout'
import { getAllExperimentSlugs } from '~/lib/utils'

type Module<P> = {
  default: P
}

type Component<P = Record<string, unknown>> = FC<P> & {
  Layout?: FC
  getLayout?: GetLayoutFn<P>
  Title?: string
  Description?: string
}

type GetLayoutFn<P = Record<string, unknown>> = FC<{
  Component: Component<P>
  title?: string
  description?: string
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
  const [Component, setComponent] = useState<Module<Component>>()

  useEffect(() => {
    import(`~/experiments/${slug}`).then((Comp) => {
      setComponent(Comp)
    })
  }, [slug])

  useEffect(() => {
    console.log('Hi from layout use effect')
  }, [])

  if (!Component) {
    return <div>Loading...</div>
  }

  const Layout = resolveLayout(Component)

  return (
    <>
      <Layout
        Component={Component.default}
        title={Component.default.Title}
        description={Component.default.Description}
        slug={slug}
      />
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const allSlugs = await getAllExperimentSlugs()

  const paths = allSlugs.map((exp) => {
    return {
      params: {
        slug: exp
      }
    }
  })

  return {
    paths,
    fallback: false
  }
}

export const getStaticProps: GetStaticProps = ({ params }) => {
  return {
    props: {
      slug: (params as ParsedUrlQuery).slug
    }
  }
}

export default Experiment
