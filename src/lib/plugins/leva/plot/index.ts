import { createPlugin } from 'leva/plugin'

import { Plot } from './plot'
import { format, normalize, sanitize } from './plot-plugin'

export const plot = createPlugin({
  normalize,
  sanitize,
  format,
  component: Plot
})
