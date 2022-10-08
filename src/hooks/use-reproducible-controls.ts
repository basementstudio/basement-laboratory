import { button, useControls } from 'leva'
import type { FolderSettings, Schema, StoreType } from 'leva/src/types'
import cloneDeep from 'lodash/cloneDeep'
import lodashGet from 'lodash/get'
import lodashSet from 'lodash/set'
import { useEffect, useRef } from 'react'

import { getHrefWithQuery } from '~/lib/utils/router'

type HookSettings = { store?: StoreType }
type SchemaOrFn<S extends Schema = Schema> = S | (() => S)

function parseArgs(
  schemaOrFolderName: string | SchemaOrFn,
  settingsOrDepsOrSchema?: HookSettings | React.DependencyList | SchemaOrFn,
  depsOrSettingsOrFolderSettings?:
    | React.DependencyList
    | HookSettings
    | FolderSettings,
  depsOrSettings?: React.DependencyList | HookSettings,
  depsOrUndefined?: React.DependencyList
) {
  let schema: SchemaOrFn
  let folderName: string | undefined = undefined
  let folderSettings: FolderSettings | undefined
  let hookSettings: HookSettings | undefined
  let deps: React.DependencyList | undefined

  if (typeof schemaOrFolderName === 'string') {
    folderName = schemaOrFolderName
    schema = settingsOrDepsOrSchema as SchemaOrFn
    if (Array.isArray(depsOrSettingsOrFolderSettings)) {
      deps = depsOrSettingsOrFolderSettings
    } else {
      if (depsOrSettingsOrFolderSettings) {
        if ('store' in depsOrSettingsOrFolderSettings) {
          hookSettings = depsOrSettingsOrFolderSettings as HookSettings
          deps = depsOrSettings as React.DependencyList
        } else {
          folderSettings = depsOrSettingsOrFolderSettings as FolderSettings
          if (Array.isArray(depsOrSettings)) {
            deps = depsOrSettings as React.DependencyList
          } else {
            hookSettings = depsOrSettings as HookSettings
            deps = depsOrUndefined
          }
        }
      }
    }
  } else {
    schema = schemaOrFolderName as SchemaOrFn
    if (Array.isArray(settingsOrDepsOrSchema)) {
      deps = settingsOrDepsOrSchema as React.DependencyList
    } else {
      hookSettings = settingsOrDepsOrSchema as HookSettings
      deps = depsOrSettingsOrFolderSettings as React.DependencyList
    }
  }

  return { schema, folderName, folderSettings, hookSettings, deps: deps || [] }
}

const fillInitialState = <S extends Schema = Schema>(
  _config: SchemaOrFn,
  {
    get,
    onEditStart,
    onEditEnd
  }: { get: any; onEditStart: () => void; onEditEnd: () => void }
): (() => S) => {
  const isFunc = typeof _config === 'function'

  let config: Schema

  if (isFunc) {
    config = _config()
  } else {
    config = cloneDeep(_config)
  }

  const params = new URLSearchParams(window.location.search)

  const configParam = params.get('_config')

  /* Gen routes to values */
  const routes: Record<string, string> = {}
  Object.entries(config).forEach(([k, v]) => {
    // @ts-ignore
    const type = v.type

    if (type === 'FOLDER') {
      // @ts-ignore
      Object.entries(v.schema).forEach(([_k]) => {
        routes[_k] = `${k}.schema.${_k}`
      })

      return
    }

    routes[k] = `${k}`
  })

  if (configParam) {
    try {
      /* Set based on params */
      Object.entries(JSON.parse(configParam)).forEach(([k, v]) => {
        config = lodashSet(config, `${routes[k]}.value`, v)
      })

      config['Copy to Clipboard'] = button(() => {
        const copy: Record<string, any> = {}

        Object.keys(routes).forEach((k) => {
          copy[k] = get(k)
        })

        const el = document.createElement('textarea')

        el.value = JSON.stringify(copy)
        el.setAttribute('readonly', '')
        el.style.position = 'absolute'
        el.style.left = '-9999px'

        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
      })
    } catch (err) {
      console.error(err)
      return () => (isFunc ? _config() : config) as S
    }
  }

  Object.keys(routes).forEach((k) => {
    // @ts-ignore
    const propertyOnEditStart = lodashGet(config, `${routes[k]}`)[
      'onEditStart'
    ] as () => void | undefined

    // @ts-ignore
    const propertyOnEditEnd = lodashGet(config, `${routes[k]}`)[
      'onEditEnd'
    ] as () => void | undefined

    config = lodashSet(config, `${routes[k]}.onEditStart`, () => {
      propertyOnEditStart?.()
      onEditStart?.()
    })

    config = lodashSet(config, `${routes[k]}.onEditEnd`, () => {
      propertyOnEditEnd?.()
      onEditEnd?.()
    })
  })

  return () => config as S
}

export const useReproducibleControls = <
  S extends Schema,
  F extends SchemaOrFn<S> | string,
  G extends SchemaOrFn<S>
>(
  schemaOrFolderName: F,
  settingsOrDepsOrSchema?: HookSettings | React.DependencyList | G,
  depsOrSettingsOrFolderSettings?:
    | React.DependencyList
    | HookSettings
    | FolderSettings,
  depsOrSettings?: React.DependencyList | HookSettings,
  depsOrUndefined?: React.DependencyList
) => {
  const shouldUpdateUrl = useRef(false)
  const { schema } = parseArgs(
    schemaOrFolderName,
    settingsOrDepsOrSchema,
    depsOrSettingsOrFolderSettings,
    depsOrSettings,
    depsOrUndefined
  )

  const resolvedSchema = fillInitialState(schema, {
    get: (p: string) => get(p),
    onEditStart: () => {
      shouldUpdateUrl.current = true
    },
    onEditEnd: () => {
      shouldUpdateUrl.current = false
    }
  })

  const [config, set, get] = useControls(
    resolvedSchema,
    settingsOrDepsOrSchema,
    depsOrSettingsOrFolderSettings,
    depsOrSettings,
    depsOrUndefined
  )

  useEffect(() => {
    if (shouldUpdateUrl.current) {
      const trget = getHrefWithQuery(
        window.location.protocol +
          '//' +
          window.location.host +
          window.location.pathname,
        { _config: JSON.stringify(config) }
      )
      window.history.pushState({ path: trget }, '', trget)
    }
  }, [config])

  const schemaIsFunction = typeof schema === 'function'

  if (schemaIsFunction) return [config, set, get] as any
  return config as any
}
