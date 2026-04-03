import { useEffect, useState } from 'react'
import { listWorkers } from '../api/client'

interface Worker { id: number; phone: string; display_name: string; dialect_code: string }

export default function WorkerList() {
  const [workers, setWorkers] = useState<Worker[]>([])

  useEffect(() => {
    listWorkers().then((r) => setWorkers(r.data))
  }, [])

  return (
    <div>
      <h1 className="text-white text-3xl font-bold mb-6">Workers</h1>
      {workers.length === 0
        ? <p className="text-gray-500">No workers added yet.</p>
        : (
          <table className="w-full text-left text-gray-300">
            <thead><tr className="border-b border-gray-700">
              <th className="pb-2">Phone</th><th className="pb-2">Name</th><th className="pb-2">Dialect</th>
            </tr></thead>
            <tbody>
              {workers.map((w) => (
                <tr key={w.id} className="border-b border-gray-800">
                  <td className="py-3">{w.phone}</td>
                  <td>{w.display_name}</td>
                  <td>{w.dialect_code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </div>
  )
}
