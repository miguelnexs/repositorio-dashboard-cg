import React, { useEffect, useState } from 'react';

const CashboxPage = ({ token, apiBase }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [cashSession, setCashSession] = useState(null);
  const [cashHistory, setCashHistory] = useState([]);
  const [me, setMe] = useState({ username: '' });

  useEffect(() => {
    try {
      const s = localStorage.getItem('cashbox_session');
      const h = localStorage.getItem('cashbox_history');
      setCashSession(s ? JSON.parse(s) : null);
      setCashHistory(h ? JSON.parse(h) : []);
    } catch {}
  }, []);

  const loadMe = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${apiBase}/users/api/auth/me/`, { headers });
      const data = await res.json();
      if (res.ok) {
        setMe({ username: data.username || '' });
      }
    } catch {}
  };

  useEffect(() => {
    if (token) loadMe();
  }, [token]);

  const openCashbox = (initial_amount) => {
    const sess = { started_at: new Date().toISOString(), initial_amount: Number(initial_amount || 0), user: me.username || '' };
    setCashSession(sess);
    try { localStorage.setItem('cashbox_session', JSON.stringify(sess)); } catch {}
    setMsg({ type: 'success', text: 'Caja abierta correctamente' });
    setTimeout(() => setMsg(null), 3000);
  };

  const closeCashbox = async (counted_amount) => {
    if (!cashSession) return;
    setSaving(true);
    setMsg(null);
    try {
      const headersAuth = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${apiBase}/sales/list/?page_size=1000`, { headers: headersAuth });
      const data = await res.json();
      const list = Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : [];
      const start = new Date(cashSession.started_at);
      const end = new Date();
      
      const inRange = list.filter((o) => {
        const d = new Date(o.created_at);
        return d >= start && d <= end;
      });
      
      const salesAmount = inRange.reduce((acc, o) => acc + Number(o.total_amount || 0), 0);
      const expected = Number(cashSession.initial_amount || 0) + salesAmount;
      const counted = Number(counted_amount || 0);
      const diff = counted - expected;
      
      const entry = {
        started_at: cashSession.started_at,
        closed_at: end.toISOString(),
        initial_amount: cashSession.initial_amount,
        sales_amount: salesAmount,
        expected_amount: expected,
        counted_amount: counted,
        difference: diff,
        user: cashSession.user || (me.username || '')
      };
      
      const hist = [entry, ...cashHistory].slice(0, 100);
      setCashHistory(hist);
      try {
        localStorage.setItem('cashbox_history', JSON.stringify(hist));
        localStorage.removeItem('cashbox_session');
      } catch {}
      setCashSession(null);
      setMsg({ type: 'success', text: 'Caja cerrada correctamente' });
      setTimeout(() => setMsg(null), 3000);
    } catch (e) {
      setMsg({ type: 'error', text: 'No se pudo cerrar la caja. Intente nuevamente.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {msg && (
        <div className={`p-4 rounded-lg text-sm border ${msg.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
          {msg.text}
        </div>
      )}

      <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Gestión de Caja
        </h2>
        
        {!cashSession ? (
          <form onSubmit={(e) => { e.preventDefault(); const amt = e.currentTarget.initial.value; openCashbox(amt); e.currentTarget.reset(); }} className="max-w-md">
            <div className="space-y-4">
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-4">
                <p className="text-blue-200 text-sm">La caja se encuentra cerrada actualmente. Ingrese el monto inicial para comenzar el turno.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Fondo Inicial</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input 
                    name="initial" 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    className="w-full pl-7 pr-4 py-2.5 rounded-lg bg-gray-900/50 border border-gray-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                    required 
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={saving} 
                className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-medium shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {saving ? 'Abriendo...' : 'Abrir Caja'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); const amt = e.currentTarget.counted.value; closeCashbox(amt); e.currentTarget.reset(); }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Hora de Apertura</div>
                <div className="text-white font-mono">{new Date(cashSession.started_at).toLocaleString()}</div>
              </div>
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Usuario Responsable</div>
                <div className="text-white font-medium">{cashSession.user || me.username}</div>
              </div>
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Fondo Inicial</div>
                <div className="text-emerald-400 font-mono text-lg">{Number(cashSession.initial_amount || 0).toLocaleString('es-CO',{style:'currency',currency:'COP'})}</div>
              </div>
            </div>

            <div className="max-w-md space-y-4">
              <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4 mb-4">
                <p className="text-amber-200 text-sm">Para cerrar la caja, cuente el dinero físico y digite el total. El sistema calculará las diferencias automáticamente.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Efectivo en Caja (Contado)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input 
                    name="counted" 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    className="w-full pl-7 pr-4 py-2.5 rounded-lg bg-gray-900/50 border border-gray-700 text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all" 
                    required 
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={saving} 
                className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-medium shadow-lg shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {saving ? 'Cerrando...' : 'Cerrar Caja'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="bg-gray-800/50 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white mb-4">Historial de Cierres</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="bg-gray-900/50 text-gray-400 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Fecha Apertura</th>
                <th className="px-4 py-3">Fecha Cierre</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3 text-right">Inicial</th>
                <th className="px-4 py-3 text-right">Ventas</th>
                <th className="px-4 py-3 text-right">Esperado</th>
                <th className="px-4 py-3 text-right">Contado</th>
                <th className="px-4 py-3 rounded-tr-lg text-right">Diferencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {cashHistory.length === 0 ? (
                <tr>
                  <td colspan="8" className="px-4 py-8 text-center text-gray-500">
                    No hay registros en el historial
                  </td>
                </tr>
              ) : (
                cashHistory.map((h, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">{new Date(h.started_at).toLocaleString()}</td>
                    <td className="px-4 py-3">{new Date(h.closed_at).toLocaleString()}</td>
                    <td className="px-4 py-3">{h.user}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-400">{Number(h.initial_amount).toLocaleString('es-CO',{style:'currency',currency:'COP'})}</td>
                    <td className="px-4 py-3 text-right font-mono text-blue-400">{Number(h.sales_amount).toLocaleString('es-CO',{style:'currency',currency:'COP'})}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-300">{Number(h.expected_amount).toLocaleString('es-CO',{style:'currency',currency:'COP'})}</td>
                    <td className="px-4 py-3 text-right font-mono text-white">{Number(h.counted_amount).toLocaleString('es-CO',{style:'currency',currency:'COP'})}</td>
                    <td className={`px-4 py-3 text-right font-mono font-medium ${h.difference < 0 ? 'text-rose-400' : h.difference > 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
                      {Number(h.difference).toLocaleString('es-CO',{style:'currency',currency:'COP'})}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CashboxPage;
