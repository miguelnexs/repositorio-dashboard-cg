import React from 'react'
import { StatCard } from './StatsCards'
import { ChartsPanel } from './Charts'

const DashboardView = ({ stats, seriesA, seriesB, recentOrders, topProducts }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      <StatCard label="Usuarios" value={stats.usersCount} icon="users" tone="cyan" />
      <StatCard label="Productos" value={stats.productsCount} icon="products" tone="indigo" />
      <StatCard label="Activos" value={stats.productsActive} icon="products" tone="emerald" />
      <StatCard label="Categorías" value={stats.categoriesCount} icon="categories" tone="violet" />
      <StatCard label="Clientes" value={stats.clientsTotal} icon="clients" tone="blue" />
      <StatCard label="Pedidos" value={stats.ordersTotal} icon="orders" tone="rose" />
    </div>
    <ChartsPanel seriesA={seriesA} seriesB={seriesB} />
    <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4">
      <div className="text-sm text-gray-200 font-medium">Resumen</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
        <StatCard label="Nuevos clientes (mes)" value={stats.clientsNewMonth} icon="clients" tone="blue" />
        <StatCard label="Ventas hoy" value={stats.salesToday} icon="sales" tone="emerald" />
        <StatCard label="Ventas totales" value={stats.salesTotal} icon="sales" tone="indigo" />
        <StatCard label="Monto ventas" value={Number(stats.salesAmount || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })} icon="sales" tone="violet" />
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4">
        <div className="text-sm text-gray-200 font-medium mb-2">Estado de pedidos</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Pendientes" value={stats.statusCounts?.pending || 0} icon="orders" tone="rose" />
          <StatCard label="Enviados" value={stats.statusCounts?.shipped || 0} icon="orders" tone="indigo" />
          <StatCard label="Entregados" value={stats.statusCounts?.delivered || 0} icon="orders" tone="emerald" />
          <StatCard label="Cancelados" value={stats.statusCounts?.canceled || 0} icon="orders" tone="violet" />
        </div>
      </div>
      <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4">
        <div className="text-sm text-gray-200 font-medium mb-2">Productos más vendidos</div>
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-gradient-to-r from-gray-800 to-gray-700">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-200">Producto</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-200">Cantidad</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-200">Venta total</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800/40 divide-y divide-white/10">
              {(topProducts || []).map((p, i) => (
                <tr key={`${p.name}-${i}`} className="hover:bg-gray-700/50 transition">
                  <td className="px-3 py-2 text-sm text-white">{p.name}</td>
                  <td className="px-3 py-2 text-sm text-gray-300">{p.qty}</td>
                  <td className="px-3 py-2 text-sm text-gray-300">{Number(p.amount || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</td>
                </tr>
              ))}
              {(!topProducts || topProducts.length === 0) && (
                <tr><td colSpan={3} className="px-3 py-2 text-sm text-gray-300">Sin ventas registradas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
)

export default DashboardView
