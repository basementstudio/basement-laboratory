import { NextApiRequest, NextApiResponse } from 'next'

import { internalServerError, success } from '~/lib/api-responses'

import { getFileContributors } from '../../lib/github'
import { getAllExperimentSlugs, getExamplePath } from '../../lib/utils'

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const allSlugs = await getAllExperimentSlugs()

    const modules = await Promise.all(
      allSlugs.map((slug) =>
        import(`~/experiments/${slug}`).then((m) => [slug, m.default])
      )
    )

    let experiments = modules
      .map((exp) => {
        const title: string = exp[1].Title || exp[0]

        return {
          filename: exp[0],
          title,
          href: `/experiments/${exp[0]}`,
          tags:
            (exp[1].Tags as string)
              ?.split(',')
              ?.map((tag) => tag.toLowerCase().trim()) || []
        }
      })
      .sort((a, b) =>
        a.filename.localeCompare(b.filename, undefined, { numeric: true })
      )

    experiments = experiments.filter((e) => !e.tags.includes('private'))

    // Numerate experiments
    experiments = experiments.map((e, i) => ({
      ...e,
      number: i + 1
    }))

    // Add contributors
    experiments = await Promise.all(
      experiments.map(async (e) => {
        const contributors = await getFileContributors(
          getExamplePath(e.filename)
        )

        return {
          ...e,
          contributors
        }
      })
    )

    success(res, experiments as any)
  } catch (error) {
    internalServerError(res, error)
  }
}