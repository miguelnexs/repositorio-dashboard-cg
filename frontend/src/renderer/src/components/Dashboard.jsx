import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../utils/api';
import DashboardView from './dashboard/DashboardView';
const ProductosManager = React.lazy(() => import('./ProductosManager'));
const ProductFormPage = React.lazy(() => import('./ProductFormPage'));
const CategoriesManager = React.lazy(() => import('./CategoriesManager'));
const SalesPage = React.lazy(() => import('./SalesPage'));
const OrdersPage = React.lazy(() => import('./OrdersPage'));
const ClientsPage = React.lazy(() => import('./ClientsPage'));
const WebPageManager = React.lazy(() => import('./WebPageManager'));

const Icon = ({ name, className = 'w-5 h-5' }) => {
  if (name === 'dashboard') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === 'users') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="6.5" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2.5 20c0-3.5 4.5-6 9.5-6s9.5 2.5 9.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M3.5 18.5c0-2 2.8-3.8 6-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === 'products') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 8l9-5 9 5v8l-9 5-9-5V8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M3 8l9 5 9-5M12 3v5M12 13v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === 'categories') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4l8 4-8 4-8-4 8-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M4 12l8 4 8-4M4 16l8 4 8-4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === 'clients') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M14 10h5M14 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === 'sales') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="9" cy="19" r="1.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="17" cy="19" r="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 5h2l2 9h8l2-7H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === 'orders') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7 3h10a2 2 0 012 2v14l-3-2-3 2-3-2-3 2V5a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M9 8h8M9 12h8M9 16h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === 'web') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 12h18M12 3c3.5 3.5 3.5 17.5 0 19M7 5c2 2 2 12 0 14M17 5c-2 2-2 12 0 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === 'logout') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 16l4-4-4-4M17 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 21H5a2 2 0 01-2-2V5a2 2 0 012-2h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  return null;
};

