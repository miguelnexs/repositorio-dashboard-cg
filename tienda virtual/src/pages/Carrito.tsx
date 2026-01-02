import React from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '@/contexts/CartContext'
import { Button } from '@/components/ui/button'
import OptimizedImage from '@/components/ui/OptimizedImage'

const Carrito: React.FC = () => {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCart()

  const formatCOP = (n: number) => n.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-light text-neutral-900 mb-6">Carrito de compras</h1>
        {items.length === 0 ? (
          <div className="text-neutral-600">Tu carrito está vacío.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((it) => (
                <div key={`${it.id}-${it.colorId ?? 0}`} className="flex items-center gap-4 bg-white rounded border border-neutral-200 p-3">
                  <div className="w-20 h-20 rounded overflow-hidden bg-gray-50">
                    {it.image ? (
                      <OptimizedImage src={it.image} alt={it.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Sin imagen</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-neutral-900">{it.name}</div>
                    <div className="text-xs text-neutral-500">{it.color ? `Color: ${it.color}` : 'Sin color'}</div>
                    <div className="text-sm text-neutral-800 mt-1">{formatCOP(it.priceNumber)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(it.id, it.colorId, Math.max(1, (it.quantity || 1) - 1))} className="px-2 py-1 border rounded">-</button>
                    <span className="min-w-8 text-center">{it.quantity || 1}</span>
                    <button onClick={() => updateQuantity(it.id, it.colorId, (it.quantity || 1) + 1)} className="px-2 py-1 border rounded">+</button>
                  </div>
                  <Button variant="outline" onClick={() => removeItem(it.id, it.colorId)}>Eliminar</Button>
                </div>
              ))}
            </div>
            <div className="bg-white rounded border border-neutral-200 p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-neutral-600">Artículos</span>
                <span className="font-medium text-neutral-900">{totalItems}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Total</span>
                <span className="font-semibold text-neutral-900">{formatCOP(totalPrice)}</span>
              </div>
              <Link to="/checkout" className="block w-full">
                <Button className="w-full bg-neutral-900 text-white">Proceder al pago</Button>
              </Link>
              <Button variant="outline" className="w-full" onClick={clearCart}>Vaciar carrito</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Carrito
