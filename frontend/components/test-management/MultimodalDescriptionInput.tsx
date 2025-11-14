'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Image as ImageIcon, Loader2, Info } from 'lucide-react'

interface MultimodalDescriptionInputProps {
  value: string
  onChange: (value: string) => void
  onImagesChange: (images: File[]) => void
  placeholder?: string
  rows?: number
  showImagePaste?: boolean
  maxImages?: number
}

export default function MultimodalDescriptionInput({
  value,
  onChange,
  onImagesChange,
  placeholder = "Describe your project or feature...",
  rows = 6,
  showImagePaste = true,
  maxImages = 5,
}: MultimodalDescriptionInputProps) {
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleImageUpload = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      const imageFiles = fileArray.filter(file => file.type.startsWith('image/'))

      if (images.length + imageFiles.length > maxImages) {
        alert(`You can only upload up to ${maxImages} images`)
        return
      }

      // Create previews
      const newPreviews: string[] = []
      imageFiles.forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => {
          newPreviews.push(reader.result as string)
          if (newPreviews.length === imageFiles.length) {
            setImagePreviews(prev => [...prev, ...newPreviews])
          }
        }
        reader.readAsDataURL(file)
      })

      const newImages = [...images, ...imageFiles]
      setImages(newImages)
      onImagesChange(newImages)
    },
    [images, maxImages, onImagesChange]
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (!showImagePaste) return

      const items = e.clipboardData.items

      const imageItems: File[] = []
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile()
          if (blob) {
            // Create a File object with a proper name
            const file = new File([blob], `pasted-image-${Date.now()}.png`, { type: blob.type })
            imageItems.push(file)
          }
        }
      }

      if (imageItems.length > 0) {
        e.preventDefault()
        handleImageUpload(imageItems)
      }
    },
    [showImagePaste, handleImageUpload]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleImageUpload(e.dataTransfer.files)
      }
    },
    [handleImageUpload]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)

    setImages(newImages)
    setImagePreviews(newPreviews)
    onImagesChange(newImages)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleImageUpload(e.target.files)
    }
  }

  return (
    <div className="space-y-3">
      {/* Info Banner */}
      {showImagePaste && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <strong>Tip:</strong> You can paste screenshots directly (Ctrl/Cmd+V) or drag & drop images into the text area below
          </div>
        </div>
      )}

      {/* Description Field Container (JIRA-style) */}
      <div
        className={`border rounded-lg ${isDragging ? 'ring-2 ring-purple-500 ring-offset-2 border-purple-500 bg-purple-50' : 'border-gray-300 bg-white'} focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={handlePaste}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-4 py-3 bg-transparent border-0 focus:outline-none focus:ring-0 resize-none"
        />

        {/* Image Previews Inside Description Area (JIRA-style) */}
        {imagePreviews.length > 0 && (
          <div className="px-4 pb-3 space-y-3">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative inline-block group max-w-full">
                {/* Image with toolbar like JIRA */}
                <div className="relative border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                  <img
                    src={preview}
                    alt={`Screenshot ${index + 1}`}
                    className="max-w-full h-auto max-h-96 object-contain"
                  />

                  {/* Toolbar below image (JIRA-style) */}
                  <div className="flex items-center justify-between px-3 py-2 bg-gray-800 text-white text-xs">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="flex items-center gap-1 hover:text-purple-300 transition-colors"
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span className="hidden sm:inline">Edit alt text</span>
                      </button>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-300">{images[index]?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="p-1 hover:bg-red-600 rounded transition-colors"
                        title="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-purple-50 bg-opacity-90 rounded-lg pointer-events-none">
            <div className="text-center">
              <Upload className="w-12 h-12 text-purple-600 mx-auto mb-2" />
              <p className="text-purple-700 font-medium">Drop images here</p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Button */}
      {showImagePaste && images.length < maxImages && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 text-sm text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
            Upload Screenshots ({images.length}/{maxImages})
          </button>
        </div>
      )}
    </div>
  )
}
