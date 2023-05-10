import Image from 'next/image'
import * as React from 'react'

import undergroundSrc from '../../public/images/underground.jpeg'
import { NavigationLayout } from '../components/layout/navigation-layout'

const SVGFilters = () => {
  return (
    <main
      style={{
        overflow: 'hidden',
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        style={{
          filter: 'url(#n1)',
          maxWidth: '768px',
          mixBlendMode: 'difference',
          fontSize: 'min(56px, 7vw)'
        }}
      >
        <h1
          style={{
            fontWeight: 800,
            fontFamily: 'Basement Grotesque'
          }}
        >
          From the basement
        </h1>
        <div
          style={{
            fontSize: 'max(12px, 0.3em)',
            lineHeight: 1.6,
            marginTop: 18
          }}
        >
          <h2 style={{ fontSize: '1.5em', lineHeight: 1.2 }}>
            <b>Basement Grotesque</b> is the studio’s first venture into the
            daunting but exciting world of type design. Of course, we had to
            start with a heavyweight: striking and unapologetically so; flawed
            but charming and full of&nbsp;character.
          </h2>
          <p style={{ marginTop: 18 }}>
            The typeface is a work in progress, open to anyone who shares our
            visual and graphic sensibilities. You're invited to check our
            journey as we iterate, change, and add new weights and widths in the
            future as we learn by&nbsp;doing.
          </p>
          <p style={{ marginTop: 18 }}>
            The typeface is a work in progress, open to anyone who shares our
            visual and graphic sensibilities. You're invited to check our
            journey as we iterate, change, and add new weights and widths in the
            future as we learn by&nbsp;doing.
          </p>
        </div>
      </div>

      <Image
        src={undergroundSrc}
        layout="raw"
        style={{
          position: 'fixed',
          inset: 0,
          height: '100vh',
          width: '100vw',
          objectFit: 'cover',
          zIndex: -1,
          filter: 'url(#n0)',
          opacity: 0.4,
          userSelect: 'none'
        }}
        priority
        quality={100}
        draggable={false}
      />

      <svg style={{ display: 'none' }}>
        <defs>
          <filter id="n0">
            <feGaussianBlur
              in="SourceGraphic"
              result="BLURRED"
              stdDeviation="4.5"
            />
            <feDisplacementMap
              in="BLURRED"
              scale="50"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          <filter id="n1">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.001 0.001"
              numOctaves="5"
              result="NOISE"
              seed="132903"
            />
            <feGaussianBlur
              in="SourceGraphic"
              result="BLURRED"
              stdDeviation="0"
            />
            <feDisplacementMap
              id="displacer"
              in2="NOISE"
              in="BLURRED"
              scale="31"
              xChannelSelector="R"
              yChannelSelector="R"
              result="DISPLACED"
            />
          </filter>
        </defs>
      </svg>
    </main>
  )
}

SVGFilters.getLayout = ({ Component, title, description, slug }) => {
  return (
    <>
      <NavigationLayout title={title} description={description} slug={slug}>
        <Component />
      </NavigationLayout>
    </>
  )
}

export const title = 'SVG Filters'
SVGFilters.Tags = 'example'

export default SVGFilters
