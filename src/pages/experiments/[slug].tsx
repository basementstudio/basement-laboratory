import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next'
import { ParsedUrlQuery } from 'querystring'
import { FC } from 'react'

import { R3FCanvasLayout } from '~/components/layout/r3f-canvas-layout'
import * as Experiments from '~/experiments'

type Component<P = Record<string, unknown>> = FC<P> & {
  Layout?: FC
  getLayout?: GetLayoutFn<P>
  Title?: string
  Description?: string
}

type GetLayoutFn<P = Record<string, unknown>> = (props: {
  Component: Component<P>
  title?: string
  description?: string
}) => React.ReactNode

const resolveLayout = (Component: Component): GetLayoutFn => {
  if (Component?.getLayout) {
    return Component.getLayout
  }

  if (Component?.Layout) {
    return ({ Component, ...rest }) =>
      Component?.Layout?.({ children: <Component />, ...rest })
  }

  return ({ Component, ...rest }) => (
    <R3FCanvasLayout {...rest}>
      <Component />
    </R3FCanvasLayout>
  )
}

const Experiment = ({
  slug
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  const Component = (Experiments as Record<string, FC>)[slug] as Component

  const getLayout = resolveLayout(Component)

  return (
    <>
      {getLayout({
        Component,
        title: Component.Title,
        description: Component.Description
      })}
    </>
  )
}

export const getStaticPaths: GetStaticPaths = () => {
  const paths = Object.entries(Experiments).map((exp) => {
    const title = exp[0]

    return {
      params: {
        slug: title
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
