# TipTap 富文本编辑器：自定义插件开发

## 前言

TipTap 是一个基于 ProseMirror 的现代化富文本编辑器框架，提供了强大的扩展性和自定义能力。本文将通过一个实际的 RichEditor 项目，带你深入了解 TipTap 的使用方法和自定义插件开发。

## 一、TipTap 基础概念

### 什么是 TipTap？

TipTap 是一个无头（headless）富文本编辑器框架，它提供了：
- 基于 ProseMirror 的强大编辑能力
- 模块化的扩展系统
- React/Vue 等框架的良好集成
- 完整的 TypeScript 支持

### 核心概念

1. **Editor**：编辑器实例，管理整个编辑状态
2. **Extensions**：扩展插件，提供各种功能
3. **Nodes**：文档结构的基本单元（段落、标题等）
4. **Marks**：文本样式标记（粗体、斜体等）
5. **Commands**：操作命令，用于修改文档

## 二、快速开始：创建一个基础编辑器

```typescript
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

const BasicEditor = () => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Hello World!</p>',
    onUpdate: ({ editor }) => {
      console.log('Content:', editor.getHTML())
    }
  })

  return <EditorContent editor={editor} />
}
```

## 三、内容操作：获取和设置编辑器内容

### 获取内容的多种方式

```typescript
const editor = useEditor({
  extensions: [StarterKit],
  content: '<p>Hello World!</p>'
})

// 获取 HTML 内容
const html = editor.getHTML()

// 获取纯文本内容
const text = editor.getText()

// 获取 JSON 结构
const json = editor.getJSON()

// 获取 Markdown（需要扩展）
const markdown = editor.storage.markdown.getMarkdown()
```

### 设置内容的方法

```typescript
// 设置 HTML 内容
editor.commands.setContent('<p>New content</p>')

// 设置纯文本内容
editor.commands.setContent('Plain text content', false)

// 插入内容到光标位置
editor.commands.insertContent('<strong>Bold text</strong>')

// 清空内容
editor.commands.clearContent()
```

## 四、自定义插件开发实战

### 示例1：创建高亮文本插件

```typescript
import { Mark, mergeAttributes } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    highlight: {
      setHighlight: (color?: string) => ReturnType
      toggleHighlight: (color?: string) => ReturnType
      unsetHighlight: () => ReturnType
    }
  }
}

export const Highlight = Mark.create({
  name: 'highlight',
  
  addOptions() {
    return {
      HTMLAttributes: {},
      colors: ['yellow', 'green', 'blue', 'pink', 'purple']
    }
  },
  
  addAttributes() {
    return {
      color: {
        default: 'yellow',
        parseHTML: element => element.getAttribute('data-color'),
        renderHTML: attributes => ({
          'data-color': attributes.color,
          style: `background-color: ${attributes.color}`
        })
      }
    }
  },
  
  parseHTML() {
    return [{ tag: 'mark' }]
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['mark', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },
  
  addCommands() {
    return {
      setHighlight:
        (color = 'yellow') =>
        ({ commands }) => commands.setMark(this.name, { color }),
      toggleHighlight:
        (color = 'yellow') =>
        ({ commands }) => commands.toggleMark(this.name, { color }),
      unsetHighlight:
        () =>
        ({ commands }) => commands.unsetMark(this.name)
    }
  },
  
  addKeyboardShortcuts() {
    return {
      'Mod-Shift-h': () => this.editor.commands.toggleHighlight()
    }
  }
})
```

### 示例2：图片占位符插件（高级）

这个插件实现了上传图片时显示占位符，上传完成后自动替换为真实图片的功能：

```typescript
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'

export const ImagePlaceholder = Node.create({
  name: 'imagePlaceholder',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      placeholderId: {
        default: () => `placeholder-${Date.now()}-${Math.random()}`
      },
      uploadStatus: {
        default: 'pending' // pending, uploading, success, error
      },
      progress: {
        default: 0
      }
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="image-placeholder"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-type': 'image-placeholder'
    })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImagePlaceholderComponent)
  },

  addCommands() {
    return {
      insertImagePlaceholder:
        (uploadPromise) =>
        ({ commands }) => {
          const placeholderId = `placeholder-${Date.now()}-${Math.random()}`
          
          commands.insertContent({
            type: this.name,
            attrs: { placeholderId, uploadStatus: 'pending', progress: 0 }
          })

          if (uploadPromise) {
            this.handleUpload(placeholderId, uploadPromise)
          }

          return true
        },

      updatePlaceholderImage:
        (placeholderId: string, imageUrl: string) =>
        ({ tr, state, dispatch }) => {
          let found = false
          state.doc.descendants((node, pos) => {
            if (node.type === this.type && node.attrs.placeholderId === placeholderId) {
              if (dispatch) {
                const imageNode = state.schema.nodes.image.create({
                  src: imageUrl,
                  alt: 'Uploaded image'
                })
                tr.replaceWith(pos, pos + node.nodeSize, imageNode)
              }
              found = true
              return false
            }
            return true
          })
          return found
        }
    }
  },

  handleUpload(placeholderId: string, uploadPromise: Promise<string>) {
    // 更新状态为上传中
    this.editor?.commands.updateAttributes(this.name, {
      placeholderId,
      uploadStatus: 'uploading',
      progress: 0
    })

    uploadPromise
      .then(imageUrl => {
        // 上传成功，替换为真实图片
        this.editor?.commands.updatePlaceholderImage(placeholderId, imageUrl)
      })
      .catch(error => {
        // 上传失败
        this.editor?.commands.updateAttributes(this.name, {
          placeholderId,
          uploadStatus: 'error',
          progress: 0
        })
      })
  }
})
```