const Sidebar = ({ view, setView, onSignOut, role, orderNotif }) => {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      const s = localStorage.getItem('sidebar_collapsed');
      if (s === '1' || s === '0') setCollapsed(s === '1');
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('sidebar_collapsed', collapsed ? '1' : '0');
    } catch {}
  }, [collapsed]);

  const asideClass = collapsed ? 'w-16' : 'w-64';
  const textClass = collapsed ? 'hidden' : 'inline';
  const tooltipClass = collapsed ? 'absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap px-2 py-1 rounded bg-gray-800 text-white text-xs shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none' : 'hidden';
  const itemBase = `group relative w-full flex items-center ${collapsed ? 'justify-center' : ''} gap-2 px-3 py-2 rounded hover:bg-gray-800 transition`;
  const activeClass = 'bg-gray-800 text-white';

  const ToggleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <aside className={`${asideClass} shrink-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 border-r border-white/10 text-gray-200 transition-all duration-200 flex flex-col`}>
      <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">G</div>
          <div className={`${textClass} text-lg font-semibold text-white`}>GlobeTrek</div>
        </div>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="p-2 rounded hover:bg-gray-800"
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          <ToggleIcon />
        </button>
      </div>
      <div className="px-4 py-2 border-b border-white/10">
        <div className={`${textClass} text-xs text-gray-400`}>Panel {role === 'super_admin' ? 'Super Administrador' : role === 'admin' ? 'Administrador' : 'Empleado'}</div>
      </div>
      <nav className="p-2 space-y-1">
        <button
          className={`${itemBase} ${view === 'dashboard' ? activeClass : ''}`}
          onClick={() => setView('dashboard')}
          title="Dashboard"
        >
          {view === 'dashboard' && <span className="absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-r" />}
          <Icon name="dashboard" />
          <span className={textClass}>Dashboard</span>
          <span className={tooltipClass}>Dashboard</span>
        </button>
        <button
          className={`${itemBase} ${view === 'users' ? activeClass : ''}`}
          onClick={() => setView('users')}
          disabled={role !== 'admin' && role !== 'super_admin'}
          title="Usuarios"
        >
          {view === 'users' && <span className="absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-r" />}
          <Icon name="users" />
          <span className={`${textClass} ${role !== 'admin' && role !== 'super_admin' ? 'opacity-50' : ''}`}>Usuarios</span>
          <span className={tooltipClass}>Usuarios</span>
        </button>
        <button
          className={`${itemBase} ${view === 'productos' ? activeClass : ''}`}
          onClick={() => setView('productos')}
          title="Productos"
        >
          {view === 'productos' && <span className="absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-r" />}
          <Icon name="products" />
          <span className={textClass}>Productos</span>
          <span className={tooltipClass}>Productos</span>
        </button>
        <button
          className={`${itemBase} ${view === 'categorias' ? activeClass : ''}`}
          onClick={() => setView('categorias')}
          title="Categorías"
        >
          {view === 'categorias' && <span className="absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-r" />}
          <Icon name="categories" />
          <span className={textClass}>Categorías</span>
          <span className={tooltipClass}>Categorías</span>
        </button>
        <button
          className={`${itemBase} ${view === 'clientes' ? activeClass : ''}`}
          onClick={() => setView('clientes')}
          title="Clientes"
        >
          {view === 'clientes' && <span className="absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-r" />}
          <Icon name="clients" />
          <span className={textClass}>Clientes</span>
          <span className={tooltipClass}>Clientes</span>
        </button>
        <button
          className={`${itemBase} ${view === 'ventas' ? activeClass : ''}`}
          onClick={() => setView('ventas')}
          title="Ventas"
        >
          {view === 'ventas' && <span className="absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-r" />}
          <Icon name="sales" />
          <span className={textClass}>Ventas</span>
          <span className={tooltipClass}>Ventas</span>
        </button>
        <button
          className={`${itemBase} ${view === 'pedidos' ? activeClass : ''}`}
          onClick={() => setView('pedidos')}
          title="Pedidos"
        >
          {view === 'pedidos' && <span className="absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-r" />}
          <Icon name="orders" />
          <span className={textClass}>Pedidos</span>
          {orderNotif > 0 && (
            <span className="absolute right-2 top-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-blue-600 text-white text-xs">{orderNotif}</span>
          )}
          <span className={tooltipClass}>Pedidos</span>
        </button>
        <button
          className={`${itemBase} ${view === 'web' ? activeClass : ''}`}
          onClick={() => setView('web')}
          title="Página web"
        >
          {view === 'web' && <span className="absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-r" />}
          <Icon name="web" />
          <span className={textClass}>Página web</span>
          <span className={tooltipClass}>Página web</span>
        </button>
      </nav>
      <div className="mt-auto p-2">
        <button
          className="w-full flex items-center gap-2 px-3 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
          onClick={onSignOut}
          title="Cerrar sesión"
        >
          <Icon name="logout" />
          <span className={textClass}>Cerrar sesión</span>
          <span className={tooltipClass}>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
};



