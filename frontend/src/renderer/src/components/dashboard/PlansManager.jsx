import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../config/api.config';
import { Check, X, Edit, Save } from 'lucide-react';

const PlansManager = ({ token }) => {
  const [plans, setPlans] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  
  const apiBase = API_BASE_URL;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
      const [pRes, tRes] = await Promise.all([
        fetch(`${apiBase}/users/api/subscriptions/plans/`, { headers }),
        fetch(`${apiBase}/users/api/subscriptions/tenants/`, { headers })
      ]);
      
      if (pRes.ok) {
        const pData = await pRes.json();
        setPlans(Array.isArray(pData) ? pData : (pData.results || []));
      }
      
      if (tRes.ok) {
        const tData = await tRes.json();
        setTenants(Array.isArray(tData) ? tData : (tData.results || []));
      }
    } catch (e) {
      setError('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleAssign = async (adminId, planId) => {
    if (!confirm('¿Estás seguro de asignar este plan?')) return;
    setAssigning(true);
    try {
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
      const res = await fetch(`${apiBase}/users/api/subscriptions/plans/${planId}/assign/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ user_id: adminId })
      });
      if (res.ok) {
        await loadData();
      } else {
        alert('Error asignando plan');
      }
    } catch {
      alert('Error de conexión');
    } finally {
      setAssigning(false);
    }
  };

  const handleUpdatePlan = async (e) => {
    e.preventDefault();
    if (!editingPlan) return;
    
    try {
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
      const res = await fetch(`${apiBase}/users/api/subscriptions/plans/${editingPlan.id}/`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(editingPlan)
      });
      
      if (res.ok) {
        setEditingPlan(null);
        await loadData();
      } else {
        alert('Error actualizando el plan');
      }
    } catch {
      alert('Error de conexión');
    }
  };

  const handleEditChange = (field, value) => {
    setEditingPlan(prev => ({ ...prev, [field]: value }));
  };

  if (loading) return <div className="p-8 text-center text-white">Cargando planes...</div>;

  return (
    <div className="space-y-8 p-6 relative">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Planes de Suscripción</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700 flex flex-col relative group">
              <button 
                onClick={() => setEditingPlan(plan)}
                className="absolute top-4 right-4 p-2 bg-gray-700 rounded-full hover:bg-gray-600 text-gray-300 hover:text-white transition opacity-0 group-hover:opacity-100"
                title="Editar Plan"
              >
                <Edit size={16} />
              </button>
              
              <div className="flex justify-between items-start mb-4 pr-10">
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              </div>
              <span className="text-3xl font-bold text-green-400 mb-2">{formatCurrency(plan.price)}</span>
              <p className="text-gray-400 mb-6 flex-1 text-sm">{plan.description}</p>
              
              <div className="space-y-3 mb-6 text-sm text-gray-300 border-t border-gray-700 pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Usuarios:</span>
                  <span>{plan.max_users === -1 ? 'Ilimitados' : plan.max_users}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Productos:</span>
                  <span>{plan.max_products === -1 ? 'Ilimitados' : plan.max_products}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Categorías:</span>
                  <span>{plan.max_categories === -1 ? 'Ilimitadas' : plan.max_categories}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Transacciones:</span>
                  <span>{plan.max_transactions_per_month === -1 ? 'Ilimitadas' : plan.max_transactions_per_month}/mes</span>
                </div>
                
                <div className="pt-4 space-y-2">
                    {plan.enable_user_management ? 
                      <div className="flex items-center gap-2 text-green-400"><Check size={16}/> Gestión de Usuarios</div> : 
                      <div className="flex items-center gap-2 text-gray-600"><X size={16}/> Gestión de Usuarios</div>
                    }
                    {plan.enable_web_store ? 
                      <div className="flex items-center gap-2 text-green-400"><Check size={16}/> Tienda Virtual</div> : 
                      <div className="flex items-center gap-2 text-gray-600"><X size={16}/> Tienda Virtual</div>
                    }
                    {plan.enable_inventory_management ? 
                      <div className="flex items-center gap-2 text-green-400"><Check size={16}/> Inventario Avanzado</div> : 
                      <div className="flex items-center gap-2 text-gray-600"><X size={16}/> Inventario Avanzado</div>
                    }
                    {plan.enable_marketing_tools ? 
                      <div className="flex items-center gap-2 text-green-400"><Check size={16}/> Marketing</div> : 
                      <div className="flex items-center gap-2 text-gray-600"><X size={16}/> Marketing</div>
                    }
                    {plan.enable_advanced_sales_analysis ? 
                      <div className="flex items-center gap-2 text-green-400"><Check size={16}/> Análisis Avanzado</div> : 
                      <div className="flex items-center gap-2 text-gray-600"><X size={16}/> Análisis Avanzado</div>
                    }
                    {plan.enable_supplier_management ? 
                      <div className="flex items-center gap-2 text-green-400"><Check size={16}/> Gestión de Proveedores</div> : 
                      <div className="flex items-center gap-2 text-gray-600"><X size={16}/> Gestión de Proveedores</div>
                    }
                    {plan.enable_daily_backups ? 
                      <div className="flex items-center gap-2 text-green-400"><Check size={16}/> Copias de Seguridad</div> : 
                      <div className="flex items-center gap-2 text-gray-600"><X size={16}/> Copias de Seguridad</div>
                    }
                    {plan.enable_whatsapp_notifications ? 
                      <div className="flex items-center gap-2 text-green-400"><Check size={16}/> Notif. WhatsApp</div> : 
                      <div className="flex items-center gap-2 text-gray-600"><X size={16}/> Notif. WhatsApp</div>
                    }
                    {plan.enable_electronic_invoicing ? 
                      <div className="flex items-center gap-2 text-green-400"><Check size={16}/> Facturación Electrónica</div> : 
                      <div className="flex items-center gap-2 text-gray-600"><X size={16}/> Facturación Electrónica</div>
                    }
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Asignación de Planes</h2>
        <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
          <table className="w-full text-left text-gray-300">
            <thead className="bg-gray-900 text-gray-400">
              <tr>
                <th className="p-4">Administrador</th>
                <th className="p-4">Email</th>
                <th className="p-4">Estadísticas</th>
                <th className="p-4">Plan Actual</th>
                <th className="p-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {tenants.map(tenant => (
                <tr key={tenant.id} className="hover:bg-gray-750">
                  <td className="p-4 font-medium text-white">{tenant.username}</td>
                  <td className="p-4">{tenant.email}</td>
                  <td className="p-4">
                  <div className="flex flex-col space-y-1 text-xs text-gray-400">
                    <div><span className="text-white font-medium">{tenant.clients_count || 0}</span> Clientes</div>
                    <div><span className="text-white font-medium">{tenant.sales_count || 0}</span> Ventas</div>
                    <div><span className="text-white font-medium">{tenant.products_count || 0}</span> Productos</div>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    !tenant.plan_name ? 'bg-gray-700 text-gray-400' :
                    tenant.plan_name.includes('Básico') ? 'bg-blue-900 text-blue-300' :
                    tenant.plan_name.includes('Medio') ? 'bg-purple-900 text-purple-300' :
                    'bg-green-900 text-green-300'
                  }`}>
                    {tenant.plan_name || 'Sin Plan'}
                  </span>
                </td>
                <td className="p-4">
                  <select 
                    className="bg-gray-700 border-none rounded text-sm text-white focus:ring-2 focus:ring-blue-500"
                    value={tenant.plan_id || ''}
                    onChange={(e) => handleAssign(tenant.admin_id, e.target.value)}
                    disabled={assigning}
                  >
                    <option value="">Seleccionar plan...</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </td>
              </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">No hay administradores registrados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900">
              <h3 className="text-xl font-bold text-white">Editar {editingPlan.name}</h3>
              <button onClick={() => setEditingPlan(null)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUpdatePlan} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Nombre</label>
                  <input 
                    type="text" 
                    value={editingPlan.name} 
                    onChange={(e) => handleEditChange('name', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Precio ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={editingPlan.price} 
                    onChange={(e) => handleEditChange('price', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Descripción</label>
                <textarea 
                  value={editingPlan.description} 
                  onChange={(e) => handleEditChange('description', e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Máx. Usuarios (-1 ilim.)</label>
                  <input 
                    type="number" 
                    value={editingPlan.max_users} 
                    onChange={(e) => handleEditChange('max_users', parseInt(e.target.value))}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Máx. Transacciones (-1 ilim.)</label>
                  <input 
                    type="number" 
                    value={editingPlan.max_transactions_per_month} 
                    onChange={(e) => handleEditChange('max_transactions_per_month', parseInt(e.target.value))}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Máx. Productos (-1 ilim.)</label>
                  <input 
                    type="number" 
                    value={editingPlan.max_products} 
                    onChange={(e) => handleEditChange('max_products', parseInt(e.target.value))}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Máx. Categorías (-1 ilim.)</label>
                  <input 
                    type="number" 
                    value={editingPlan.max_categories} 
                    onChange={(e) => handleEditChange('max_categories', parseInt(e.target.value))}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-700">
                <h4 className="font-medium text-white">Funcionalidades</h4>
                
                <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={editingPlan.enable_user_management} 
                    onChange={(e) => handleEditChange('enable_user_management', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                  />
                  <span className="text-gray-300">Habilitar Gestión de Usuarios</span>
                </label>
                
                <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={editingPlan.enable_web_store} 
                    onChange={(e) => handleEditChange('enable_web_store', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                  />
                  <span className="text-gray-300">Habilitar Tienda Virtual</span>
                </label>
                
                <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={editingPlan.enable_inventory_management} 
                    onChange={(e) => handleEditChange('enable_inventory_management', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                  />
                  <span className="text-gray-300">Habilitar Inventario Avanzado</span>
                </label>
                
                <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={editingPlan.enable_marketing_tools} 
                    onChange={(e) => handleEditChange('enable_marketing_tools', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                  />
                  <span className="text-gray-300">Habilitar Herramientas de Marketing</span>
                </label>
                
                <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={editingPlan.enable_advanced_sales_analysis} 
                    onChange={(e) => handleEditChange('enable_advanced_sales_analysis', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                  />
                  <span className="text-gray-300">Habilitar Análisis Avanzado</span>
                </label>

                <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={editingPlan.enable_supplier_management} 
                    onChange={(e) => handleEditChange('enable_supplier_management', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                  />
                  <span className="text-gray-300">Habilitar Gestión de Proveedores</span>
                </label>

                <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={editingPlan.enable_daily_backups} 
                    onChange={(e) => handleEditChange('enable_daily_backups', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                  />
                  <span className="text-gray-300">Habilitar Copias de Seguridad</span>
                </label>

                <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={editingPlan.enable_whatsapp_notifications} 
                    onChange={(e) => handleEditChange('enable_whatsapp_notifications', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                  />
                  <span className="text-gray-300">Habilitar Notificaciones WhatsApp</span>
                </label>

                <label className="flex items-center gap-3 p-2 rounded hover:bg-gray-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={editingPlan.enable_electronic_invoicing} 
                    onChange={(e) => handleEditChange('enable_electronic_invoicing', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-700"
                  />
                  <span className="text-gray-300">Habilitar Facturación Electrónica</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-2">
                <button 
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2"
                >
                  <Save size={18} /> Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlansManager;