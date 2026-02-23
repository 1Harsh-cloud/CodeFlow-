import { useRef } from 'react'
import Editor from '@monaco-editor/react'

export default function CodeEditor({ value, onChange, language = 'python', height = 280 }) {
  const editorRef = useRef(null)

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor
    editor.focus()
  }

  return (
    <div className="monaco-container" style={{ height: `${height}px` }}>
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={(v) => onChange(v ?? '')}
        onMount={handleEditorDidMount}
        theme="vs"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          padding: { top: 12 },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          lineNumbers: 'on',
          roundedSelection: true,
        }}
      />
    </div>
  )
}
