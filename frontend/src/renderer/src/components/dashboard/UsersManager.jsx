import React, { useEffect, useState } from 'react'
import { StatCard } from './StatsCards'

const UsersManager = ({ token, apiBase, role, createSignal, openSaFormSignal }) => {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [form, setForm] = useState({ username: '', password: '', first_name: '', last_name: '', email: '', department: '', position: '' })
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', email: '', department: '', position: '', password: '' })
  const [openCreate, setOpenCreate] = useState(false)
  const [saUsername, setSaUsername] = useState('')
  const [saPassword, setSaPassword] = useState('')
  const [saRole, setSaRole] = useState('admin')
  const [saCreating, setSaCreating] = useState(false)
  const [saMsg, setSaMsg] = useState(null)
  const [tenants, setTenants] = useState([])
  const [saTenantId, setSaTenantId] = useState('')
  const [showSAForm, setShowSAForm] = useState(false)
  const labels = {
    username: 'Usuario',
    password: 'Contraseña',
    first_name: 'Nombre',
    last_name: 'Apellido',
    email: 'Correo electrónico',
    department: 'Departamento',
    position: 'Cargo',
  }

  const authHeaders = (tkn) => ({ 'Content-Type': 'application/json', ...(tkn ? { Authorization: `Bearer ${tkn}` } : {}) })

  const loadEmployees = async () => {
    setMsg(null)
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/users/api/users/?page_size=1000`, { headers: authHeaders(token) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'No se pudieron cargar usuarios')
      const list = Array.isArray(data) ? data : Array.isArray(data.results) ? data.results : (Array.isArray(data.items) ? data.items : [])
      setEmployees(list)
    } catch (e) {
      setMsg({ type: 'error', text: e.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (token && (role === 'admin' || role === 'super_admin')) loadEmployees() }, [token, role])
  useEffect(() => { if (token && role === 'super_admin') { fetch(`${apiBase}/users/api/admin/tenants/`, { headers: authHeaders(token) }).then((res) => res.json().then((d) => ({ ok: res.ok, d }))).then(({ ok, d }) => { if (ok && Array.isArray(d)) setTenants(d) }).catch(() => {}) } }, [token, role])
  useEffect(() => { if (role === 'admin' && createSignal > 0) { setForm({ username: '', password: '', first_name: '', last_name: '', email: '', department: '', position: '' }); setOpenCreate(true) } }, [createSignal, role])
  useEffect(() => { if (role === 'super_admin' && openSaFormSignal > 0) { setSaRole('employee'); setShowSAForm(true) } }, [openSaFormSignal, role])

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  const handleEditChange = (e) => setEditForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const createEmployee = async (e) => {
    e.preventDefault()
    setMsg(null)
    setLoading(true)
    try {
      const payload = { ...form, role: 'employee' }
      const res = await fetch(`${apiBase}/users/api/users/`, { method: 'POST', headers: authHeaders(token), body: JSON.stringify(payload) })
      let data = null
      try { data = await res.json() } catch {}
      if (!res.ok) throw new Error((data && (data.detail || data.message)) || `Error ${res.status}`)
      setMsg({ type: 'success', text: `Empleado ${data.username || form.username} creado` })
      setForm({ username: '', password: '', first_name: '', last_name: '', email: '', department: '', position: '' })
      setTimeout(() => { loadEmployees() }, 400)
    } catch (e) {
      setMsg({ type: 'error', text: e.message })
    } finally {
      setLoading(false)
    }
  }

  const removeEmployee = async (id) => {
    setMsg(null)
    try {
      const res = await fetch(`${apiBase}/users/api/users/${id}/`, { method: 'DELETE', headers: authHeaders(token) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || data.message || 'No se pudo eliminar')
      setMsg({ type: 'success', text: 'Empleado eliminado' })
      loadEmployees()
    } catch (e) {
      setMsg({ type: 'error', text: e.message })
    }
  }

  const startEdit = (emp) => {
    setMsg(null)
    setEditing(emp)
    setEditForm({ first_name: emp.first_name || '', last_name: emp.last_name || '', email: emp.email || '', department: emp.department || '', position: emp.position || '', password: '' })
  }

  const submitEdit = async (e) => {
    e.preventDefault()
    setMsg(null)
    try {
      const res = await fetch(`${apiBase}/users/api/users/${editing.id}/`, { method: 'PATCH', headers: authHeaders(token), body: JSON.stringify(editForm) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'No se pudo actualizar')
      setMsg({ type: 'success', text: 'Empleado actualizado' })
      setEditing(null)
      loadEmployees()
    } catch (e) {
      setMsg({ type: 'error', text: e.message })
    }
  }

  const saCreateUser = async (e) => {
    e.preventDefault()
    setSaMsg(null)
    setSaCreating(true)
    try {
      const body = { username: saUsername, password: saPassword, role: saRole, first_name: editForm.first_name || '', last_name: editForm.last_name || '', email: editForm.email || '', phone: editForm.phone || '', department: editForm.department || '', position: editForm.position || '' }
      if (saRole === 'employee') body.tenant_id = saTenantId || undefined
      const res = await fetch(`${apiBase}/users/api/users/`, { method: 'POST', headers: authHeaders(token), body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'No se pudo crear el usuario')
      setSaMsg({ type: 'success', text: `Usuario ${data.username} creado como ${saRole}.` })
      setSaUsername('')
      setSaPassword('')
      setSaRole('admin')
      setSaTenantId('')
      setEditForm({ first_name: '', last_name: '', email: '', department: '', position: '', password: '' })
    } catch (e) {
      setSaMsg({ type: 'error', text: e.message })
    } finally {
      setSaCreating(false)
    }
  }

  if (role !== 'admin' && role !== 'super_admin') {
    return null
  }

  const employeesOnly = employees.filter((e) => e.role === 'employee')
  const empCount = employeesOnly.length
  const withEmail = employeesOnly.filter((e) => !!e.email).length
  const withDept = employeesOnly.filter((e) => !!e.department).length
  const uniqueDept = new Set(employeesOnly.map((e) => e.department).filter(Boolean)).size

  return (
    <div className="space-y-4">
      {msg && (
        <div className={`p-3 rounded text-sm ${msg.type === 'success' ? 'bg-green-600/20 text-green-200 border border-green-500/40' : 'bg-red-600/20 text-red-200 border border-red-500/40'}`}>
          {msg.text}
        </div>
      )}
      {role === 'super_admin' && showSAForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-white/10 rounded p-4 w-full max-w-3xl">
            <div className="flex items-center justify-between mb-3">
              <div className="text-white font-medium">Crear Administrador o Empleado</div>
              <button onClick={() => setShowSAForm(false)} className="px-2 py-1 text-xs rounded bg-gray-600 hover:bg-gray-700 text-white">Cerrar</button>
            </div>
            {saMsg && (
              <div className={`mb-3 p-3 rounded text-sm ${saMsg.type === 'success' ? 'bg-green-600/20 text-green-200 border border-green-500/40' : 'bg-red-600/20 text-red-200 border border-red-500/40'}`}>{saMsg.text}</div>
            )}
            <form onSubmit={saCreateUser} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <input type="text" value={saUsername} onChange={(e) => setSaUsername(e.target.value)} required minLength={4} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Usuario" />
              <input type="password" value={saPassword} onChange={(e) => setSaPassword(e.target.value)} required className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Contraseña" />
              <select value={saRole} onChange={(e) => setSaRole(e.target.value)} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="admin">Administrador</option>
                <option value="employer">Empleador</option>
                <option value="employee">Empleado</option>
              </select>
              {saRole === 'employee' && (
                <select value={saTenantId} onChange={(e) => setSaTenantId(e.target.value)} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                  <option value="">Seleccione tenant (administrador)</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>{t.admin_username} ({t.id})</option>
                  ))}
                </select>
              )}
              <input type="text" name="first_name" value={editForm.first_name} onChange={handleEditChange} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="Nombre" />
              <input type="text" name="last_name" value={editForm.last_name} onChange={handleEditChange} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="Apellido" />
              <input type="email" name="email" value={editForm.email} onChange={handleEditChange} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="Correo electrónico" />
              <input type="text" name="phone" value={editForm.phone || ''} onChange={handleEditChange} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="Teléfono" />
              <input type="text" name="department" value={editForm.department} onChange={handleEditChange} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="Departamento" />
              <input type="text" name="position" value={editForm.position} onChange={handleEditChange} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="Cargo" />
              <div className="sm:col-span-2 md:col-span-3 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setShowSAForm(false)} className="px-3 py-2 rounded bg-gray-600 hover:bg-gray-700 text-white">Cancelar</button>
                <button type="submit" disabled={saCreating} className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition disabled:opacity-50">{saCreating ? 'Creando...' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {role === 'super_admin' && (
        <div className="flex items-center justify-end">
          <button onClick={() => setShowSAForm((v) => !v)} className="px-3 py-2 rounded bg-gray-600 hover:bg-gray-700 text-white">
            {showSAForm ? 'Ocultar formulario' : 'Mostrar formulario'}
          </button>
        </div>
      )}

      {(role === 'admin' || role === 'super_admin') && (
        <>
          <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4">
            <div className="text-white font-medium mb-3">Estadísticas</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard label="Empleados" value={empCount} icon="users" tone="cyan" />
              <StatCard label="Con correo" value={withEmail} icon="users" tone="blue" />
              <StatCard label="Con departamento" value={withDept} icon="categories" tone="violet" />
              <StatCard label="Departamentos" value={uniqueDept} icon="categories" tone="indigo" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-gray-900 via-gray-850 to-gray-900 border border-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white font-medium">{role === 'super_admin' ? 'Usuarios' : 'Empleados'}</div>
              <div className="flex items-center gap-2">
                <button onClick={loadEmployees} className="px-2 py-1 text-xs rounded bg-gray-600 hover:bg-gray-700 text-white">Recargar</button>
              </div>
            </div>
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-gradient-to-r from-gray-800 to-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-200">Usuario</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-200">Nombre</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-200">Correo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-200">Departamento</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-200">Cargo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-200">Rol</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-200">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800/40 divide-y divide-white/10">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-700/50 transition">
                      <td className="px-4 py-3 text-sm text-white">{emp.username}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{emp.first_name} {emp.last_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{emp.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{emp.department || ''}</td>
                      <td className="px-4 py-3 text-sm text-gray-300">{emp.position || ''}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border border-white/10 ${emp.role === 'employee' ? 'bg-blue-600/20 text-blue-300' : emp.role === 'admin' ? 'bg-indigo-600/20 text-indigo-300' : emp.role === 'super_admin' ? 'bg-emerald-600/20 text-emerald-300' : 'bg-violet-600/20 text-violet-300'}`}>{emp.role}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {emp.role === 'employee' ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => startEdit(emp)} className="px-2 py-1 text-xs rounded bg-indigo-600 hover:bg-indigo-700 text-white">Editar</button>
                            <button onClick={() => removeEmployee(emp.id)} className="px-2 py-1 text-xs rounded bg-red-600 hover:bg-red-700 text-white">Eliminar</button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-3 text-sm text-gray-300">No hay empleados registrados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-white/10 rounded p-4 w-full max-w-lg">
            <div className="text-white font-medium mb-3">Editar usuario: {editing.username}</div>
            <form onSubmit={submitEdit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {['first_name','last_name','email','department','position','password'].map((field) => (
                <div key={field} className="flex flex-col gap-1">
                  <span className="text-xs text-gray-300">{labels[field]}</span>
                  <input type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'} name={field} value={editForm[field]} onChange={handleEditChange} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder={labels[field]} />
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
            <form onSubmit={(e) => { createEmployee(e); if (!loading) setOpenCreate(false) }} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {['username','password','first_name','last_name','email','department','position'].map((field) => (
                <div key={field} className="flex flex-col gap-1">
                  <span className="text-xs text-gray-300">{labels[field]}</span>
                  <input type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'} name={field} value={form[field]} onChange={handleChange} required={field === 'username' || field === 'password'} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder={labels[field]} />
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
  )
}

export default UsersManager
