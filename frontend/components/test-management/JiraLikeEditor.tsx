'use client'

import { useEditor, EditorContent, Editor, NodeViewWrapper, ReactNodeViewRenderer, NodeViewContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Link } from '@tiptap/extension-link'
import { Image } from '@tiptap/extension-image'
import { Placeholder } from '@tiptap/extension-placeholder'
import { TextAlign } from '@tiptap/extension-text-align'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
import { useCallback, useState } from 'react'
import { Node } from '@tiptap/core'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link2,
  Image as ImageIcon,
  List,
  ListOrdered,
  CheckSquare,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Table as TableIcon,
  MoreHorizontal,
  Smile,
  AtSign,
  X,
  Upload,
  Trash2,
  Edit3,
  Download,
  Maximize2,
  Columns,
  Rows,
  Plus,
  Minus,
} from 'lucide-react'

interface JiraLikeEditorProps {
  content: string
  onChange: (content: string) => void
  onImagesChange: (images: File[]) => void
  placeholder?: string
  className?: string
}

// Custom Table Component with Controls (JIRA-style)
const TableWithControls = ({ node, editor, getPos, deleteNode }: any) => {
  const [showTableOptions, setShowTableOptions] = useState(false)
  const [showCellOptions, setShowCellOptions] = useState(false)

  return (
    <NodeViewWrapper className="relative my-4 group">
      {/* Render the actual editable table content */}
      <NodeViewContent className="border-collapse w-full border border-gray-300" />

      {/* Table Controls Below (JIRA-style - always visible) */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 text-white text-xs border-t border-gray-700">
        {/* Table Options Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowTableOptions(!showTableOptions)}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-800 rounded transition-colors"
          >
            <TableIcon className="w-4 h-4" />
            <span>Table options</span>
            <MoreHorizontal className="w-3 h-3" />
          </button>

          {showTableOptions && (
            <div className="absolute left-0 bottom-full mb-2 w-48 bg-white text-gray-800 rounded-lg shadow-xl border border-gray-200 py-1 z-50">
              <button
                onClick={() => {
                  editor.chain().focus().addRowBefore().run()
                  setShowTableOptions(false)
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Add row above
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().addRowAfter().run()
                  setShowTableOptions(false)
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
              >
                <Rows className="w-3.5 h-3.5" />
                Add row below
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().deleteRow().run()
                  setShowTableOptions(false)
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
              >
                <Minus className="w-3.5 h-3.5" />
                Delete row
              </button>
              <div className="border-t border-gray-200 my-1" />
              <button
                onClick={() => {
                  editor.chain().focus().addColumnBefore().run()
                  setShowTableOptions(false)
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Add column before
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().addColumnAfter().run()
                  setShowTableOptions(false)
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
              >
                <Columns className="w-3.5 h-3.5" />
                Add column after
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().deleteColumn().run()
                  setShowTableOptions(false)
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
              >
                <Minus className="w-3.5 h-3.5" />
                Delete column
              </button>
            </div>
          )}
        </div>

        {/* Cell Options Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowCellOptions(!showCellOptions)}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-800 rounded transition-colors"
          >
            <span>Cell options</span>
            <MoreHorizontal className="w-3 h-3" />
          </button>

          {showCellOptions && (
            <div className="absolute left-0 bottom-full mb-2 w-48 bg-white text-gray-800 rounded-lg shadow-xl border border-gray-200 py-1 z-50">
              <button
                onClick={() => {
                  editor.chain().focus().mergeCells().run()
                  setShowCellOptions(false)
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Merge cells
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().splitCell().run()
                  setShowCellOptions(false)
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Split cell
              </button>
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Delete Table Button */}
        <button
          onClick={() => editor.chain().focus().deleteTable().run()}
          className="p-1.5 hover:bg-gray-800 rounded transition-colors"
          title="Delete table"
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      </div>
    </NodeViewWrapper>
  )
}

// Custom Image Component with Controls (JIRA-style)
const ImageWithControls = ({ node, deleteNode, updateAttributes }: any) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isEditingAlt, setIsEditingAlt] = useState(false)
  const [altText, setAltText] = useState(node.attrs.alt || '')

  const handleDelete = () => {
    deleteNode()
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = node.attrs.src
    link.download = node.attrs['data-filename'] || 'image.png'
    link.click()
  }

  const handleViewFullSize = () => {
    window.open(node.attrs.src, '_blank')
  }

  const handleEditAlt = () => {
    setIsEditingAlt(true)
  }

  const handleSaveAlt = () => {
    updateAttributes({ alt: altText })
    setIsEditingAlt(false)
  }

  return (
    <NodeViewWrapper className="relative inline-block my-3 group">
      <div
        className="relative inline-block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image */}
        <img
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          title={node.attrs.title || ''}
          className="max-w-full h-auto rounded-lg border border-gray-300"
          style={{ maxHeight: '400px' }}
        />

        {/* Controls Overlay (JIRA-style) */}
        {isHovered && (
          <div className="absolute inset-0 bg-black bg-opacity-0 rounded-lg">
            {/* Top-right controls */}
            <div className="absolute top-2 right-2 flex gap-1">
              <button
                onClick={handleViewFullSize}
                className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded shadow-lg transition-colors"
                title="View full size"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded shadow-lg transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded shadow-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom toolbar (JIRA-style) */}
            <div className="absolute bottom-0 left-0 right-0 bg-gray-800 bg-opacity-95 px-3 py-2 rounded-b-lg">
              <div className="flex items-center justify-between text-white text-xs">
                <div className="flex items-center gap-2">
                  {isEditingAlt ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={altText}
                        onChange={(e) => setAltText(e.target.value)}
                        placeholder="Alt text"
                        className="px-2 py-1 bg-gray-700 text-white rounded text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveAlt()
                          if (e.key === 'Escape') setIsEditingAlt(false)
                        }}
                      />
                      <button
                        onClick={handleSaveAlt}
                        className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setIsEditingAlt(false)}
                        className="px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={handleEditAlt}
                        className="flex items-center gap-1 hover:text-purple-300 transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit alt text</span>
                      </button>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-300">
                        {node.attrs['data-filename'] || 'image.png'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}

