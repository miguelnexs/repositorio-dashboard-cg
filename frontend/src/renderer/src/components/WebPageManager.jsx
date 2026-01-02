import React, { useEffect, useMemo, useState } from 'react';

const WebPageManager = ({ token, apiBase, adminId, role, setView, setProductEditing }) => {
  const headers = (tkn, json = true) => ({ ...(json ? { 'Content-Type': 'application/json' } : {}), ...(tkn ? { Authorization: `Bearer ${tkn}` } : {}) });
  const [tab, setTab] = useState('productos');

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterActive, setFilterActive] = useState('');

  const [form, setForm] = useState({ name: '', description: '', price: '', category_id: '', stock: '', active: true, images: [] });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const [settings, setSettings] = useState({ primary_color: '#0ea5e9', secondary_color: '#1f2937', font_family: 'Inter, system-ui, sans-serif', currencies: 'COP', site_url: '', company_name: '', company_nit: '', company_phone: '', company_whatsapp: '', company_email: '', company_address: '', company_description: '' });
  const [policy, setPolicy] = useState({ shipping_text: '', returns_text: '' });
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [stats, setStats] = useState({ visits_total: 0, conversions_total: 0 });
  const [visible, setVisible] = useState({});
  const [visibleCats, setVisibleCats] = useState({});

  const mediaUrl = (p) => (p && p.startsWith('http')) ? p : `${apiBase}${p}`;

  const loadBasics = async () => {
    setLoading(true);
    try {
      const headersAuth = headers(token);
      const [catsRes, prodsRes, settingsRes, policyRes, payRes, statsRes, visRes, visCatsRes] = await Promise.all([
        fetch(`${apiBase}/products/categories/?page_size=100`, { headers: headersAuth }),
        fetch(`${apiBase}/products/`, { headers: headersAuth }),
        fetch(`${apiBase}/webconfig/settings/`, { headers: headersAuth }),
        fetch(`${apiBase}/webconfig/policy/`, { headers: headersAuth }),
        fetch(`${apiBase}/webconfig/payments/`, { headers: headersAuth }),
        fetch(`${apiBase}/webconfig/stats/`, { headers: headersAuth }),
        fetch(`${apiBase}/webconfig/visible-products/`, { headers: headersAuth }),
        fetch(`${apiBase}/webconfig/visible-categories/`, { headers: headersAuth }),
      ]);
      const cats = await catsRes.json();
      const prods = await prodsRes.json();
      const st = await settingsRes.json();
      const pol = await policyRes.json();
      const pays = await payRes.json();
      const stx = await statsRes.json();
      const vis = await visRes.json();
      const visCats = await visCatsRes.json();
      setCategories(cats.results || []);
      setProducts(Array.isArray(prods) ? prods : []);
      setSettings({ ...settings, ...st });
      setPolicy(pol);
      setPayments(Array.isArray(pays) ? pays : []);
      setStats(stx);
      const map = {};
      if (Array.isArray(vis)) { vis.forEach((v) => { if (v.active) map[v.product] = true; }); }
      setVisible(map);
      const mapCats = {};
      if (Array.isArray(visCats)) { visCats.forEach((v) => { if (v.active) mapCats[v.category] = true; }); }
      setVisibleCats(mapCats);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { if (token) loadBasics(); }, [token]);
  useEffect(() => {
    const t = setInterval(() => { if (tab === 'productos') loadBasics(); }, 7000);
    return () => clearInterval(t);
  }, [tab, token]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = query.trim().toLowerCase();
      const matchQ = !q || p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q);
      const matchCat = !filterCat || (p.category && String(p.category.id) === String(filterCat));
      const matchAct = !filterActive || String(!!p.active) === String(filterActive === '1');
      return matchQ && matchCat && matchAct;
    });
  }, [products, query, filterCat, filterActive]);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImages = (files) => {
    setForm((f) => ({ ...f, images: files }));
  };

  const createProduct = async (e) => {
    e && e.preventDefault();
    setView && setView('producto_form');
  };

  const removeProduct = async (p) => {
    if (!confirm('Eliminar producto?')) return;
    try {
      const res = await fetch(`${apiBase}/products/${p.id}/`, { method: 'DELETE', headers: headers(token) });
      if (!res.ok) throw new Error('No se pudo eliminar');
      loadBasics();
    } catch {}
  };

  const toggleVisible = async (p, value) => {
    setVisible((m) => ({ ...m, [p.id]: value }));
    try {
      await fetch(`${apiBase}/webconfig/visible-products/${p.id}/`, { method: 'PUT', headers: headers(token), body: JSON.stringify({ active: !!value }) });
    } catch {}
  };

  const toggleVisibleCat = async (c, value) => {
    setVisibleCats((m) => ({ ...m, [c.id]: value }));
    try {
      await fetch(`${apiBase}/webconfig/visible-categories/${c.id}/`, { method: 'PUT', headers: headers(token), body: JSON.stringify({ active: !!value }) });
    } catch {}
  };

  const updateSettings = async (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    try { await fetch(`${apiBase}/webconfig/settings/`, { method: 'PUT', headers: headers(token), body: JSON.stringify(next) }); } catch {}
  };

  const uploadLogo = async (file) => {
    const fd = new FormData();
    fd.append('logo', file);
    try {
      const res = await fetch(`${apiBase}/webconfig/settings/`, { method: 'PUT', headers: headers(token, false), body: fd });
      const data = await res.json();
      setSettings(data);
    } catch {}
  };

  const updatePolicy = async (patch) => {
    const next = { ...policy, ...patch };
    setPolicy(next);
    try { await fetch(`${apiBase}/webconfig/policy/`, { method: 'PUT', headers: headers(token), body: JSON.stringify(next) }); } catch {}
  };

  const addPaymentOf = async (provider) => {
    const names = { mercadopago: 'MercadoPago', paypal: 'PayPal', stripe: 'Stripe', whatsapp: 'WhatsApp', credit_card: 'Tarjeta crédito' };
    const defaultFee = provider === 'mercadopago' ? 3.5 : provider === 'paypal' ? 3.9 : provider === 'stripe' ? 2.9 : 0;
    const pm = { name: names[provider] || 'Pago', provider, fee_percent: defaultFee, active: true, currencies: settings.currencies, extra_config: {} };
    try { const res = await fetch(`${apiBase}/webconfig/payments/`, { method: 'POST', headers: headers(token), body: JSON.stringify(pm) }); const d = await res.json(); if (res.ok) setPayments((arr) => [...arr, d]); } catch {}
  };
  const updatePayment = async (pm, patch) => {
    const next = { ...pm, ...patch };
    setPayments((arr) => arr.map((x) => x.id === pm.id ? next : x));
    try { await fetch(`${apiBase}/webconfig/payments/${pm.id}/`, { method: 'PATCH', headers: headers(token), body: JSON.stringify(patch) }); } catch {}
  };
  const removePayment = async (pm) => {
    try { await fetch(`${apiBase}/webconfig/payments/${pm.id}/`, { method: 'DELETE', headers: headers(token) }); setPayments((arr) => arr.filter((x) => x.id !== pm.id)); } catch {}
  };

  

  return (
    <div className="space-y-4 relative">
      {loading && (
        <div className="absolute inset-0 z-50 bg-gray-900 flex items-center justify-center">
          <div className="bg-gray-800/80 border border-white/10 rounded-xl p-6 shadow-xl text-center">
            <div className="mx-auto w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <div className="mt-3 text-white font-medium">Cargando datos...</div>
            <div className="text-xs text-gray-300">Por favor espera</div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {['productos','categorias','pagos','config','portal','politicas','estadisticas'].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded ${tab===t?'bg-blue-600 text-white':'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'}`}>{t==='productos'?'Productos':t==='categorias'?'Categorías':t==='pagos'?'Pagos':t==='config'?'Configuración':t==='portal'?'Portal':t==='politicas'?'Políticas':'Estadísticas'}</button>
          ))}
        </div>
        {tab==='productos' && (
          <button onClick={createProduct} className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white">Crear nuevo</button>
        )}
      </div>

      {msg && (
        <div className={`p-3 rounded text-sm ${msg.type === 'success' ? 'bg-green-600/20 text-green-200 border border-green-500/40' : 'bg-red-600/20 text-red-200 border border-red-500/40'}`}>{msg.text}</div>
      )}
      <div className={`${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
      {tab === 'productos' && (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1 px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="Buscar por palabra clave" />
              <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600">
                <option value="">Todas las categorías</option>
                {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
              <select value={filterActive} onChange={(e) => setFilterActive(e.target.value)} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600">
                <option value="">Todos</option>
                <option value="1">Activos</option>
                <option value="0">Inactivos</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredProducts.map((p) => (
                <div key={p.id} className="bg-white/5 border border-white/10 rounded p-3 text-white">
                  <div className="aspect-video bg-gray-800 rounded mb-2 overflow-hidden">
                    {p.image ? (<img src={mediaUrl(p.image)} alt={p.name} className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Sin imagen</div>)}
                  </div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-gray-300">{p.category ? p.category.name : 'Sin categoría'} • {p.active ? 'Activo' : 'Inactivo'}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Stock: {Number(p.total_stock ?? p.inventory_qty ?? 0)}</div>
                  <label className="mt-1 inline-flex items-center gap-2 text-xs text-gray-300">
                    <input type="checkbox" checked={!!visible[p.id]} onChange={(e) => toggleVisible(p, e.target.checked)} /> Mostrar en página web
                  </label>
                  <div className="text-sm mt-1">{Number(p.price || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => { setProductEditing && setProductEditing(p); }} className="px-2 py-1 text-xs rounded bg-indigo-600 hover:bg-indigo-700">Editar</button>
                    <button onClick={() => removeProduct(p)} className="px-2 py-1 text-xs rounded bg-red-600 hover:bg-red-700">Eliminar</button>
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div className="text-gray-300 text-sm">No hay productos con los filtros seleccionados.</div>
              )}
            </div>
        </div>
      )}

      {tab === 'categorias' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1 px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="Buscar por categoría" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {(categories || []).filter((c) => !query || (c.name || c.nombre || '').toLowerCase().includes(query.toLowerCase())).map((c) => (
              <div key={c.id} className="bg-white/5 border border-white/10 rounded p-3 text-white flex items-center gap-3">
                <div className="w-16 h-16 rounded overflow-hidden bg-gray-800 flex items-center justify-center">
                  {c.image ? (<img src={mediaUrl(c.image)} alt={c.name || c.nombre} className="w-full h-full object-cover" />) : (<span className="text-gray-400 text-xs">Sin imagen</span>)}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{c.name || c.nombre}</div>
                  <div className="text-xs text-gray-300">ID {c.id}</div>
                  <label className="mt-1 inline-flex items-center gap-2 text-xs text-gray-300">
                    <input type="checkbox" checked={!!visibleCats[c.id]} onChange={(e) => toggleVisibleCat(c, e.target.checked)} /> Mostrar en página web
                  </label>
                </div>
              </div>
            ))}
            {(!categories || categories.length === 0) && (
              <div className="text-gray-300 text-sm">No hay categorías.</div>
            )}
          </div>
        </div>
      )}

      {tab === 'pagos' && (
        <div className="bg-white/5 border border-white/10 rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-white font-medium">Métodos de pago</div>
            <div className="flex items-center gap-2">
              <button onClick={() => addPaymentOf('mercadopago')} className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white">MercadoPago</button>
              <button onClick={() => addPaymentOf('paypal')} className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white">PayPal</button>
              <button onClick={() => addPaymentOf('stripe')} className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white">Stripe</button>
              <button onClick={() => addPaymentOf('credit_card')} className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white">Tarjeta</button>
              <button onClick={() => addPaymentOf('whatsapp')} className="px-2 py-1 text-xs rounded bg-green-600 hover:bg-green-700 text-white">WhatsApp</button>
            </div>
          </div>
          <ul className="space-y-3">
            {payments.map((pm) => (
              <li key={pm.id} className="bg-gray-700/50 border border-gray-600 rounded p-3 text-sm text-white">
                <div className="flex items-center gap-2">
                  <span className="flex-1">{pm.name} <span className="text-gray-300">({pm.provider})</span></span>
                  <label className="flex items-center gap-1 text-xs"><span>Activo</span><input type="checkbox" checked={!!pm.active} onChange={(e) => updatePayment(pm, { active: e.target.checked })} /></label>
                  <div className="flex items-center gap-1 text-xs"><span>Comisión</span><input type="number" step="0.1" value={pm.fee_percent} onChange={(e) => updatePayment(pm, { fee_percent: Number(e.target.value || 0) })} className="w-20 px-2 py-1 rounded bg-gray-800 border border-gray-600" />%</div>
                  <input value={pm.currencies} onChange={(e) => updatePayment(pm, { currencies: e.target.value })} className="w-32 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-xs" placeholder="Monedas (p.ej. COP,USD)" />
                  <button onClick={() => removePayment(pm)} className="px-2 py-1 text-xs rounded bg-red-600 hover:bg-red-700">Eliminar</button>
                </div>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {pm.provider === 'mercadopago' && (
                    <>
                      <input value={pm.extra_config?.access_token || ''} onChange={(e) => updatePayment(pm, { extra_config: { ...(pm.extra_config||{}), access_token: e.target.value } })} className="px-2 py-1 rounded bg-gray-800 border border-gray-600 text-xs" placeholder="Access Token" />
                      <input value={pm.extra_config?.public_key || ''} onChange={(e) => updatePayment(pm, { extra_config: { ...(pm.extra_config||{}), public_key: e.target.value } })} className="px-2 py-1 rounded bg-gray-800 border border-gray-600 text-xs" placeholder="Public Key" />
                    </>
                  )}
                  {pm.provider === 'paypal' && (
                    <>
                      <input value={pm.extra_config?.client_id || ''} onChange={(e) => updatePayment(pm, { extra_config: { ...(pm.extra_config||{}), client_id: e.target.value } })} className="px-2 py-1 rounded bg-gray-800 border border-gray-600 text-xs" placeholder="Client ID" />
                      <input value={pm.extra_config?.client_secret || ''} onChange={(e) => updatePayment(pm, { extra_config: { ...(pm.extra_config||{}), client_secret: e.target.value } })} className="px-2 py-1 rounded bg-gray-800 border border-gray-600 text-xs" placeholder="Client Secret" />
                    </>
                  )}
                  {pm.provider === 'stripe' && (
                    <input value={pm.extra_config?.api_key || ''} onChange={(e) => updatePayment(pm, { extra_config: { ...(pm.extra_config||{}), api_key: e.target.value } })} className="px-2 py-1 rounded bg-gray-800 border border-gray-600 text-xs" placeholder="API Key" />
                  )}
                  {pm.provider === 'whatsapp' && (
                    <>
                      <input value={pm.extra_config?.phone || ''} onChange={(e) => updatePayment(pm, { extra_config: { ...(pm.extra_config||{}), phone: e.target.value } })} className="px-2 py-1 rounded bg-gray-800 border border-gray-600 text-xs" placeholder="Teléfono WhatsApp" />
                      <input value={pm.extra_config?.template || ''} onChange={(e) => updatePayment(pm, { extra_config: { ...(pm.extra_config||{}), template: e.target.value } })} className="px-2 py-1 rounded bg-gray-800 border border-gray-600 text-xs" placeholder="Plantilla de mensaje" />
                    </>
                  )}
                </div>
              </li>
            ))}
            {payments.length === 0 && (<li className="text-gray-300 text-sm">No hay métodos configurados.</li>)}
          </ul>
        </div>
      )}

      {tab === 'config' && (
        <div className="bg-white/5 border border-white/10 rounded p-4">
          <div className="text-white font-medium mb-3">Configuración</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-300 mb-1">URL de la página</div>
              <input value={settings.site_url || ''} onChange={(e) => updateSettings({ site_url: e.target.value })} className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="https://mi-tienda.com" />
            </div>
            <div>
              <div className="text-xs text-gray-300 mb-1">Monedas aceptadas</div>
              <input value={settings.currencies} onChange={(e) => updateSettings({ currencies: e.target.value })} className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="COP,USD" />
            </div>
            <div>
              <div className="text-xs text-gray-300 mb-1">Nombre de la empresa</div>
              <input value={settings.company_name || ''} onChange={(e) => updateSettings({ company_name: e.target.value })} className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="CG by Caro Gonzalez" />
            </div>
            <div>
              <div className="text-xs text-gray-300 mb-1">NIT</div>
              <input value={settings.company_nit || ''} onChange={(e) => updateSettings({ company_nit: e.target.value })} className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="1088297299-0" />
            </div>
            <div>
              <div className="text-xs text-gray-300 mb-1">Teléfono</div>
              <input value={settings.company_phone || ''} onChange={(e) => updateSettings({ company_phone: e.target.value })} className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="314 7435305" />
            </div>
            <div>
              <div className="text-xs text-gray-300 mb-1">WhatsApp</div>
              <input value={settings.company_whatsapp || ''} onChange={(e) => updateSettings({ company_whatsapp: e.target.value })} className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="314 7435305" />
            </div>
            <div>
              <div className="text-xs text-gray-300 mb-1">Correo</div>
              <input type="email" value={settings.company_email || ''} onChange={(e) => updateSettings({ company_email: e.target.value })} className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="info@cgbycaro.com" />
            </div>
            <div className="md:col-span-2">
              <div className="text-xs text-gray-300 mb-1">Dirección</div>
              <input value={settings.company_address || ''} onChange={(e) => updateSettings({ company_address: e.target.value })} className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="Cra 7 # 15-57, Local 101, Pereira, Colombia" />
            </div>
            <div className="md:col-span-2">
              <div className="text-xs text-gray-300 mb-1">Descripción</div>
              <textarea value={settings.company_description || ''} onChange={(e) => updateSettings({ company_description: e.target.value })} className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" rows={4} placeholder="Breve descripción de la empresa" />
            </div>
            <div className="md:col-span-2">
              <div className="text-xs text-gray-300 mb-1">Logo</div>
              <input type="file" accept="image/*" onChange={(e) => e.target.files && e.target.files[0] && uploadLogo(e.target.files[0])} className="w-full text-sm text-gray-300" />
              {settings.logo && (<img src={mediaUrl(settings.logo)} alt="Logo" className="mt-2 h-12 object-contain" />)}
            </div>
          </div>
        </div>
      )}

      {tab === 'portal' && (
        <div className="space-y-3">
          <div className="bg-white/5 border border-white/10 rounded p-4">
            <div className="flex items-center justify-between">
              <div className="text-white font-medium">Portal público</div>
              {settings.site_url && (<a href={`${settings.site_url}${adminId ? (settings.site_url.includes('?') ? '&' : '?') + 'aid=' + adminId : ''}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 text-sm">Abrir sitio</a>)}
            </div>
            <div className="text-xs text-gray-300">Acceso sin inicio de sesión.</div>
          </div>
          <PortalContent token={token} apiBase={apiBase} adminId={adminId} />
        </div>
      )}

      

      {tab === 'politicas' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded p-4">
            <div className="text-white font-medium mb-2">Política de envío</div>
            <textarea value={policy.shipping_text} onChange={(e) => updatePolicy({ shipping_text: e.target.value })} rows={8} className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="Detalles de envío" />
          </div>
          <div className="bg-white/5 border border-white/10 rounded p-4">
            <div className="text-white font-medium mb-2">Política de devoluciones</div>
            <textarea value={policy.returns_text} onChange={(e) => updatePolicy({ returns_text: e.target.value })} rows={8} className="w-full px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="Detalles de devoluciones" />
          </div>
        </div>
      )}

      {tab === 'estadisticas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded p-4">
            <div className="text-xs text-gray-300">Visitas totales</div>
            <div className="text-2xl font-semibold text-white mt-1">{stats.visits_total}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded p-4">
            <div className="text-xs text-gray-300">Conversiones totales</div>
            <div className="text-2xl font-semibold text-white mt-1">{stats.conversions_total}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded p-4">
            <div className="text-xs text-gray-300">Ratio</div>
            <div className="text-2xl font-semibold text-white mt-1">{(stats.visits_total ? ((stats.conversions_total / stats.visits_total) * 100).toFixed(2) : '0.00')}%</div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default WebPageManager;
export const PortalContent = ({ token, apiBase, adminId }) => {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const headers = (tkn) => ({ 'Content-Type': 'application/json', ...(tkn ? { Authorization: `Bearer ${tkn}` } : {}) });
  const load = async () => {
    setStatus('loading'); setError(null);
    try {
      const qp = adminId ? `?aid=${adminId}` : '';
      const res = await fetch(`${apiBase}/webconfig/public/portal/${qp}`, { headers: headers(null) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail || 'Error');
      setData(d); setStatus('ok');
    } catch (e) { setError(e.message); setStatus('error'); }
  };
  useEffect(() => { load(); }, [token]);
  const mediaUrl = (p) => (p && p.startsWith('http')) ? p : `${apiBase}${p}`;
  if (status === 'loading') return (<div className="p-4 bg-white/5 border border-white/10 rounded text-sm text-gray-300">Cargando portal...</div>);
  if (status === 'error') return (<div className="p-4 bg-red-600/20 border border-red-500/40 rounded text-sm text-red-200">{error}</div>);
  if (!data) return null;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.isArray(data.products) && data.products.map((p) => (
            <div key={p.id} className="bg-white/5 border border-white/10 rounded p-3 text-white">
              <div className="aspect-video bg-gray-800 rounded mb-2 overflow-hidden">
                {p.image ? (<img src={mediaUrl(p.image)} alt={p.name} className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Sin imagen</div>)}
              </div>
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-gray-300">{p.category ? p.category.name : 'Sin categoría'} • {p.active ? 'Activo' : 'Inactivo'}</div>
              <div className="text-xs text-gray-400 mt-0.5">Stock: {Number(p.total_stock ?? p.inventory_qty ?? 0)}</div>
              <div className="text-sm mt-1">{Number(p.price || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</div>
            </div>
          ))}
          {(!data.products || data.products.length === 0) && (
            <div className="text-gray-300 text-sm">No hay productos visibles.</div>
          )}
        </div>
      </div>
      <div className="lg:col-span-1">
        <div className="bg-white/5 border border-white/10 rounded p-4">
          <div className="text-white font-medium mb-2">Políticas</div>
          <div className="text-xs text-gray-300">Envío</div>
          <div className="text-sm text-gray-200 whitespace-pre-wrap">{data.policy?.shipping_text || 'Sin configuración'}</div>
          <div className="mt-3 text-xs text-gray-300">Devoluciones</div>
          <div className="text-sm text-gray-200 whitespace-pre-wrap">{data.policy?.returns_text || 'Sin configuración'}</div>
        </div>
      </div>
    </div>
  );
};
