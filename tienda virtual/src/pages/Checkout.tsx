import React from 'react'
import { useCart } from '@/contexts/CartContext'
import { getImageUrl } from '@/config/api'
import { API_CONFIG } from '@/config/api'
import { Button } from '@/components/ui/button'

const Checkout: React.FC = () => {
  const { items, totalItems, totalPrice, clearCart } = useCart()
  const [methods, setMethods] = React.useState<any[]>([])
  const [pmId, setPmId] = React.useState<number | undefined>(undefined)
  const [client, setClient] = React.useState({ name: '', cedula: '', email: '', phone: '', address: '' })
  const [status, setStatus] = React.useState<'idle'|'loading'|'ok'|'error'>('idle')
  const [msg, setMsg] = React.useState<string | null>(null)

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_CONFIG.API_URL}/webconfig/public/payments/`, { headers: { 'Content-Type': 'application/json' } })
        const d = await res.json()
        if (Array.isArray(d)) setMethods(d)
      } catch {}
    }
    load()
  }, [])

  const formatCOP = (n: number) => n.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })

  const submit = async () => {
    setStatus('loading'); setMsg(null)
    try {
      const payload = {
        items: items.map(it => ({ product_id: it.id, quantity: it.quantity || 1, color_id: it.colorId })),
        client,
        payment_method_id: pmId,
      }
      const res = await fetch(`${API_CONFIG.API_URL}/webconfig/public/checkout/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const d = await res.json()
      if (!res.ok) throw new Error(d.detail || 'Error en checkout')
      setStatus('ok');
      const pm = methods.find((m) => m.id === pmId)
      let extra = ''
      if (pm && pm.provider === 'whatsapp' && pm.whatsapp?.phone) {
        const itemsText = items.map(it => {
          const qty = it.quantity || 1
          const line = (qty * it.priceNumber)
          const img = it.image ? getImageUrl(it.image) : ''
          return `• ${it.name}${it.color ? ` (${it.color})` : ''} × ${qty} = ${formatCOP(line)}${img ? `\n  Imagen: ${img}` : ''}`
        }).join('\n')
        const baseText = pm.whatsapp.template || 'Hola, quiero confirmar mi pago para la orden {order_number} por {total}.\n{items}'
        let text = baseText
          .replace('{order_number}', String(d.order_number))
          .replace('{total}', formatCOP(d.total_amount))
        if (text.includes('{items}')) {
          text = text.replace('{items}', itemsText)
        } else {
          text = `${text}\n${itemsText}`
        }
        const wa = `https://wa.me/${pm.whatsapp.phone.replace(/[^0-9]/g,'')}/?text=${encodeURIComponent(text)}`
        extra = ` · Redirigiendo a WhatsApp...`
        // Redirigir automáticamente a WhatsApp
        window.location.href = wa
      }
      setMsg(`Orden ${d.order_number} creada. Total ${formatCOP(d.total_amount)}${extra ? extra : ''}`)
      clearCart()
    } catch (e: any) {
      setStatus('error'); setMsg(e.message)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded border border-neutral-200 p-4">
            <h2 className="text-lg font-medium text-neutral-900 mb-3">Datos del cliente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={client.name} onChange={e=>setClient({...client,name:e.target.value})} placeholder="Nombre" className="px-3 py-2 border rounded" />
              <input value={client.cedula} onChange={e=>setClient({...client,cedula:e.target.value})} placeholder="Cédula" className="px-3 py-2 border rounded" />
              <input value={client.email} onChange={e=>setClient({...client,email:e.target.value})} placeholder="Email" className="px-3 py-2 border rounded" />
              <input value={client.phone} onChange={e=>setClient({...client,phone:e.target.value})} placeholder="Teléfono" className="px-3 py-2 border rounded" />
              <input value={client.address} onChange={e=>setClient({...client,address:e.target.value})} placeholder="Dirección" className="px-3 py-2 border rounded md:col-span-2" />
            </div>
          </div>
          <div className="bg-white rounded border border-neutral-200 p-4">
            <h2 className="text-lg font-medium text-neutral-900 mb-3">Método de pago</h2>
            <select value={pmId ?? ''} onChange={e=>setPmId(e.target.value?Number(e.target.value):undefined)} className="px-3 py-2 border rounded w-full">
              <option value="">Selecciona método de pago</option>
              {methods.map((m:any)=>(<option key={m.id} value={m.id}>{m.name} ({m.provider})</option>))}
            </select>
          </div>
        </div>
        <div className="space-y-3">
          <div className="bg-white rounded border border-neutral-200 p-4">
            <h2 className="text-lg font-medium text-neutral-900 mb-3">Resumen</h2>
            <div className="space-y-2">
              {items.map(it => (
                <div key={`${it.id}-${it.colorId ?? 0}`} className="flex justify-between text-sm">
                  <span>{it.name} {it.color ? `(${it.color})` : ''} × {it.quantity || 1}</span>
                  <span>{formatCOP((it.quantity||1)*it.priceNumber)}</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCOP(totalPrice)}</span>
              </div>
            </div>
            {msg && (<div className={`mt-3 text-sm ${status==='ok'?'text-green-600':'text-red-600'}`}>{msg}</div>)}
            <Button disabled={status==='loading' || items.length===0} onClick={submit} className="w-full bg-neutral-900 text-white mt-3">{status==='loading'?'Procesando...':'Confirmar compra'}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout
