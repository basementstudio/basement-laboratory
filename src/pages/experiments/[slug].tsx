import { GetStaticPaths, GetStaticProps } from 'next'
import { ParsedUrlQuery } from 'querystring'
import { FC, useEffect } from 'react'

// import { R3FCanvasLayout } from '~/components/layout/r3f-canvas-layout'
import { getAllExperimentSlugs } from '~/lib/utils'

import Comp from '../../experiments/29.circular-fog'

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

const Experiment = () => {
  // const [Component, setComponent] = useState<Module<Component>>()

  // useEffect(() => {
  //   import(`~/experiments/${slug}`).then((Comp) => {
  //     setComponent(Comp)
  //   })
  // }, [slug])

  // if (!Component) {
  //   return <div>Loading...</div>
  // }

  // const Layout = resolveLayout(Component)

  useEffect(() => {
    console.log('Hello from no deps component on layout.')
  }, [])

  return (
    <>
      {/* <Layout
        Component={Component?.default}
        title={Component?.default?.Title}
        description={Component?.default?.Description}
        slug={slug}
      /> */}
      {/* @ts-ignore */}
      <Comp />
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
