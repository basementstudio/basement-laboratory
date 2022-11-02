import type { LevaInputProps } from 'leva/plugin'

export type ForeignExpression =
  | ((x: number) => any)
  | [string, (x: number) => any]

export type Plot = {
  expression: string | ForeignExpression
}
export type PlotSettings = {
  boundsX?: [number, number]
  boundsY?: [number, number]
  graph?: boolean
}
export type PlotInput = Plot & PlotSettings

export type InternalPlot = {
  (v: number): any
  __parsedScoped?: math.MathNode
  __parsed?: math.MathNode
  __symbols?: string[]
}

export type InternalPlotSettings = Required<PlotSettings>

export type PlotProps = LevaInputProps<
  InternalPlot,
  InternalPlotSettings,
  string
>
