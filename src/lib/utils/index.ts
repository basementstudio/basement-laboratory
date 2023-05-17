import { githubUrl, isClient } from '~/lib/constants'

export const formatError = (
  error: unknown
): { message: string; name?: string } => {
  try {
    if (error instanceof Error) {
      return { message: error.message, name: error.name }
    }
    return { message: String(error) }
  } catch (error) {
    return { message: 'An unknown error ocurred.' }
  }
}

export const isApiSupported = (api: string) => isClient && api in window

/* Builds responsive sizes string for images */
export const getSizes = (
  entries: ({ breakpoint: string; width: string } | string | number)[]
) => {
  const sizes = entries.map((entry) => {
    if (!entry) {
      return ''
    }

    if (typeof entry === 'string') {
      return entry
    }

    if (typeof entry === 'number') {
      return `${entry}px`
    }

    if (entry.breakpoint.includes('px') || entry.breakpoint.includes('rem')) {
      return `(min-width: ${entry.breakpoint}) ${entry.width}`
    }

    throw new Error(`Invalid breakpoint: ${entry.breakpoint}`)
  })

  return sizes.join(', ')
}

export const getExampleGithubUrl = (filename: string) =>
  `${githubUrl}/blob/main/${getExamplePath(filename)}`

export const getExamplePath = (filename: string) =>
  `src/experiments/${filename}`

type GetAllExperimentSlugs = () => Promise<string[]>

type GetAllExperimentConfigs = () => Promise<
  Array<{
    title?: string
    path: string
    tags?: string[]
  }>
>

export const getAllExperimentSlugs: GetAllExperimentSlugs = async () => {
  const fs = await import('fs')
  const path = await import('path')
  const experimentsDir = path.resolve(process.cwd(), 'src/experiments')
  const files = fs.readdirSync(experimentsDir)

  files.sort(function (a, b) {
    return (
      fs.statSync(experimentsDir + '/' + a).birthtime.getTime() -
      fs.statSync(experimentsDir + '/' + b).birthtime.getTime()
    )
  })

  return files
}

export const getAllExperimentConfigs: GetAllExperimentConfigs = async () => {
  const files = await getAllExperimentSlugs()

  const modules = await Promise.all(
    files.map(async (file) => {
      try {
        const module = await import('/src/experiments/' + file)
        return { path: file, title: module.title, tags: module.tags }
      } catch (_err) {
        console.warn(`WARNING: Metadata from ${file} module couldn't be read`)
        return { path: file }
      }
    })
  )

  return modules
}

// Detects if the parameter is a react component and returns a boolean
export const isReactComponent = (
  param: unknown
): param is React.ComponentType => {
  const isFunctionComponent = (param: unknown) => {
    return (
      typeof param === 'function' &&
      String(param).includes('return React.createElement')
    )
  }

  const isClassComponent = (param: unknown) => {
    return typeof param === 'function' && !!param.prototype.isReactComponent
  }

  return isFunctionComponent(param) || isClassComponent(param)
}

export const range = (start: number, stop?: number, step?: number) => {
  if (typeof stop === 'undefined') {
    stop = start
    start = 0
  }

  if (typeof step === 'undefined') {
    step = 1
  }

  if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
    return []
  }

  const result = []
  for (let i = start; step > 0 ? i < stop : i > stop; i += step) {
    result.push(i)
  }

  return result
}
