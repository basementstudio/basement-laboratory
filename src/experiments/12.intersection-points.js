import * as THREE from 'three'
// Import orbit controls
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

import { Script } from '../components/common/script'
import { PlainCanvasLayout } from '../components/layout/plain-canvas-layout.tsx'

const IntersectionPoints = () => {
  const pressMe = document.querySelector('#pressMe')

  THREE.Vector3.prototype.equals = function (v, tolerance) {
    if (tolerance === undefined) {
      return v.x === this.x && v.y === this.y && v.z === this.z
    } else {
      return (
        Math.abs(v.x - this.x) < tolerance &&
        Math.abs(v.y - this.y) < tolerance &&
        Math.abs(v.z - this.z) < tolerance
      )
    }
  }

  const canvas = document.querySelector('#webgl')

  console.log({ canvas })

  // ....................................................................

  var tolerance = 0.001
  var scene = new THREE.Scene()
  var camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    1000
  )
  camera.position.set(0, 10, 50)
  var renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true
  })
  renderer.setSize(window.innerWidth, window.innerHeight)

  var controls = new OrbitControls(camera, renderer.domElement)

  //scene.add(new THREE.AxisHelper(2));

  var planeGeom = new THREE.PlaneBufferGeometry(30, 30)
  planeGeom.rotateX(-Math.PI / 2)
  var plane = new THREE.Mesh(
    planeGeom,
    new THREE.MeshBasicMaterial({
      color: 'lightgray',
      transparent: true,
      opacity: 0.125,
      side: THREE.DoubleSide
    })
  )
  plane.position.y = -3.14
  plane.rotation.x = Math.PI / 5
  scene.add(plane)

  var objGeom = new THREE.TorusKnotGeometry(10, 3)

  var obj = new THREE.Mesh(
    objGeom,
    new THREE.MeshBasicMaterial({
      color: 'blue',
      wireframe: true
    })
  )
  obj.material.color.multiplyScalar(0.5)
  obj.rotation.z = Math.PI / 10
  obj.position.set(0, 3.14, 0)
  scene.add(obj)

  pressMe.addEventListener('click', drawIntersectionPoints, false)

  var pointsOfIntersection = new THREE.BufferGeometry()

  var a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    c = new THREE.Vector3()
  var planePointA = new THREE.Vector3(),
    planePointB = new THREE.Vector3(),
    planePointC = new THREE.Vector3()
  var lineAB = new THREE.Line3(),
    lineBC = new THREE.Line3(),
    lineCA = new THREE.Line3()

  var pointOfIntersection = new THREE.Vector3()

  function drawIntersectionPoints() {
    var mathPlane = new THREE.PlaneBufferGeometry()
    console.log({mathPlane})
    plane.localToWorld(
      planePointA.copy(plane.geometry.vertices[plane.geometry.faces[0].a])
    )
    plane.localToWorld(
      planePointB.copy(plane.geometry.vertices[plane.geometry.faces[0].b])
    )
    plane.localToWorld(
      planePointC.copy(plane.geometry.vertices[plane.geometry.faces[0].c])
    )
    mathPlane.setFromCoplanarPoints(planePointA, planePointB, planePointC)

    obj.geometry.faces.forEach(function (face, idx) {
      obj.localToWorld(a.copy(obj.geometry.vertices[face.a]))
      obj.localToWorld(b.copy(obj.geometry.vertices[face.b]))
      obj.localToWorld(c.copy(obj.geometry.vertices[face.c]))
      lineAB = new THREE.Line3(a, b)
      lineBC = new THREE.Line3(b, c)
      lineCA = new THREE.Line3(c, a)
      setPointOfIntersection(lineAB, mathPlane, idx)
      setPointOfIntersection(lineBC, mathPlane, idx)
      setPointOfIntersection(lineCA, mathPlane, idx)
    })

    var pointsMaterial = new THREE.PointsMaterial({
      size: 0.5,
      color: 0x00ff00
    })
    var points = new THREE.Points(pointsOfIntersection, pointsMaterial)
    scene.add(points)

    //var pairs = splitPairs(pointsOfIntersection.vertices);

    var contours = getContours(pointsOfIntersection.vertices, [], true)
    console.log('contours', contours)

    contours.forEach((cntr) => {
      let cntrGeom = new THREE.BufferGeometry()
      cntrGeom.vertices = cntr
      let contour = new THREE.Line(
        cntrGeom,
        new THREE.LineBasicMaterial({
          color: Math.random() * 0xffffff //0x777777 + 0x777777
        })
      )
      scene.add(contour)
    })
  }

  function setPointOfIntersection(line, plane, faceIdx) {
    pointOfIntersection = plane.intersectLine(line)
    if (pointOfIntersection) {
      let p = pointOfIntersection.clone()
      p.faceIndex = faceIdx
      p.checked = false
      pointsOfIntersection.vertices.push(p)
    }
  }

  function getContours(points, contours, firstRun) {
    console.log('firstRun:', firstRun)

    let contour = []

    // find first line for the contour
    let firstPointIndex = 0
    let secondPointIndex = 0
    let firstPoint, secondPoint
    for (let i = 0; i < points.length; i++) {
      if (points[i].checked == true) continue
      firstPointIndex = i
      firstPoint = points[firstPointIndex]
      firstPoint.checked = true
      secondPointIndex = getPairIndex(firstPoint, firstPointIndex, points)
      secondPoint = points[secondPointIndex]
      secondPoint.checked = true
      contour.push(firstPoint.clone())
      contour.push(secondPoint.clone())
      break
    }

    contour = getContour(secondPoint, points, contour)
    contours.push(contour)
    let allChecked = 0
    points.forEach((p) => {
      allChecked += p.checked == true ? 1 : 0
    })
    console.log('allChecked: ', allChecked == points.length)
    if (allChecked != points.length) {
      return getContours(points, contours, false)
    }
    return contours
  }

  function getContour(currentPoint, points, contour) {
    let p1Index = getNearestPointIndex(currentPoint, points)
    let p1 = points[p1Index]
    p1.checked = true
    let p2Index = getPairIndex(p1, p1Index, points)
    let p2 = points[p2Index]
    p2.checked = true
    let isClosed = p2.equals(contour[0], tolerance)
    if (!isClosed) {
      contour.push(p2.clone())
      return getContour(p2, points, contour)
    } else {
      contour.push(contour[0].clone())
      return contour
    }
  }

  function getNearestPointIndex(point, points) {
    let index = 0
    for (let i = 0; i < points.length; i++) {
      let p = points[i]
      if (p.checked == false && p.equals(point, tolerance)) {
        index = i
        break
      }
    }
    return index
  }

  function getPairIndex(point, pointIndex, points) {
    let index = 0
    for (let i = 0; i < points.length; i++) {
      let p = points[i]
      if (
        i != pointIndex &&
        p.checked == false &&
        p.faceIndex == point.faceIndex
      ) {
        index = i
        break
      }
    }
    return index
  }

  render()

  function render() {
    requestAnimationFrame(render)
    renderer.render(scene, camera)
  }
}

IntersectionPoints.getLayout = ({ Component: fn, ...rest }) => (
  <PlainCanvasLayout {...rest}>
    <Script fn={fn} />
    <button id="pressMe" style={{ position: 'fixed', top: 0, right: 0 }}>
      pressMe
    </button>
  </PlainCanvasLayout>
)
export default IntersectionPoints
