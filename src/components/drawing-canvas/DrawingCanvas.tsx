import React, { useRef, useEffect, useState } from "react"

// Types
import { Mask, Point } from "./types"
import { CameraDetailSettings } from "../../features/camera-settings/cameraSettingsTypes"

interface DrawingCanvasProps {
  imgRef: HTMLImageElement
  onShapeDrawn?: (shape: Mask) => void
  isDrawingEnabled?: boolean
  clearCanvas?: boolean
  selectedRow: CameraDetailSettings | null
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  imgRef,
  onShapeDrawn,
  isDrawingEnabled,
  clearCanvas,
  selectedRow,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [points, setPoints] = useState<Point[]>([])
  const [shapeClosed, setShapeClosed] = useState(false)

  const radiusThreshold = 5

  const canvasToImagePoint = (x: number, y: number): Point => {
    const scaleX = imgRef.naturalWidth / imgRef.width
    const scaleY = imgRef.naturalHeight / imgRef.height

    return {
      x: x * scaleX,
      y: y * scaleY,
    }
  }

  const imageToCanvasPoint = (p: Point): Point => {
    const scaleX = imgRef.width / imgRef.naturalWidth
    const scaleY = imgRef.height / imgRef.naturalHeight

    return {
      x: p.x * scaleX,
      y: p.y * scaleY,
    }
  }

  const handleCanvasClick = (event: React.MouseEvent) => {
    if (!isDrawingEnabled || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const canvasX = event.clientX - rect.left
    const canvasY = event.clientY - rect.top

    const imagePoint = canvasToImagePoint(canvasX, canvasY)
    setPoints(prev => [...prev, imagePoint])
  }

  const arePointsClose = (p1: Point, p2: Point) => {
    const c1 = imageToCanvasPoint(p1)
    const c2 = imageToCanvasPoint(p2)
    const distance = Math.hypot(c1.x - c2.x, c1.y - c2.y)
    return distance <= radiusThreshold
  }

  /** Load saved detection area */
  useEffect(() => {
    if (
      selectedRow?.detection_area &&
      selectedRow.detection_area.trim() !== "{}"
    ) {
      const detectionArea: Mask = JSON.parse(selectedRow.detection_area)
      setPoints(detectionArea.points)
    }
  }, [selectedRow])

  /** Draw canvas */
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (clearCanvas) {
      setPoints([])
      setShapeClosed(false)
      return
    }

    if (points.length === 0) return

    const canvasPoints = points.map(imageToCanvasPoint)

    canvasPoints.forEach((p, index) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
      ctx.fillStyle = "#7e22ce"
      ctx.fill()

      if (index > 0) {
        ctx.beginPath()
        ctx.moveTo(canvasPoints[index - 1].x, canvasPoints[index - 1].y)
        ctx.lineTo(p.x, p.y)
        ctx.strokeStyle = "#7e22ce"
        ctx.lineWidth = 4
        ctx.stroke()
      }
    })

    if (points.length > 2 && arePointsClose(points[0], points[points.length - 1])) {
      ctx.beginPath()
      ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y)
      canvasPoints.forEach(p => ctx.lineTo(p.x, p.y))
      ctx.closePath()
      ctx.fillStyle = "rgba(239,68,68,0.5)"
      ctx.fill()
      setShapeClosed(true)
    }
  }, [points, clearCanvas])

  useEffect(() => {
    if (shapeClosed && points.length > 2 && onShapeDrawn) {
      onShapeDrawn({
        points,
        width: imgRef.naturalWidth,
        height: imgRef.naturalHeight,
      })
      setShapeClosed(false)
    }
  }, [shapeClosed, points, imgRef, onShapeDrawn])

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      className="absolute top-0 left-0 w-full h-full"
      width={imgRef.width}
      height={imgRef.height}
    />
  )
}

export default DrawingCanvas
