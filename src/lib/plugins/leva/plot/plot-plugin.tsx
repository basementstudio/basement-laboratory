import { Data, StoreType } from 'leva/src/types'
import * as math from 'mathjs'

import type {
  ForeignExpression,
  InternalPlot,
  InternalPlotSettings,
  PlotInput
} from './plot-types'
import {
  isForeignExpression,
  parseForeignExpression,
  parseStringExpression
} from './plot-utils'

export const sanitize = (
  expression: PlotInput['expression'],
  _settings: InternalPlotSettings,
  _prevValue: math.MathNode,
  _path: string,
  store: StoreType
) => {
  console.log({ expression })
  if (isForeignExpression(expression)) {
    return parseForeignExpression(expression as ForeignExpression)
  }

  if (expression === '') throw Error('Empty mathjs expression')
  try {
    return parseStringExpression(expression as string, store.get)
  } catch (e) {
    throw Error('Invalid mathjs expression string')
  }
}

export const format = (value: InternalPlot) => {
  return value?.__parsed?.toString() || value.name + '()'
}

const defaultSettings = {
  boundsX: [-1, 1],
  boundsY: [-Infinity, Infinity],
  graph: true
}

export const normalize = (
  { expression, ..._settings }: PlotInput,
  _path: string,
  data: Data
) => {
  console.log('NORMALIZE', { expression })
  const get = (path: string) => {
    // @ts-expect-error
    if ('value' in data[path]) return data[path].value
    return undefined // TODO should throw
  }

  const value = isForeignExpression(expression)
    ? parseForeignExpression(expression as ForeignExpression)
    : (parseStringExpression(expression as string, get) as (v: number) => any)
  const settings = { ...defaultSettings, ..._settings }

  return { value, settings: settings as InternalPlotSettings }
}
