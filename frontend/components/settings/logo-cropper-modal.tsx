'use client'

import { useState, useRef, useEffect } from 'react'
import { X, ZoomIn, ZoomOut } from 'lucide-react'

interface LogoCropperModalProps {
  imageUrl: string
  onCrop: (croppedImage: string) => void
  onClose: () => void
}

export function LogoCropperModal({ imageUrl, onCrop, onClose }: LogoCropperModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)

  const CIRCLE_SIZE = 300
  const CANVAS_SIZE = 400

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      if (imageRef.current) {
        imageRef.current.src = imageUrl
        setImageLoaded(true)
        centerImage()
      }
    }
    img.src = imageUrl
  }, [imageUrl])

  const centerImage = () => {
    setPosition({ x: 0, y: 0 })
    setZoom(1)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)))
  }

  const handleCrop = () => {
    const canvas = canvasRef.current
    if (!canvas || !imageRef.current) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Create circular clipping path
    ctx.beginPath()
    ctx.arc(CIRCLE_SIZE / 2, CIRCLE_SIZE / 2, CIRCLE_SIZE / 2, 0, Math.PI * 2)
    ctx.clip()

    // Draw the image with applied transformations
    const scale = 300 * zoom
    const offsetX = (CANVAS_SIZE - scale) / 2 + position.x
    const offsetY = (CANVAS_SIZE - scale) / 2 + position.y

    ctx.drawImage(imageRef.current, offsetX, offsetY, scale, scale)

    // Get the cropped image
    const croppedImage = canvas.toDataURL('image/png')
    onCrop(croppedImage)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Adjust your logo
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-gray-600 dark:text-gray-400">
            Pick your best side! We'll typically show your logo as a circular avatar. You can adjust the crop and position of your logo below.
          </p>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Image Preview with Crop Area */}
            <div className="flex-1">
              <div
                ref={containerRef}
                className="relative bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden cursor-move border-4 border-dashed border-gray-300 dark:border-gray-600"
                style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Image */}
                {imageLoaded && (
                  <img
                    ref={imageRef}
                    className="absolute"
                    style={{
                      transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                      cursor: isDragging ? 'grabbing' : 'grab',
                      left: '50%',
                      top: '50%',
                      marginLeft: '-50%',
                      marginTop: '-50%',
                      transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                    }}
                    draggable={false}
                  />
                )}

                {/* Circular Overlay */}
                <svg
                  className="absolute inset-0 pointer-events-none"
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                  style={{ filter: 'drop-shadow(0 0 0 9999px rgba(0, 0, 0, 0.3))' }}
                >
                  <circle
                    cx={CANVAS_SIZE / 2}
                    cy={CANVAS_SIZE / 2}
                    r={CIRCLE_SIZE / 2}
                    fill="white"
                  />
                </svg>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={() => handleZoom(-0.2)}
                  disabled={zoom <= 0.5}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <div className="text-sm text-gray-600 dark:text-gray-400 min-w-12 text-center">
                  {Math.round(zoom * 100)}%
                </div>
                <button
                  onClick={() => handleZoom(0.2)}
                  disabled={zoom >= 3}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className="flex flex-col items-center justify-center gap-6">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Preview
                </p>
                <div className="w-40 h-40 rounded-full border-4 border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                  {imageLoaded && (
                    <img
                      src={imageUrl}
                      alt="Preview"
                      style={{
                        transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                        width: CANVAS_SIZE,
                        height: CANVAS_SIZE,
                        marginLeft: '-50%',
                        marginTop: '-50%',
                      }}
                      className="origin-center"
                    />
                  )}
                </div>
              </div>

              <button
                onClick={centerImage}
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                Reset Position
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCrop}
            className="px-6 py-2.5 bg-primary hover:opacity-90 text-white font-medium rounded-lg transition-colors"
          >
            Upload logo
          </button>
        </div>
      </div>

      {/* Hidden Canvas for Cropping */}
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="hidden"
      />
    </div>
  )
}
