import { useEffect, useRef } from 'react'

type Configs = Record<string, any>
type Uniforms = Record<string, { value: any }>
type Config = {
  include?: string[]
  exclude?: string[]
  middlewares?: Record<string, (curr: any, value: any) => any | void>
}

export const useUniforms = (
  uniformsArg: Uniforms,
  updateObj: Configs = {},
  config: Config = {}
) => {
  const uniforms = useRef(uniformsArg)

  useEffect(() => {
    /* Update Uniforms */
    const middlewares = config.middlewares || {}
    const uniformKeys = Object.keys(uniforms.current)
    const middlewareMissingKeys = Object.keys(middlewares).filter(
      (k) => !uniformKeys.includes(k)
    )

    const include = [
      ...uniformKeys,
      ...middlewareMissingKeys,
      ...(config.include || [])
    ]
    const exclude = config.exclude || []

    Object.keys(updateObj)
      .filter((key) => !exclude.includes(key))
      .filter((key) => include.includes(key))
      .map((key) => {
        if (middlewares[key]) {
          const res = middlewares[key](
            uniforms.current[key]?.value,
            updateObj[key]
          )

          if (res != undefined) {
            uniforms.current[key].value = res
          }
        } else if (updateObj[key] != undefined) {
          uniforms.current[key].value = updateObj[key]
        }
      })
  }, [updateObj])

  return uniforms
}
