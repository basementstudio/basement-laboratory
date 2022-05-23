import { GetStaticProps, InferGetStaticPropsType } from 'next'

import { Meta } from '~/components/common/meta'
import Welcome from '~/components/common/welcome'
import * as Experiments from '~/components/experiments'
import { PageLayout } from '~/components/layout/page'

const HomePage = ({
  experiments
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  return (
    <PageLayout>
      <Meta />

      <Welcome experiments={experiments} />
    </PageLayout>
  )
}

export const getStaticProps: GetStaticProps = () => {
  const experiments = Object.entries(Experiments).map((exp) => {
    const title = (exp[1] as any).Title || exp[0]

    return {
      title,
      href: `/experiments/${exp[0]}`
    }
  })

  return {
    props: {
      experiments: experiments
    }
  }
}

export default HomePage
