import React, { useEffect, useState, useMemo, useRef } from 'react'
import Icon from './Icon'

const Sidebar = ({ view, setView, onSignOut, role, orderNotif, token, apiBase, setUpdateMsg, subscription }) => {
  const [collapsed, setCollapsed] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [companyLogo, setCompanyLogo] = useState('')
  const [clientsStats, setClientsStats] = useState(null)
  const [salesStats, setSalesStats] = useState(null)
  const [configMenuPos, setConfigMenuPos] = useState(null)
  const [inventoryMenuPos, setInventoryMenuPos] = useState(null)
  const [ventasMenuPos, setVentasMenuPos] = useState(null)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [isInventoryOpen, setIsInventoryOpen] = useState(false)
  const [isVentasOpen, setIsVentasOpen] = useState(false)

  const toggleConfigMenu = (e) => {
    e.stopPropagation()
    if (collapsed) {
      if (configMenuPos) {
        setConfigMenuPos(null)
      } else {
        const rect = e.currentTarget.getBoundingClientRect()
        setConfigMenuPos({ top: rect.top, left: rect.right })
        setInventoryMenuPos(null)
        setVentasMenuPos(null)
      }
    } else {
      setIsConfigOpen(!isConfigOpen)
      if (!isConfigOpen) {
        setIsInventoryOpen(false)
        setIsVentasOpen(false)
      }
    }
  }

  const toggleInventoryMenu = (e) => {
    e.stopPropagation()
    if (collapsed) {
      if (inventoryMenuPos) {
        setInventoryMenuPos(null)
      } else {
        const rect = e.currentTarget.getBoundingClientRect()
        setInventoryMenuPos({ top: rect.top, left: rect.right })
        setConfigMenuPos(null)
        setVentasMenuPos(null)
      }
    } else {
      setIsInventoryOpen(!isInventoryOpen)
      if (!isInventoryOpen) {
        setIsConfigOpen(false)
        setIsVentasOpen(false)
      }
    }
  }

  const toggleVentasMenu = (e) => {
    e.stopPropagation()
    if (collapsed) {
      if (ventasMenuPos) {
        setVentasMenuPos(null)
      } else {
        const rect = e.currentTarget.getBoundingClientRect()
        setVentasMenuPos({ top: rect.top, left: rect.right })
        setConfigMenuPos(null)
        setInventoryMenuPos(null)
      }
    } else {
      setIsVentasOpen(!isVentasOpen)
      if (!isVentasOpen) {
        setIsConfigOpen(false)
        setIsInventoryOpen(false)
      }
    }
  }

  const absUrl = (path) => {
    try {
      if (!path) return ''
      if (path.startsWith('http://') || path.startsWith('https://')) return path
      if (path.startsWith('/')) return `${apiBase}${path}`
      return `${apiBase}/${path}`
    } catch { return path }
  }
  useEffect(() => {
    try {
      const s = localStorage.getItem('sidebar_collapsed')
      if (s === '1' || s === '0') setCollapsed(s === '1')
    } catch {}
  }, [])
  useEffect(() => {
    try {
      localStorage.setItem('sidebar_collapsed', collapsed ? '1' : '0')
    } catch {}
  }, [collapsed])
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const headers = token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' }
        const endpoint = token ? `${apiBase}/webconfig/settings/` : `${apiBase}/webconfig/public/settings/`
        const res = await fetch(endpoint, { headers })
        const data = await res.json()
        if (res.ok && data && typeof data.company_name === 'string') {
          setCompanyName(data.company_name || '')
          if (data.logo) setCompanyLogo(absUrl(data.logo))
        }
      } catch {}
    }
    loadSettings()
  }, [token, apiBase])
  useEffect(() => {
    const loadStats = async () => {
      try {
        const headers = token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' }
        const [cRes, sRes] = await Promise.all([
          fetch(`${apiBase}/clients/stats/`, { headers }),
          fetch(`${apiBase}/sales/stats/`, { headers }),
        ])
        const cData = await cRes.json()
        const sData = await sRes.json()
        if (cRes.ok) setClientsStats(cData)
        if (sRes.ok) setSalesStats(sData)
      } catch {}
    }
    loadStats()
  }, [token, apiBase])

  const asideClass = collapsed ? 'w-24' : 'w-64'
  const textClass = collapsed ? 'hidden' : 'inline'
  const tooltipClass = collapsed ? 'absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap px-2 py-1 rounded bg-gray-800 text-white text-xs shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none' : 'hidden'
  const itemBase = `group relative w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-2 px-3 py-2 rounded hover:bg-white/5 transition text-gray-300 hover:text-white`
  const activeClass = 'bg-gradient-to-r from-blue-600/20 to-white/5 text-white ring-1 ring-white/10'
  const toneClasses = (key) => {
    if (key === 'dashboard') return 'bg-blue-600/20 text-blue-300'
    if (key === 'users') return 'bg-cyan-600/20 text-cyan-300'
    if (key === 'inventory') return 'bg-indigo-600/20 text-indigo-300'
    if (key === 'productos') return 'bg-indigo-600/20 text-indigo-300'
    if (key === 'categorias') return 'bg-violet-600/20 text-violet-300'
    if (key === 'clientes') return 'bg-blue-600/20 text-blue-300'
    if (key === 'ventas') return 'bg-emerald-600/20 text-emerald-300'
    if (key === 'pedidos') return 'bg-rose-600/20 text-rose-300'
    if (key === 'web') return 'bg-cyan-600/20 text-cyan-300'
    return 'bg-blue-600/20 text-blue-300'
  }

  const ToggleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )

  return (
    <aside className={`${asideClass} shrink-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 border-r border-white/10 text-gray-200 transition-all duration-200 flex flex-col relative z-50 overflow-y-auto sidebar-scrollbar`}>
      <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {companyLogo ? (
            <img src={companyLogo} alt="Logo" className="w-8 h-8 rounded object-cover border border-white/20 ring-2 ring-white/10" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold ring-2 ring-white/10">
              {(companyName || 'P').charAt(0).toUpperCase()}
            </div>
          )}
          <div className={`${textClass} text-lg font-semibold text-white`}>{companyName || 'Panel'}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-2 rounded hover:bg-gray-800"
            title={collapsed ? 'Expandir' : 'Colapsar'}
          >
            <ToggleIcon />
          </button>
        </div>
      </div>
      <div className="px-4 py-2 border-b border-white/10">
        <div className={`${textClass} text-xs text-gray-300 flex flex-col gap-1`}>
          <div className="flex items-center gap-2">
            <span>Panel {role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Admin' : 'Empleado'}</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full border border-white/10 bg-blue-600/15 text-blue-300 text-[11px]`}>
              {role}
            </span>
          </div>
          {subscription && (
            <div className="flex items-center gap-2 mt-1">
              <span>Plan:</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full border border-white/10 text-[11px] font-medium ${
                subscription.code === 'basic' ? 'bg-blue-600/20 text-blue-300' :
                subscription.code === 'medium' ? 'bg-purple-600/20 text-purple-300' :
                'bg-green-600/20 text-green-300'
              }`}>
                {subscription.name}
              </span>
            </div>
          )}
        </div>
      </div>
      <nav className="p-2 space-y-1" role="navigation" aria-label="Secciones">
        <button className={`${itemBase} ${view === 'dashboard' ? activeClass : ''}`} onClick={() => setView('dashboard')} title="Dashboard" aria-current={view === 'dashboard' ? 'page' : undefined}>
          {view === 'dashboard' && <span className="absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-r" />}
          <span className={`w-12 h-11 rounded-md flex items-center justify-center ${toneClasses('dashboard')} ${view === 'dashboard' ? 'ring-1 ring-white/20' : ''}`}>
            <Icon name="dashboard" className="w-5 h-5" />
          </span>
          <span className={textClass}>Dashboard</span>
          <span className={tooltipClass}>Dashboard</span>
        </button>
        <div className="relative">
          <button className={`${itemBase} ${['ventas', 'caja'].includes(view) ? activeClass : ''}`} onClick={toggleVentasMenu} title="Ventas">
            {['ventas', 'caja'].includes(view) && <span className="absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-r" />}
            <span className={`w-12 h-11 rounded-md flex items-center justify-center ${toneClasses('ventas')} ${['ventas', 'caja'].includes(view) ? 'ring-1 ring-white/20' : ''}`}>
              <Icon name="sales" className="w-5 h-5" />
            </span>
            <span className={textClass}>Ventas</span>
            <span className={tooltipClass}>Ventas</span>
            {!collapsed && (
              <svg className={`w-4 h-4 ml-auto text-gray-400 transition-transform ${ventasMenuPos || isVentasOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
          
          {ventasMenuPos && collapsed && (
            <div 
              style={{ 
                position: 'fixed', 
                top: ventasMenuPos.top, 
                left: ventasMenuPos.left,
                zIndex: 9999
              }}
              className="w-56 bg-gray-900 border border-white/10 rounded-lg shadow-xl py-1 ml-2"
            >
              <button 
                onClick={(e) => { e.stopPropagation(); setView('ventas'); setVentasMenuPos(null); }} 
                className={`w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors ${view === 'ventas' ? 'text-emerald-400 bg-emerald-600/10' : 'text-gray-300 hover:text-white'}`}
              >
                <Icon name="sales" className="w-4 h-4" />
                <span>Nueva Venta</span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setView('caja'); setVentasMenuPos(null); }} 
                className={`w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors ${view === 'caja' ? 'text-emerald-400 bg-emerald-600/10' : 'text-gray-300 hover:text-white'}`}
              >
                <Icon name="sales" className="w-4 h-4" />
                <span>Caja</span>
              </button>
            </div>
          )}

          {isVentasOpen && !collapsed && (
            <div className="mt-1 ml-1 space-y-1 bg-black/20 rounded-md p-1">
              <button 
                onClick={(e) => { e.stopPropagation(); setView('ventas'); }} 
                className={`w-full text-left px-3 py-2 rounded-md hover:bg-white/5 flex items-center gap-3 transition-colors text-sm ${view === 'ventas' ? 'text-emerald-400 bg-emerald-600/10' : 'text-gray-400 hover:text-white'}`}
              >
                <Icon name="sales" className="w-4 h-4" />
                <span>Nueva Venta</span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setView('caja'); }} 
                className={`w-full text-left px-3 py-2 rounded-md hover:bg-white/5 flex items-center gap-3 transition-colors text-sm ${view === 'caja' ? 'text-emerald-400 bg-emerald-600/10' : 'text-gray-400 hover:text-white'}`}
              >
                <Icon name="sales" className="w-4 h-4" />
                <span>Caja</span>
              </button>
            </div>
          )}
        </div>
        <button className={`${itemBase} ${view === 'pedidos' ? activeClass : ''}`} onClick={() => setView('pedidos')} title="Pedidos" aria-current={view === 'pedidos' ? 'page' : undefined}>
          {view === 'pedidos' && <span className="absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-r" />}
          <span className={`w-12 h-11 rounded-md flex items-center justify-center ${toneClasses('pedidos')} ${view === 'pedidos' ? 'ring-1 ring-white/20' : ''} relative`}>
            <Icon name="orders" className="w-5 h-5" />
            {Number(orderNotif || 0) > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center border border-white/20 notification-badge"
                aria-label={`${orderNotif} notificaciones de pedidos sin leer`}
              >
                {Number(orderNotif) > 99 ? '99+' : Number(orderNotif)}
              </span>
            )}
          </span>
          <span className={textClass}>Pedidos</span>
          <span className={tooltipClass}>Pedidos</span>
        </button>
        <button className={`${itemBase} ${view === 'clientes' ? activeClass : ''}`} onClick={() => setView('clientes')} title="Clientes" aria-current={view === 'clientes' ? 'page' : undefined}>
          {view === 'clientes' && <span className="absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-r" />}
          <span className={`w-12 h-11 rounded-md flex items-center justify-center ${toneClasses('clientes')} ${view === 'clientes' ? 'ring-1 ring-white/20' : ''}`}>
            <Icon name="clients" className="w-5 h-5" />
          </span>
          <span className={textClass}>Clientes</span>
          <span className={tooltipClass}>Clientes</span>
        </button>
        <div className="relative">
          <button className={`${itemBase} ${['productos', 'categorias'].includes(view) ? activeClass : ''}`} onClick={toggleInventoryMenu} title="Inventario">
            {['productos', 'categorias'].includes(view) && <span className="absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-r" />}
            <span className={`w-12 h-11 rounded-md flex items-center justify-center ${toneClasses('inventory')} ${['productos', 'categorias'].includes(view) ? 'ring-1 ring-white/20' : ''}`}>
              <Icon name="inventory" className="w-5 h-5" />
            </span>
            <span className={textClass}>Inventario</span>
            <span className={tooltipClass}>Inventario</span>
            {!collapsed && (
              <svg className={`w-4 h-4 ml-auto text-gray-400 transition-transform ${inventoryMenuPos || isInventoryOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
          
          {inventoryMenuPos && collapsed && (
            <div 
              style={{ 
                position: 'fixed', 
                top: inventoryMenuPos.top, 
                left: inventoryMenuPos.left,
                zIndex: 9999
              }}
              className="w-56 bg-gray-900 border border-white/10 rounded-lg shadow-xl py-1 ml-2"
            >
              <button 
                onClick={(e) => { e.stopPropagation(); setView('productos'); setInventoryMenuPos(null); }} 
                className={`w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors ${view === 'productos' ? 'text-indigo-400 bg-indigo-600/10' : 'text-gray-300 hover:text-white'}`}
              >
                <Icon name="products" className="w-4 h-4" />
                <span>Productos</span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setView('categorias'); setInventoryMenuPos(null); }} 
                className={`w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors ${view === 'categorias' ? 'text-violet-400 bg-violet-600/10' : 'text-gray-300 hover:text-white'}`}
              >
                <Icon name="categories" className="w-4 h-4" />
                <span>Categorías</span>
              </button>
            </div>
          )}

          {isInventoryOpen && !collapsed && (
            <div className="mt-1 ml-1 space-y-1 bg-black/20 rounded-md p-1">
              <button 
                onClick={(e) => { e.stopPropagation(); setView('productos'); }} 
                className={`w-full text-left px-3 py-2 rounded-md hover:bg-white/5 flex items-center gap-3 transition-colors text-sm ${view === 'productos' ? 'text-indigo-400 bg-indigo-600/10' : 'text-gray-400 hover:text-white'}`}
              >
                <Icon name="products" className="w-4 h-4" />
                <span>Productos</span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setView('categorias'); }} 
                className={`w-full text-left px-3 py-2 rounded-md hover:bg-white/5 flex items-center gap-3 transition-colors text-sm ${view === 'categorias' ? 'text-violet-400 bg-violet-600/10' : 'text-gray-400 hover:text-white'}`}
              >
                <Icon name="categories" className="w-4 h-4" />
                <span>Categorías</span>
              </button>
            </div>
          )}
        </div>
        {(role === 'super_admin' || (role === 'admin' && subscription?.features?.user_management)) && (
          <button className={`${itemBase} ${view === 'users' ? activeClass : ''}`} onClick={() => setView('users')} title="Usuarios" aria-current={view === 'users' ? 'page' : undefined}>
            {view === 'users' && <span className="absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-r" />}
            <span className={`w-12 h-11 rounded-md flex items-center justify-center ${toneClasses('users')} ${view === 'users' ? 'ring-1 ring-white/20' : ''}`}>
              <Icon name="users" className="w-5 h-5" />
            </span>
            <span className={textClass}>Usuarios</span>
            <span className={tooltipClass}>Usuarios</span>
          </button>
        )}
        {(role === 'admin' || role === 'super_admin') && (
          <div className="relative">
            <button className={`${itemBase} ${['web', 'planes', 'configuracion'].includes(view) ? activeClass : ''}`} onClick={toggleConfigMenu} title="Configuración">
              {(['web', 'planes', 'configuracion'].includes(view)) && <span className="absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-r" />}
              <span className={`w-12 h-11 rounded-md flex items-center justify-center ${toneClasses('web')} ${['web', 'planes', 'configuracion'].includes(view) ? 'ring-1 ring-white/20' : ''}`}>
                <Icon name="settings" className="w-5 h-5" />
              </span>
              <span className={textClass}>Configuración</span>
              <span className={tooltipClass}>Configuración</span>
              {!collapsed && (
                <svg className={`w-4 h-4 ml-auto text-gray-400 transition-transform ${configMenuPos || isConfigOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
            
            {configMenuPos && collapsed && (
              <div 
                style={{ 
                  position: 'fixed', 
                  top: configMenuPos.top, 
                  left: configMenuPos.left,
                  zIndex: 9999
                }}
                className="w-56 bg-gray-900 border border-white/10 rounded-lg shadow-xl py-1 ml-2"
              >
                {(role === 'super_admin' || (role === 'admin' && subscription?.features?.web_store)) && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setView('web'); setConfigMenuPos(null); }} 
                    className={`w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors ${view === 'web' ? 'text-blue-400 bg-blue-600/10' : 'text-gray-300 hover:text-white'}`}
                  >
                    <Icon name="web" className="w-4 h-4" />
                    <span>Página web</span>
                  </button>
                )}
                {role === 'super_admin' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setView('planes'); setConfigMenuPos(null); }} 
                    className={`w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors ${view === 'planes' ? 'text-purple-400 bg-purple-600/10' : 'text-gray-300 hover:text-white'}`}
                  >
                    <Icon name="plans" className="w-4 h-4" />
                    <span>Planes</span>
                  </button>
                )}
                <button 
                  onClick={(e) => { e.stopPropagation(); setView('configuracion'); setConfigMenuPos(null); }} 
                  className={`w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 transition-colors ${view === 'configuracion' ? 'text-blue-400 bg-blue-600/10' : 'text-gray-300 hover:text-white'}`}
                >
                  <Icon name="settings" className="w-4 h-4" />
                  <span>General</span>
                </button>
              </div>
            )}

            {isConfigOpen && !collapsed && (
              <div className="mt-1 ml-1 space-y-1 bg-black/20 rounded-md p-1">
                {(role === 'super_admin' || (role === 'admin' && subscription?.features?.web_store)) && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setView('web'); }} 
                    className={`w-full text-left px-3 py-2 rounded-md hover:bg-white/5 flex items-center gap-3 transition-colors text-sm ${view === 'web' ? 'text-blue-400 bg-blue-600/10' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Icon name="web" className="w-4 h-4" />
                    <span>Página web</span>
                  </button>
                )}
                {role === 'super_admin' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setView('planes'); }} 
                    className={`w-full text-left px-3 py-2 rounded-md hover:bg-white/5 flex items-center gap-3 transition-colors text-sm ${view === 'planes' ? 'text-purple-400 bg-purple-600/10' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Icon name="plans" className="w-4 h-4" />
                    <span>Planes</span>
                  </button>
                )}
                <button 
                  onClick={(e) => { e.stopPropagation(); setView('configuracion'); }} 
                  className={`w-full text-left px-3 py-2 rounded-md hover:bg-white/5 flex items-center gap-3 transition-colors text-sm ${view === 'configuracion' ? 'text-blue-400 bg-blue-600/10' : 'text-gray-400 hover:text-white'}`}
                >
                  <Icon name="settings" className="w-4 h-4" />
                  <span>General</span>
                </button>
              </div>
            )}
          </div>
        )}
      </nav>
      <div className="sticky bottom-0 p-2 bg-gray-950/95 border-t border-white/10">
        <button className="w-full flex items-center gap-3 px-3 py-2 rounded bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 transition" onClick={onSignOut} title="Cerrar sesión">
          <span className="w-8 h-8 rounded-md flex items-center justify-center bg-white/10 text-red-500 border border-white/10">
            <Icon name="logout" />
          </span>
          <span className={textClass}>Cerrar sesión</span>
          <span className={tooltipClass}>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
