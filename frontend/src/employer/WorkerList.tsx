import { useEffect, useState } from 'react'
import { listWorkers } from '../api/client'
import { Link } from 'react-router-dom'

interface Worker { id: number; phone: string; display_name: string; dialect_code: string }

export default function WorkerList() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    listWorkers().then((r) => setWorkers(r.data)).catch(() => {})
  }, [])

  const filtered = workers.filter(
    (w) =>
      w.phone.includes(search) ||
      (w.display_name || '').toLowerCase().includes(search.toLowerCase()) ||
      w.dialect_code.includes(search)
  )

  return (
    <div className="px-8 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-app text-2xl font-bold">Workers</h1>
        <p className="text-muted text-sm mt-1">{workers.length} registered</p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 bg-surface border border-app rounded-xl px-4 py-3 mb-5">
        <svg className="w-4 h-4 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by phone, name or dialect"
          className="flex-1 bg-transparent text-app text-sm outline-none placeholder:text-muted"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-surface border border-app rounded-2xl px-6 py-10 text-center">
          <p className="text-muted text-sm">
            {workers.length === 0 ? 'No workers yet.' : 'No results found.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((w) => (
            <div key={w.id} className="bg-surface border border-app rounded-2xl px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-700 dark:text-brand-300 font-bold">
                    {(w.display_name || w.phone).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-app font-medium">{w.display_name || '—'}</p>
                  <p className="text-muted text-sm">{w.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs bg-app border border-app text-muted px-2.5 py-1 rounded-lg font-mono">
                  {w.dialect_code}
                </span>
                <Link
                  to={`/employer/workers/${w.id}/history`}
                  className="text-brand-600 text-sm font-medium hover:underline"
                >
                  History
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
