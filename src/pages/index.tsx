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

  const experiments = modules
    .map((exp) => {
      const title: string = exp[1].Title || exp[0]

      return {
        title,
        href: `/experiments/${exp[0]}`
      }
    })
    .sort((a, b) => {
      const aRes = a.title.includes('example')
      const bRes = b.title.includes('example')

      if (aRes && !bRes) {
        return -1
      } else if (!aRes && bRes) {
        return 1
      } else {
        return 0
      }
    })

  return {
    props: {
      experiments: experiments
    }
  }
}

export default HomePage