const UsersManager = ({ token, apiBase, role }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', first_name: '', last_name: '', email: '', department: '', position: '' });
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', email: '', department: '', position: '', password: '' });
  const [openCreate, setOpenCreate] = useState(false);
  const labels = {
    username: 'Usuario',
    password: 'Contraseña',
    first_name: 'Nombre',
    last_name: 'Apellido',
    email: 'Correo electrónico',
    department: 'Departamento',
    position: 'Cargo',
  };

  const authHeaders = (tkn) => ({ 'Content-Type': 'application/json', ...(tkn ? { Authorization: `Bearer ${tkn}` } : {}) });

  const loadEmployees = async () => {
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/users/api/users/`, { headers: authHeaders(token) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'No se pudieron cargar usuarios');
      setEmployees(data);
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token && (role === 'admin' || role === 'super_admin')) loadEmployees(); }, [token, role]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const handleEditChange = (e) => setEditForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const createEmployee = async (e) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/users/api/users/`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'No se pudo crear el usuario');
      setMsg({ type: 'success', text: `Empleado ${data.username} creado` });
      setForm({ username: '', password: '', first_name: '', last_name: '', email: '', department: '', position: '' });
      loadEmployees();
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const removeEmployee = async (id) => {
    setMsg(null);
    try {
      const res = await fetch(`${apiBase}/users/api/users/${id}/`, { method: 'DELETE', headers: authHeaders(token) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.message || 'No se pudo eliminar');
      setMsg({ type: 'success', text: 'Empleado eliminado' });
      loadEmployees();
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    }
  };

  const startEdit = (emp) => {
    setMsg(null);
    setEditing(emp);
    setEditForm({
      first_name: emp.first_name || '',
      last_name: emp.last_name || '',
      email: emp.email || '',
      department: emp.department || '',
      position: emp.position || '',
      password: ''
    });
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      const res = await fetch(`${apiBase}/users/api/users/${editing.id}/`, {
        method: 'PATCH',
        headers: authHeaders(token),
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'No se pudo actualizar');
      setMsg({ type: 'success', text: 'Empleado actualizado' });
      setEditing(null);
      loadEmployees();
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    }
  };

  if (role !== 'admin' && role !== 'super_admin') {
    return (
      <div className="bg-yellow-600/20 text-yellow-200 border border-yellow-500/40 p-4 rounded">
        Solo administradores pueden gestionar usuarios.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {msg && (
        <div className={`p-3 rounded text-sm ${msg.type === 'success' ? 'bg-green-600/20 text-green-200 border border-green-500/40' : 'bg-red-600/20 text-red-200 border border-red-500/40'}`}>
          {msg.text}
        </div>
      )}
      <div className="bg-white/5 border border-white/10 rounded p-4">
        <div className="flex items-center justify-between">
          <div className="text-white font-medium">Crear nuevo empleado</div>
          <button onClick={() => { setForm({ username: '', password: '', first_name: '', last_name: '', email: '', department: '', position: '' }); setOpenCreate(true); }} className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white">Nuevo</button>
        </div>
      </div>
      <div className="bg-white/5 border border-white/10 rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-white font-medium">Empleados</div>
          <button onClick={loadEmployees} className="px-2 py-1 text-xs rounded bg-gray-600 hover:bg-gray-700 text-white">Recargar</button>
        </div>
        <ul className="space-y-2">
          {employees.map((emp) => (
            <li key={emp.id} className="flex items-center justify-between bg-gray-700/50 border border-gray-600 rounded p-2 text-sm text-white">
              <span className="flex-1">
                <span className="font-medium">{emp.username}</span>
                <span className="text-gray-300 ml-2">{emp.first_name} {emp.last_name}</span>
                <span className="text-gray-400 ml-2 text-xs">{emp.email}</span>
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => startEdit(emp)} className="px-2 py-1 text-xs rounded bg-indigo-600 hover:bg-indigo-700 text-white">Editar</button>
                <button onClick={() => removeEmployee(emp.id)} className="px-2 py-1 text-xs rounded bg-red-600 hover:bg-red-700 text-white">Eliminar</button>
              </div>
            </li>
          ))}
          {employees.length === 0 && (
            <li className="text-gray-300 text-sm">No hay empleados registrados.</li>
          )}
        </ul>
      </div>
      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-white/10 rounded p-4 w-full max-w-lg">
            <div className="text-white font-medium mb-3">Editar usuario: {editing.username}</div>
            <form onSubmit={submitEdit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {['first_name','last_name','email','department','position','password'].map((field) => (
                <div key={field} className="flex flex-col gap-1">
                  <span className="text-xs text-gray-300">{labels[field]}</span>
                  <input
                    type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                    name={field}
                    value={editForm[field]}
                    onChange={handleEditChange}
                    className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={labels[field]}
                  />
                </div>
              ))}
              <div className="col-span-1 md:col-span-2 flex items-center justify-end gap-2 mt-2">
                <button type="button" onClick={() => setEditing(null)} className="px-3 py-2 rounded bg-gray-600 hover:bg-gray-700 text-white">Cancelar</button>
                <button type="submit" className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white">Guardar cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {openCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-white/10 rounded p-4 w-full max-w-lg">
            <div className="text-white font-medium mb-3">Nuevo usuario</div>
            <form onSubmit={(e) => { createEmployee(e); if (!loading) setOpenCreate(false); }} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {['username','password','first_name','last_name','email','department','position'].map((field) => (
                <div key={field} className="flex flex-col gap-1">
                  <span className="text-xs text-gray-300">{labels[field]}</span>
                  <input
                    type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                    name={field}
                    value={form[field]}
                    onChange={handleChange}
                    required={field === 'username' || field === 'password'}
                    className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={labels[field]}
                  />
                </div>
              ))}
              <div className="col-span-1 md:grid-cols-2 flex items-center justify-end gap-2 mt-2">
                <button type="button" onClick={() => setOpenCreate(false)} className="px-3 py-2 rounded bg-gray-600 hover:bg-gray-700 text-white">Cancelar</button>
                <button type="submit" disabled={loading} className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50">{loading ? 'Creando...' : 'Crear usuario'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};



const Dashboard = ({ token, role, userId, onSignOut }) => {
  const apiBase = API_BASE_URL;
  const [view, setView] = useState('dashboard');
  const [orderNotif, setOrderNotif] = useState(0);
  const [navLoading, setNavLoading] = useState(false);
  const [productEditing, setProductEditing] = useState(null);
  const [stats, setStats] = useState({ usersCount: 0, productsCount: 0, productsActive: 0, categoriesCount: 0, clientsTotal: 0, ordersTotal: 0, clientsNewMonth: 0, salesToday: 0, salesTotal: 0, salesAmount: 0, statusCounts: {} });
  const [seriesA, setSeriesA] = useState([3, 5, 4, 6, 8, 7, 9]);
  const [seriesB, setSeriesB] = useState([5, 3, 6, 2, 4, 7]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${apiBase}/users/api/users/`, { headers }).then((res) => res.json().then((d) => ({ ok: res.ok, d })) ),
      fetch(`${apiBase}/products/`, { headers }).then((res) => res.json().then((d) => ({ ok: res.ok, d })) ),
      fetch(`${apiBase}/products/categories/?page_size=1`, { headers }).then((res) => res.json().then((d) => ({ ok: res.ok, d })) ),
      fetch(`${apiBase}/clients/stats/`, { headers }).then((res) => res.json().then((d) => ({ ok: res.ok, d })) ),
      fetch(`${apiBase}/sales/list/?page_size=5`, { headers }).then((res) => res.json().then((d) => ({ ok: res.ok, d })) ),
      fetch(`${apiBase}/sales/stats/`, { headers }).then((res) => res.json().then((d) => ({ ok: res.ok, d })) ),
    ]).then(([usersRes, productsRes, catsRes, clientsStats, ordersRes, salesStats]) => {
      const usersCount = usersRes.ok && Array.isArray(usersRes.d) ? usersRes.d.length : 0;
      const products = productsRes.ok && Array.isArray(productsRes.d) ? productsRes.d : [];
      const productsCount = products.length;
      const productsActive = products.filter((p) => !!p.active).length;
      const categoriesCount = catsRes.ok ? Number(catsRes.d.count || 0) : 0;
      const clientsTotal = clientsStats.ok ? Number(clientsStats.d.total || 0) : 0;
      const clientsNewMonth = clientsStats.ok ? Number(clientsStats.d.new_this_month || 0) : 0;
      const ordersTotal = ordersRes.ok ? Number(ordersRes.d.count || 0) : 0;
      const salesToday = salesStats.ok ? Number(salesStats.d.today_sales || 0) : 0;
      const salesTotal = salesStats.ok ? Number(salesStats.d.total_sales || 0) : 0;
      const salesAmount = salesStats.ok ? Number(salesStats.d.total_amount || 0) : 0;
      
      setRecentOrders(ordersRes.ok && Array.isArray(ordersRes.d.results) ? ordersRes.d.results : []);
      // Placeholder for topProducts if not available
      setTopProducts([]); 

      setStats({ 
        usersCount, productsCount, productsActive, categoriesCount, clientsTotal, ordersTotal, 
        clientsNewMonth, salesToday, salesTotal, salesAmount,
        statusCounts: { pending: 0, shipped: 0, delivered: 0, canceled: 0 } // Default values as we don't have this data yet
      });
    }).catch(() => {});
  }, [token]);

  useEffect(() => {
    let active = true;
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    const poll = () => {
      fetch(`${apiBase}/sales/notifications/count/`, { headers })
        .then((res) => res.json())
        .then((d) => { if (active) setOrderNotif(Number(d.unread || 0)); })
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => { active = false; clearInterval(id); };
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex">
        <Sidebar view={view} setView={(v) => { setNavLoading(true); setView(v); setTimeout(() => setNavLoading(false), 800); if (v === 'pedidos') { const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }; fetch(`${apiBase}/sales/notifications/read/`, { method: 'POST', headers }).then(() => setOrderNotif(0)).catch(() => setOrderNotif(0)); } }} onSignOut={onSignOut} role={role} orderNotif={orderNotif} />
      <main className="flex-1 p-6 space-y-6 relative">
        {navLoading && (
          <div className="absolute inset-0 z-40 bg-gray-900 flex items-center justify-center">
            <div className="bg-gray-800/80 border border-white/10 rounded-xl p-5 shadow-xl text-center">
              <div className="mx-auto w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <div className="mt-2 text-white text-sm">Cargando vista...</div>
            </div>
          </div>
        )}
        <div className={`${navLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-white">{view === 'dashboard' ? 'Dashboard' : view === 'users' ? 'Gestión de usuarios' : view === 'productos' ? 'Productos' : view === 'categorias' ? 'Categorías' : view === 'clientes' ? 'Clientes' : view === 'ventas' ? 'Ventas' : view === 'web' ? 'Página web' : 'Pedidos'}</h1>
            <div className="text-sm text-gray-300">Rol: <span className="font-medium">{role}</span></div>
          </div>
          {view === 'dashboard' && (
            <DashboardView stats={stats} seriesA={seriesA} seriesB={seriesB} recentOrders={recentOrders} topProducts={topProducts} />
          )}
        <React.Suspense fallback={<div className="text-white text-sm">Cargando módulo...</div>}>
          {view === 'users' && (
            <UsersManager token={token} apiBase={apiBase} role={role} />
          )}
          {view === 'productos' && (
            <ProductosManager
              token={token}
              apiBase={apiBase}
              onCreate={() => { setProductEditing(null); setView('producto_form'); }}
              onEdit={(p) => { setProductEditing(p); setView('producto_form'); }}
            />
          )}
          {view === 'producto_form' && (
            <ProductFormPage
              token={token}
              apiBase={apiBase}
              product={productEditing}
              onCancel={() => setView('productos')}
              onSaved={() => setView('productos')}
            />
          )}
          {view === 'categorias' && (
            <CategoriesManager token={token} apiBase={apiBase} role={role} />
          )}
          {view === 'clientes' && (
            <ClientsPage token={token} apiBase={apiBase} />
          )}
          {view === 'ventas' && (
            <SalesPage token={token} apiBase={apiBase} onSaleCreated={() => setOrderNotif((n) => n + 1)} />
          )}
          {view === 'web' && (
            <WebPageManager token={token} apiBase={apiBase} adminId={userId} role={role} setView={(v) => setView(v)} setProductEditing={(p) => { setProductEditing(p); setView('producto_form'); }} />
          )}
          {view === 'pedidos' && (
            <OrdersPage token={token} apiBase={apiBase} />
          )}
        </React.Suspense>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
