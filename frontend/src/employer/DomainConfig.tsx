import { useState } from 'react'
import { updateDomainConfig } from '../api/client'

export default function DomainConfig() {
  const [prompt, setPrompt] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  const save = async () => {
    setLoading(true)
    setSaved(false)
    try {
      await updateDomainConfig(prompt)
      setSaved(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-white text-3xl font-bold mb-2">Domain Config</h1>
      <p className="text-gray-400 mb-6">
        Define what your assistant knows. This becomes the system prompt for all worker conversations.
      </p>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={10}
        placeholder="e.g. You are a quick-commerce assistant for delivery workers."
        className="w-full bg-gray-800 text-white text-lg p-4 rounded-xl mb-4 resize-none"
      />
      <button onClick={save} disabled={loading || !prompt.trim()}
        className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50">
        {loading ? 'Saving...' : 'Save'}
      </button>
      {saved && <p className="text-green-400 mt-3">Saved successfully.</p>}
    </div>
  )
}
