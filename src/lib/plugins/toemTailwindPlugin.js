const plugin = require('tailwindcss/plugin')

/* https://github.com/tailwindlabs/tailwindcss/blob/next/packages/tailwindcss/src/utilities.ts */

const DIVISION_REGEX =
  /(\d+)(?:\/)(\d+)/ /* [number]/[number] separated by groups */

const buildPropsObject = (propOrProps, value) => {
  const targetProps = Array.isArray(propOrProps) ? propOrProps : [propOrProps]

  return targetProps.reduce((acc, prop) => {
    acc[prop] = value
    return acc
  }, {})
}

// ONLY VALUES THAT CAN RECEIVE EM UNITS AS VALUES
const DYNAMIC_PROPS = [
  ['p', 'padding'],
  ['pt', 'padding-top'],
  ['pr', 'padding-right'],
  ['pb', 'padding-bottom'],
  ['pl', 'padding-left'],
  ['m', 'margin'],
  ['mt', 'margin-top'],
  ['mr', 'margin-right'],
  ['mb', 'margin-bottom'],
  ['ml', 'margin-left'],
  ['w', 'width'],
  ['min-w', 'min-width'],
  ['max-w', 'max-width'],
  ['h', 'height'],
  ['min-h', 'min-height'],
  ['max-h', 'max-height'],
  ['text', 'font-size'],
  ['rounded', 'border-radius'],
  ['rounded-t', ['border-top-left-radius', 'border-top-right-radius']],
  ['rounded-r', ['border-top-right-radius', 'border-bottom-right-radius']],
  ['rounded-b', ['border-bottom-right-radius', 'border-bottom-left-radius']],
  ['rounded-l', ['border-top-left-radius', 'border-bottom-left-radius']],
  ['rounded-tl', 'border-top-left-radius'],
  ['rounded-tr', 'border-top-right-radius'],
  ['rounded-br', 'border-bottom-right-radius'],
  ['rounded-bl', 'border-bottom-left-radius'],
  ['border', 'border-width'],
  ['border-t', 'border-top-width'],
  ['border-r', 'border-right-width'],
  ['border-b', 'border-bottom-width'],
  ['border-l', 'border-left-width'],
  ['size', ['width', 'height']],
  ['left', 'left'],
  ['right', 'right'],
  ['top', 'top'],
  ['bottom', 'bottom'],
  ['gap', 'gap'],
  ['inset', ['top', 'right', 'bottom', 'left']],
  ['inset-x', ['left', 'right']],
  ['inset-y', ['top', 'bottom']]
]

const toemTailwindPlugin = plugin(({ matchUtilities }) => {
  DYNAMIC_PROPS.forEach((p) => {
    matchUtilities(
      {
        [p[0] + '-em']: (v) => {
          const result = DIVISION_REGEX.exec(v)

          if (!result) {
            return {
              [p[1]]: '/* toem() error: invalid division */'
            }
          }

          const emValue = result[1] / result[2]

          return buildPropsObject(p[1], emValue + 'em')
        }
      },
      {}
    )
  })
})

module.exports = toemTailwindPlugin