## 五、React 组件集成

### 创建编辑器组件

```typescript
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Highlight } from './extensions/highlight'
import { ImagePlaceholder } from './extensions/image-placeholder'

const RichEditor = () => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight.configure({
        colors: ['yellow', 'green', 'blue', 'red']
      }),
      ImagePlaceholder
    ],
    content: '<p>Start writing...</p>',
    onUpdate: ({ editor }) => {
      const content = editor.getHTML()
      console.log('Content updated:', content)
    }
  })

  return (
    <div className="editor-container">
      <div className="toolbar">
        <button onClick={() => editor?.chain().focus().toggleHighlight('yellow').run()}>
          高亮
        </button>
        <button onClick={() => editor?.chain().focus().insertImagePlaceholder().run()}>
          插入图片
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
```

## 六、高级功能实现

### 1. 图片上传处理

```typescript
const handleImageUpload = async (file: File) => {
  // 创建上传 Promise
  const uploadPromise = new Promise<string>(async (resolve, reject) => {
    try {
      const formData = new FormData()
      formData.append('image', file)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('Upload failed')
      }
      
      const data = await response.json()
      resolve(data.imageUrl)
    } catch (error) {
      reject(error)
    }
  })

  // 插入占位符并开始上传
  editor?.commands.insertImagePlaceholder(uploadPromise)
}
```

### 2. 内容验证和格式化

```typescript
const validateAndSetContent = (content: string) => {
  try {
    // 验证内容长度
    if (content.length > 50000) {
      throw new Error('内容过长，最大支持 50,000 字符')
    }
    
    // 验证 HTML 结构
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = content
    
    // 移除危险标签
    const dangerousTags = tempDiv.querySelectorAll('script, iframe, object')
    dangerousTags.forEach(tag => tag.remove())
    
    // 设置清理后的内容
    editor.commands.setContent(tempDiv.innerHTML)
    
  } catch (error) {
    console.error('内容验证失败:', error)
    // 显示错误提示
  }
}
```

### 3. 自动保存功能

```typescript
const useAutoSave = (editor: Editor | null, delay: number = 3000) => {
  useEffect(() => {
    if (!editor) return

    const handleUpdate = debounce(() => {
      const content = editor.getHTML()
      localStorage.setItem('editor-content', content)
      console.log('内容已自动保存')
    }, delay)

    editor.on('update', handleUpdate)

    return () => {
      editor.off('update', handleUpdate)
    }
  }, [editor, delay])
}

// 恢复保存的内容
const restoreContent = (editor: Editor) => {
  const savedContent = localStorage.getItem('editor-content')
  if (savedContent) {
    editor.commands.setContent(savedContent)
  }
}
```

## 七、性能优化技巧

### 1. 延迟加载扩展

```typescript
const LazyLoadedEditor = () => {
  const [extensions, setExtensions] = useState([])

  useEffect(() => {
    // 动态导入扩展
    Promise.all([
      import('@tiptap/starter-kit').then(m => m.default),
      import('./extensions/highlight').then(m => m.Highlight)
    ]).then(([StarterKit, Highlight]) => {
      setExtensions([
        StarterKit,
        Highlight
      ])
    })
  }, [])

  const editor = useEditor({
    extensions,
    content: '<p>Loading...</p>'
  })

  return <EditorContent editor={editor} />
}
```

### 2. 虚拟滚动处理大量内容

```typescript
const VirtualizedEditor = ({ content }: { content: string }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none'
      }
    }
  })

  // 使用虚拟滚动库处理大量内容
  return (
    <VirtualScroll
      height={600}
      itemCount={editor?.state.doc.content.size || 0}
      itemSize={35}
    >
      {({ index, style }) => (
        <div style={style}>
          <EditorContent editor={editor} />
        </div>
      )}
    </VirtualScroll>
  )
}
```




