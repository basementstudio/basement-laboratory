import { GetStaticProps, InferGetStaticPropsType } from 'next'

import { Meta } from '~/components/common/meta'
import Welcome from '~/components/common/welcome'
import { PageLayout } from '~/components/layout/page'
import { getAllExperimentSlugs } from '~/lib/utils'

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

export const getStaticProps: GetStaticProps = async () => {
  const allSlugs = await getAllExperimentSlugs()

  const modules = await Promise.all(
    allSlugs.map((slug) =>
      import(`~/experiments/${slug}`).then((m) => [slug, m.default])
    )
  )

  const experiments = modules.map((exp) => {
    const title = exp[1].Title || exp[0]

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
