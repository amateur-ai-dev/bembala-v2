import { useEffect, useState } from 'react'
import { listWorkers } from '../api/client'
import { Link } from 'react-router-dom'

interface Worker { id: number; phone: string; display_name: string; dialect_code: string }

const StatCard = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="bg-surface border border-app rounded-2xl px-5 py-5">
    <p className="text-muted text-xs font-medium uppercase tracking-wide">{label}</p>
    <p className="text-app text-3xl font-bold mt-1">{value}</p>
    {sub && <p className="text-muted text-xs mt-1">{sub}</p>}
  </div>
)

export default function Dashboard() {
  const [workers, setWorkers] = useState<Worker[]>([])

  useEffect(() => {
    listWorkers().then((r) => setWorkers(r.data)).catch(() => {})
  }, [])

  return (
    <div className="px-8 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-app text-2xl font-bold">Dashboard</h1>
        <p className="text-muted text-sm mt-1">Overview of your workers and activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Workers" value={workers.length} sub="Registered" />
        <StatCard label="Languages" value={new Set(workers.map(w => w.dialect_code.split('-')[0])).size || 0} sub="Dialects active" />
        <StatCard label="Status" value="Live" sub="All systems normal" />
      </div>

      {/* Recent workers */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-app font-semibold">Recent workers</p>
          <Link to="/employer/workers" className="text-brand-600 text-sm font-medium">
            View all →
          </Link>
        </div>

        {workers.length === 0 ? (
          <div className="bg-surface border border-app rounded-2xl px-6 py-10 text-center">
            <p className="text-muted text-sm">No workers yet. Share your organisation link to get started.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {workers.slice(0, 5).map((w) => (
              <div key={w.id} className="bg-surface border border-app rounded-2xl px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center">
                    <span className="text-brand-700 dark:text-brand-300 text-sm font-bold">
                      {(w.display_name || w.phone).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-app text-sm font-medium">{w.display_name || w.phone}</p>
                    <p className="text-muted text-xs">{w.dialect_code}</p>
                  </div>
                </div>
                <Link to={`/employer/workers/${w.id}/history`} className="text-muted text-xs hover:text-brand-600 transition-colors">
                  History →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
