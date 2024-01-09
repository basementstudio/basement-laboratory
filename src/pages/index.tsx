import { isDev, siteOrigin } from 'lib/constants'
import { GetStaticProps, InferGetStaticPropsType } from 'next'

import { Meta } from '~/components/common/meta'
import Welcome from '~/components/common/welcome'
import { PageLayout } from '~/components/layout/page'
import { getFileContributors } from '~/lib/github'
import { getAllExperimentSlugs, getExamplePath } from '~/lib/utils'

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
  const fs = await import('fs')
  const allSlugs = await getAllExperimentSlugs()

  const modules = await Promise.all(allSlugs.map((slug) => [slug]))

  let experiments = modules
    .map((exp) => {
      const title: string = exp?.[1]?.Title || exp[0]

      return {
        filename: exp[0],
        title,
        href: `/experiments/${exp[0]}`,
        tags:
          (exp?.[1]?.Tags as string)
            ?.split(',')
            ?.map((tag) => tag.toLowerCase().trim()) || []
      }
    })
    .sort((a, b) =>
      b.filename.localeCompare(a.filename, undefined, { numeric: true })
    )

  // Add og images
  const ogFiles = fs.readdirSync(process.cwd() + '/public/ogs')

  experiments = experiments.map((e) => {
    // Remove extension
    const filename = e.filename.split(/.(jsx|js|ts|tsx)/)[0]
    const matchingOgFile = ogFiles.find((f) => f.startsWith(filename))
    const og = matchingOgFile ? `${siteOrigin}/ogs/${matchingOgFile}` : null

    return {
      ...e,
      og
    }
  })

  if (!isDev) {
    // Filter privates
    experiments = experiments.filter((e) => !e.tags.includes('private'))
  }

  const fileNameToTile = (filename: string) => {
    let title = filename
      .replace(/^\d+\./, '')
      .replace(/\.[jt]sx?$/, '')
      .replace(/-/g, ' ')

    title = title.charAt(0).toUpperCase() + title.slice(1) + '.'

    return title
  }

  // Numerate experiments
  experiments = experiments.map((e, i) => ({
    ...e,
    title: fileNameToTile(e.title),
    number: experiments.length - i
  }))

  // Add contributors
  experiments = await Promise.all(
    experiments.map(async (e) => {
      const contributors = await getFileContributors(getExamplePath(e.filename))

      return {
        ...e,
        contributors
      }
    })
  )

  fs.writeFileSync(
    process.cwd() + '/public/experiments.json',
    JSON.stringify(experiments, null, 2)
  )

  return {
    props: {
      experiments: experiments
    }
  }
}

export default HomePage