// Custom Table extension with controls (defined outside component)
const CustomTable = Table.extend({
  addNodeView() {
    return ReactNodeViewRenderer(TableWithControls)
  },
})

// Custom Image extension with paste support and controls (defined outside component)
const CustomImage = Node.create({
  name: 'image',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      'data-filename': {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', HTMLAttributes]
  },

  addCommands() {
    return {
      setImage: (options: { src: string; alt?: string; title?: string; 'data-filename'?: string }) => ({ commands }: any) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageWithControls)
  },
})

export default function JiraLikeEditor({
  content,
  onChange,
  onImagesChange,
  placeholder = 'Add a description...',
  className = '',
}: JiraLikeEditorProps) {
  const [uploadedImages, setUploadedImages] = useState<File[]>([])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:underline',
        },
      }),
      CustomImage,
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      CustomTable.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items
        if (!items) return false

        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            event.preventDefault()
            const blob = items[i].getAsFile()
            if (blob) {
              const file = new File([blob], `pasted-image-${Date.now()}.png`, {
                type: blob.type,
              })

              // Read as base64 and insert into editor
              const reader = new FileReader()
              reader.onload = (e) => {
                const base64 = e.target?.result as string

                // Add to uploaded images array using functional setState
                setUploadedImages(prev => {
                  const newImages = [...prev, file]
                  onImagesChange(newImages)
                  return newImages
                })

                editor?.chain().focus().setImage({
                  src: base64,
                  alt: file.name,
                }).run()
              }
              reader.readAsDataURL(blob)
            }
            return true
          }
        }
        return false
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files
        if (!files || files.length === 0) return false

        const imageFiles = Array.from(files).filter((file) =>
          file.type.startsWith('image/')
        )

        if (imageFiles.length > 0) {
          event.preventDefault()
          imageFiles.forEach((file) => {
            const reader = new FileReader()
            reader.onload = (e) => {
              const base64 = e.target?.result as string

              // Add to uploaded images array using functional setState
              setUploadedImages(prev => {
                const newImages = [...prev, file]
                onImagesChange(newImages)
                return newImages
              })

              editor?.chain().focus().setImage({
                src: base64,
                alt: file.name,
              }).run()
            }
            reader.readAsDataURL(file)
          })
          return true
        }
        return false
      },
    },
  })

  const addImage = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (!files) return

      Array.from(files).forEach((file) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          const base64 = event.target?.result as string

          // Add to uploaded images array using functional setState
          setUploadedImages(prev => {
            const newImages = [...prev, file]
            onImagesChange(newImages)
            return newImages
          })

          editor?.chain().focus().setImage({
            src: base64,
            alt: file.name,
          }).run()
        }
        reader.readAsDataURL(file)
      })
    }
    input.click()
  }, [editor, onImagesChange])

  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    if (url === null) return

    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const addTable = useCallback(() => {
    editor
      ?.chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run()
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar - JIRA Style */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('bold') ? 'bg-gray-300' : ''
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('italic') ? 'bg-gray-300' : ''
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('strike') ? 'bg-gray-300' : ''
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('code') ? 'bg-gray-300' : ''
            }`}
            title="Inline Code"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('bulletList') ? 'bg-gray-300' : ''
            }`}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('orderedList') ? 'bg-gray-300' : ''
            }`}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('taskList') ? 'bg-gray-300' : ''
            }`}
            title="Task List"
          >
            <CheckSquare className="w-4 h-4" />
          </button>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive({ textAlign: 'left' }) ? 'bg-gray-300' : ''
            }`}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive({ textAlign: 'center' }) ? 'bg-gray-300' : ''
            }`}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive({ textAlign: 'right' }) ? 'bg-gray-300' : ''
            }`}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>
        </div>

        {/* Insert */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
          <button
            type="button"
            onClick={setLink}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('link') ? 'bg-gray-300' : ''
            }`}
            title="Insert Link"
          >
            <Link2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={addImage}
            className="p-2 rounded hover:bg-gray-200 transition-colors"
            title="Insert Image (or paste/drag & drop)"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={addTable}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('table') ? 'bg-gray-300' : ''
            }`}
            title="Insert Table"
          >
            <TableIcon className="w-4 h-4" />
          </button>
        </div>

        {/* More Options */}
        <button
          type="button"
          className="p-2 rounded hover:bg-gray-200 transition-colors"
          title="More options"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Editor Content */}
      <div className="relative">
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none p-4 min-h-[200px] focus:outline-none jira-editor-content"
        />
      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        .jira-editor-content .ProseMirror {
          outline: none;
          min-height: 200px;
        }

        .jira-editor-content .ProseMirror p.is-editor-empty:first-child::before {
          color: #9ca3af;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }

        .jira-editor-content .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 12px 0;
          border: 1px solid #e5e7eb;
        }

        .jira-editor-content .ProseMirror table {
          border-collapse: collapse;
          margin: 16px 0;
          width: 100%;
        }

        .jira-editor-content .ProseMirror table td,
        .jira-editor-content .ProseMirror table th {
          border: 1px solid #d1d5db;
          padding: 8px 12px;
          min-width: 100px;
        }

        .jira-editor-content .ProseMirror table th {
          background-color: #f3f4f6;
          font-weight: 600;
        }

        .jira-editor-content .ProseMirror code {
          background-color: #f3f4f6;
          border-radius: 4px;
          color: #ef4444;
          font-size: 0.875em;
          padding: 2px 6px;
        }

        .jira-editor-content .ProseMirror pre {
          background-color: #1f2937;
          border-radius: 8px;
          color: #f9fafb;
          font-family: 'JetBrainsMono', 'Courier New', monospace;
          margin: 16px 0;
          padding: 16px;
        }

        .jira-editor-content .ProseMirror pre code {
          background: none;
          color: inherit;
          font-size: 0.875rem;
          padding: 0;
        }

        .jira-editor-content .ProseMirror ul[data-type="taskList"] {
          list-style: none;
          padding: 0;
        }

        .jira-editor-content .ProseMirror ul[data-type="taskList"] li {
          align-items: flex-start;
          display: flex;
        }

        .jira-editor-content .ProseMirror ul[data-type="taskList"] li > label {
          flex: 0 0 auto;
          margin-right: 8px;
          user-select: none;
        }

        .jira-editor-content .ProseMirror ul[data-type="taskList"] li > div {
          flex: 1 1 auto;
        }

        .jira-editor-content .ProseMirror blockquote {
          border-left: 3px solid #d1d5db;
          margin: 16px 0;
          padding-left: 16px;
        }

        .jira-editor-content .ProseMirror a {
          color: #2563eb;
          cursor: pointer;
          text-decoration: underline;
        }

        .jira-editor-content .ProseMirror a:hover {
          text-decoration: none;
        }
      `}</style>
    </div>
  )
}
