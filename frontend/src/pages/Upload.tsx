import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadDocument } from '../api/documents'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function Upload() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = (f) => {
    if (f && f.type === 'application/pdf') {
      setFile(f)
      if (!title) setTitle(f.name.replace('.pdf', ''))
      setError('')
    } else {
      setError('Only PDF files are allowed')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return setError('Please select a PDF file')

    setLoading(true)
    setError('')
    const formData = new FormData()
    formData.append('document', file)
    formData.append('title', title)

    try {
      await uploadDocument(formData)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-4 sm:px-6 lg:px-8 pt-24 pb-12">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Upload Document</h1>
      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); if(e.dataTransfer.files) handleFile(e.dataTransfer.files[0]) }}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={e => { if (e.target.files) handleFile(e.target.files[0]) }}
          />
          {file ? (
            <div>
              <p className="text-gray-900 font-medium">{file.name}</p>
              <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
          ) : (
            <div>
              <p className="text-gray-500">Drag & drop a PDF here, or click to select</p>
              <p className="text-sm text-gray-400 mt-1">Max 50MB</p>
            </div>
          )}
        </div>

        <Input
          label="Document Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Enter a title for your document"
        />

        <Button type="submit" disabled={loading || !file} className="w-full">
          {loading ? 'Uploading...' : 'Upload'}
        </Button>
      </form>
    </div>
  )
}
