import React from 'react'
import { API_CONFIG } from '@/config/api'

type PM = { id: number; name: string; provider: string; fee_percent: string | number; currencies: string; active: boolean }

const PaymentMethods: React.FC = () => {
  const [methods, setMethods] = React.useState<PM[]>([])
  const [loading, setLoading] = React.useState(true)
  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_CONFIG.API_URL}/webconfig/public/payments/`, { headers: { 'Content-Type': 'application/json' } })
        const d = await res.json()
        if (Array.isArray(d)) setMethods(d)
      } catch {}
      setLoading(false)
    }
    load()
  }, [])
  if (loading) return null
  if (!methods || methods.length === 0) return null
  return (
    <div className="mt-6">
      <div className="text-sm text-neutral-600 mb-2">Métodos de pago disponibles</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {methods.map((m) => (
          <div key={m.id} className="flex items-center justify-between border rounded px-3 py-2">
            <div>
              <div className="text-sm font-medium text-neutral-800">{m.name}</div>
              <div className="text-xs text-neutral-500">{m.provider} • {m.currencies}</div>
            </div>
            <div className="text-xs text-neutral-600">{Number(m.fee_percent || 0).toFixed(2)}% comisión</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PaymentMethods

