import { useRef } from 'react'

export default function FileUpload({ onFileSelect, isLoading }) {
  const inputRef = useRef(null)

  const handleChange = (e) => {
    const file = e.target.files?.[0]
    if (file) onFileSelect(file)
    e.target.value = ''
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-slate-600 mb-2">Upload Code File</h3>
      <div
        onClick={() => !isLoading && inputRef.current?.click()}
        className="flex items-center justify-center gap-3 p-6 rounded-lg border-2 border-dashed border-slate-300 hover:border-indigo-500 cursor-pointer transition-colors bg-slate-50"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".py,.js,.ts,.jsx,.tsx,.html,.css,.java,.c,.cpp,.go,.rs,.rb"
          onChange={handleChange}
          className="hidden"
        />
        <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <span className="text-slate-600">
          {isLoading ? 'Processing...' : 'Click to upload or drag a file'}
        </span>
      </div>
    </div>
  )
}
