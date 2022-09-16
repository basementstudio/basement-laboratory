import gsap from 'gsap'
import { CSSRulePlugin } from 'gsap/dist/CSSRulePlugin'
import { CustomEase } from 'gsap/dist/CustomEase'
import { DrawSVGPlugin } from 'gsap/dist/DrawSVGPlugin'
import { Flip } from 'gsap/dist/Flip'
import { ScrollToPlugin } from 'gsap/dist/ScrollToPlugin'
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger'
import { SplitText } from 'gsap/dist/SplitText'
import { TextPlugin } from 'gsap/dist/TextPlugin'
import isElement from 'lodash/isElement'

let GSDevTools

if (process.env.NODE_ENV === 'development') {
  import('gsap/dist/GSDevTools').then((GSDevToolsLib) => {
    GSDevTools = GSDevToolsLib.GSDevTools
    gsap.registerPlugin(GSDevTools)
  })
}

gsap.registerPlugin(
  CSSRulePlugin,
  CustomEase,
  ScrollToPlugin,
  DrawSVGPlugin,
  ScrollTrigger,
  TextPlugin,
  Flip,
  SplitText
)

const GOLDEN_RATIO = (1 + Math.sqrt(5)) / 2
const RECIPROCAL_GR = 1 / GOLDEN_RATIO
const DURATION = RECIPROCAL_GR * 0.8
const ease = CustomEase.create('custom', 'M0,0 C0.30,0.35 0.40,1 1,1')

export type RegisteredEffects =
  | 'fadeIn'
  | 'fadeInScale'
  | 'in'
  | 'out'
  | 'pulse'
  | 'flash'

gsap.config({
  autoSleep: 60,
  nullTargetWarn: false
})

gsap.defaults({
  ease: ease,
  duration: DURATION
})

gsap.registerEffect({
  name: 'fadeIn',
  extendTimeline: true,
  defaults: {
    delay: 0,
    duration: DURATION,
    scale: 1,
    stagger: DURATION / 8,
    y: 30
  },
  effect: (targets: Array<gsap.TweenTarget>, config: gsap.TweenVars) => {
    const tl = gsap.timeline()
    tl.from(targets, {
      autoAlpha: 0,
      delay: config.delay,
      duration: config.duration,
      ease: config.ease,
      stagger: config.stagger,
      scale: config.scale,
      y: config.y
    })
    return tl
  }
})

gsap.registerEffect({
  name: 'fadeInScale',
  extendTimeline: true,
  defaults: {
    delay: 0,
    duration: DURATION,
    scale: 0.4,
    stagger: DURATION / 6,
    y: 30
  },
  effect: (targets: Array<gsap.TweenTarget>, config: gsap.TweenVars) => {
    const tl = gsap.timeline()
    tl.from(targets, {
      autoAlpha: 0,
      delay: config.delay,
      duration: config.duration,
      ease: config.ease,
      stagger: config.stagger,
      scale: config.scale,
      y: config.y
    })
    return tl
  }
})

gsap.registerEffect({
  name: 'in',
  extendTimeline: true,
  defaults: {
    duration: DURATION,
    each: DURATION / 23,
    ease: ease,
    fade: DURATION / 2,
    from: 'start',
    scale: 1,
    staggerEase: ease,
    x: 0,
    xPercent: 0,
    y: 0,
    yPercent: 30
  },
  effect: (targets: Array<HTMLElement>, config: gsap.TweenVars) => {
    const tl = gsap.timeline()
    tl.from(targets, {
      duration: config.duration,
      ease: config.ease,
      scale: config.scale,
      x: config.x,
      xPercent: config.xPercent,
      y: config.y,
      yPercent: config.yPercent,
      stagger: {
        each: config.each,
        ease: config.staggerEase,
        from: config.from
      }
    })

    tl.from(
      targets,
      {
        duration: config.fade,
        ease: 'none',
        opacity: 0,
        stagger: {
          each: config.each,
          ease: config.staggerEase,
          from: config.from
        }
      },
      0
    )
    return tl
  }
})

gsap.registerEffect({
  name: 'pulse',
  effect: (targets: GSAPTweenTarget, config: GSAPTweenVars) => {
    return gsap.to(targets, {
      keyframes: {
        '0%': { scale: 1 },
        '50%': { scale: 1.05 },
        '100%': { scale: 1 },
        ease: 'power2.inOut'
      },
      duration: config.duration,
      repeat: config.repeat
    })
  },
  defaults: { duration: 1, repeat: -1 },
  extendTimeline: true
})

gsap.registerEffect({
  name: 'flash',
  effect: (targets: GSAPTweenTarget, config: GSAPTweenVars) => {
    return gsap.to(targets, {
      keyframes: {
        '0%': { autoAlpha: 1 },
        '25%': { autoAlpha: 0 },
        '50%': { autoAlpha: 1 },
        '75%': { autoAlpha: 0 },
        '100%': { autoAlpha: 1 },
        ease: 'none'
      },
      duration: config.duration,
      repeat: config.repeat
    })
  },
  defaults: { duration: DURATION * 2, repeat: -1 },
  extendTimeline: true
})

const isLegible = (target: gsap.TweenTarget) => isElement(target)

const clearProps = (target: gsap.TweenTarget, props = 'all') => {
  let filteredTargets

  if (Array.isArray(target)) {
    filteredTargets = target.filter(isLegible)
  } else {
    filteredTargets = target
  }

  return gsap.set(filteredTargets, {
    clearProps: props
  })
}

export {
  clearProps,
  CSSRulePlugin,
  DrawSVGPlugin,
  DURATION,
  Flip,
  GOLDEN_RATIO,
  gsap,
  GSDevTools,
  ScrollTrigger,
  SplitText,
  TextPlugin
}
