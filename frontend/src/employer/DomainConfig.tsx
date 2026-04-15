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
    <div className="px-8 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-app text-2xl font-bold">Domain Config</h1>
        <p className="text-muted text-sm mt-1">
          This becomes the system prompt for all worker conversations. Write it as if briefing the AI on your business.
        </p>
      </div>

      <div className="bg-surface border border-app rounded-2xl p-1 mb-4">
        <textarea
          value={prompt}
          onChange={(e) => { setPrompt(e.target.value); setSaved(false) }}
          rows={12}
          placeholder={`e.g. You are a helpful assistant for delivery workers at Swiggy Instamart Koramangala. Workers may ask about shift timings, pickup locations, payout queries, and escalation processes. Always respond in the worker's language.`}
          className="w-full bg-transparent text-app text-sm leading-relaxed p-4 outline-none resize-none placeholder:text-muted"
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={save}
          disabled={loading || !prompt.trim()}
          className="bg-brand-600 text-white px-6 py-3 rounded-xl font-semibold text-sm disabled:opacity-40 active:scale-[0.98] transition-transform"
        >
          {loading ? 'Saving...' : 'Save config'}
        </button>
        {saved && (
          <div className="flex items-center gap-1.5 text-brand-600 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Saved
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="mt-8 bg-brand-50 dark:bg-[var(--brand-light)] border border-brand-200 dark:border-brand-800 rounded-2xl px-5 py-4">
        <p className="text-app text-sm font-semibold mb-2">Tips for a good config</p>
        <ul className="text-muted text-sm flex flex-col gap-1.5 list-disc list-inside">
          <li>Describe your business and worker roles</li>
          <li>List common questions workers ask</li>
          <li>Mention any policies (shift, pay, escalation)</li>
          <li>Say which language to respond in</li>
        </ul>
      </div>
    </div>
  )
}
