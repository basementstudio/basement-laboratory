import { useLayoutEffect, useRef } from 'react'

import { HTMLLayout } from '../components/layout/html-layout'

const JustATest = () => {
  const svgRef = useRef(null)
  const canvasRef = useRef(null)

  useLayoutEffect(() => {
    var vid = document.createElement('video')
    vid.src = '/video/mr-ballen-mask-compressed.webm'
    vid.muted = true
    vid.autoplay = true
    vid.playsInline = true
    vid.onloadedmetadata = initCanvas
    vid.loop = true
    vid.play()

    function initCanvas() {
      var canvas = canvasRef.current

      var ctx = canvas.getContext('2d')

      /* Support device pixel density */
      var dpr = window.devicePixelRatio || 1
      var rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)

      const { width, height } = svgRef.current.getBoundingClientRect()
      let clonedSvgElement = svgRef.current.cloneNode(true)
      let outerHTML = clonedSvgElement.outerHTML,
        blob = new Blob([outerHTML], { type: 'image/svg+xml;charset=utf-8' })
      let URL = window.URL || window.webkitURL || window
      let blobURL = URL.createObjectURL(blob)
      let image = new Image()

      function draw() {
        // clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        ctx.drawImage(
          image,
          (rect.width - width) / 2,
          (rect.height - height) / 2,
          width,
          height
        )

        // set the composite mode
        ctx.globalCompositeOperation = 'source-in'
        // first draw our video frame
        ctx.drawImage(vid, 0, 0, canvas.width / 2, canvas.height / 2)

        ctx.globalCompositeOperation = 'source-over'

        requestAnimationFrame(draw)
      }

      image.onload = draw
      image.src = blobURL
    }
  }, [])

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // bg gradient violet to blue
        background: 'linear-gradient(90deg, #9D50BB 0%, #6E48AA 100%)'
      }}
    >
      <canvas style={{ width: '100%', height: '100%' }} ref={canvasRef} />
      <div style={{ visibility: 'hidden' }}>
        <svg
          style={{ position: 'absolute', top: 0, left: 0 }}
          width="100%"
          viewBox="0 0 1866 408"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          ref={svgRef}
        >
          <path
            d="M0.876684 208.199H172.189C289.417 208.199 324.319 194.078 324.319 154.114V136.263C324.319 120.011 316.859 109.088 296.611 102.427C314.994 95.7665 321.122 85.3759 321.122 69.6567V54.2039C321.122 14.5063 288.618 0.385684 171.39 0.385684H0.876684V208.199ZM120.502 84.0438V49.6747H169.259C192.704 49.6747 201.496 53.1382 201.496 64.0617V69.3903C201.496 80.5802 192.704 84.0438 169.259 84.0438H120.502ZM120.502 159.176V121.344H172.189C195.635 121.344 204.693 125.606 204.693 136.53V144.523C204.693 155.713 195.635 159.176 172.189 159.176H120.502ZM553.613 208.199H677.235L564.803 0.385684H427.06L316.226 208.199H432.921L444.644 184.753H542.956L553.613 208.199ZM471.287 130.935L495.798 81.9123L518.444 130.935H471.287ZM799.579 154.647V0.385684H679.953V208.199H950.643V154.647H799.579ZM1081.36 154.647V0.385684H961.731V208.199H1232.42V154.647H1081.36ZM1243.51 208.199H1527.79V154.647H1363.13V125.074H1518.46V80.5802H1363.13V54.2039H1524.86V0.385684H1243.51V208.199ZM1542.44 208.199H1650.34V123.209L1762.24 208.199H1865.35V0.385684H1757.45V85.6423L1645.55 0.385684H1542.44V208.199ZM280.41 286.398V278.319C280.41 245.31 245.323 218.764 144.681 218.764C44.2691 218.764 8.95183 238.847 8.95183 274.164V282.705C8.95183 357.263 179.075 318.253 179.075 344.106V348.261C179.075 355.878 170.534 359.11 144.681 359.11C118.828 359.11 110.287 355.647 110.287 348.03V340.182H6.64352V348.261C6.64352 381.501 33.6508 407.815 144.681 407.815C255.711 407.815 282.718 387.964 282.718 352.416V343.875C282.718 269.316 110.518 308.327 110.518 282.474V278.319C110.518 270.701 119.058 267.47 144.681 267.47C170.303 267.47 178.844 270.932 178.844 278.55V286.398H280.41ZM568.702 223.15H289.627V269.778H377.343V403.199H480.986V269.778H568.702V223.15ZM749.418 223.15V342.259C749.418 354.955 741.108 359.11 715.716 359.11C690.556 359.11 682.246 354.955 682.246 342.259V223.15H578.602V350.569C578.602 386.117 611.381 407.815 715.716 407.815C820.283 407.815 853.061 386.117 853.061 350.569V223.15H749.418ZM1006.22 223.15H871.65V403.199H1006.22C1116.1 403.199 1148.88 383.578 1148.88 348.261V278.319C1148.88 243.002 1116.1 223.15 1006.22 223.15ZM1045.24 286.629V339.951C1045.24 352.185 1036.93 356.802 1006.22 356.802H975.294V269.778H1006.22C1036.93 269.778 1045.24 274.395 1045.24 286.629ZM1164.7 223.15V403.199H1268.34V223.15H1164.7ZM1426.99 218.764C1317.11 218.764 1284.33 240.693 1284.33 276.011V350.569C1284.33 385.886 1317.11 407.815 1426.99 407.815C1536.86 407.815 1569.64 385.886 1569.64 350.569V276.011C1569.64 240.693 1536.86 218.764 1426.99 218.764ZM1466 284.321V342.259C1466 354.493 1457.69 359.11 1426.99 359.11C1396.28 359.11 1387.98 354.493 1387.98 342.259V284.321C1387.98 272.086 1396.28 267.47 1426.99 267.47C1457.69 267.47 1466 272.086 1466 284.321ZM1856.56 286.398V278.319C1856.56 245.31 1821.47 218.764 1720.83 218.764C1620.42 218.764 1585.1 238.847 1585.1 274.164V282.705C1585.1 357.263 1755.22 318.253 1755.22 344.106V348.261C1755.22 355.878 1746.68 359.11 1720.83 359.11C1694.97 359.11 1686.43 355.647 1686.43 348.03V340.182H1582.79V348.261C1582.79 381.501 1609.8 407.815 1720.83 407.815C1831.86 407.815 1858.86 387.964 1858.86 352.416V343.875C1858.86 269.316 1686.66 308.327 1686.66 282.474V278.319C1686.66 270.701 1695.2 267.47 1720.83 267.47C1746.45 267.47 1754.99 270.932 1754.99 278.55V286.398H1856.56Z"
            fill="#FF0000"
          />
        </svg>
      </div>
    </div>
  )
}

JustATest.Layout = HTMLLayout

JustATest.Title = 'Ballen Title'
JustATest.Tags = 'private'

export default JustATest
