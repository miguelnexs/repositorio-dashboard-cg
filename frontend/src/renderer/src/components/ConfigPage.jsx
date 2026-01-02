import React, { useEffect, useState } from 'react';

const ConfigPage = ({ token, apiBase }) => {
  const headers = (tkn, json = true) => ({ ...(json ? { 'Content-Type': 'application/json' } : {}), ...(tkn ? { Authorization: `Bearer ${tkn}` } : {}) });
  const [tab, setTab] = useState('datos');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [me, setMe] = useState({ username: '', first_name: '', last_name: '', email: '', phone: '', department: '', position: '' });
  const [settings, setSettings] = useState({ company_name: '', company_nit: '', company_phone: '', company_whatsapp: '', company_email: '', company_address: '', company_description: '', primary_color: '#0ea5e9', secondary_color: '#1f2937', logo: null });
  const [logoFile, setLogoFile] = useState(null);
  const [printerOpts, setPrinterOpts] = useState({
    show_logo: true,
    header1: '',
    header2: '',
    align: 'center',
    font_size: 11,
    margin_top: 10,
    margin_bottom: 10,
    show_qr: false,
    logo_mode: 'company',
    logo_url: '',
    logo_width_mm: 45,
  });
  const [cashSession, setCashSession] = useState(null);
  const [cashHistory, setCashHistory] = useState([]);

  useEffect(() => {
    try {
      const s = localStorage.getItem('cashbox_session');
      const h = localStorage.getItem('cashbox_history');
      setCashSession(s ? JSON.parse(s) : null);
      setCashHistory(h ? JSON.parse(h) : []);
    } catch {}
  }, []);

  const openCashbox = (initial_amount) => {
    const sess = { started_at: new Date().toISOString(), initial_amount: Number(initial_amount || 0), user: me.username || '' };
    setCashSession(sess);
    try { localStorage.setItem('cashbox_session', JSON.stringify(sess)); } catch {}
    setMsg({ type: 'success', text: 'Caja abierta' });
  };

  const closeCashbox = async (counted_amount) => {
    if (!cashSession) return;
    setSaving(true);
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
      const entry = { started_at: cashSession.started_at, closed_at: end.toISOString(), initial_amount: cashSession.initial_amount, sales_amount: salesAmount, expected_amount: expected, counted_amount: counted, difference: diff, user: cashSession.user || (me.username || '') };
      const hist = [entry, ...cashHistory].slice(0, 100);
      setCashHistory(hist);
      try {
        localStorage.setItem('cashbox_history', JSON.stringify(hist));
        localStorage.removeItem('cashbox_session');
      } catch {}
      setCashSession(null);
      setMsg({ type: 'success', text: 'Caja cerrada' });
    } catch (e) {
      setMsg({ type: 'error', text: 'No se pudo cerrar caja' });
    } finally {
      setSaving(false);
    }
  };

  const loadMe = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`${apiBase}/users/api/auth/me/`, { headers: headers(token) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'No se pudo cargar el perfil');
      setMe({
        username: data.username || '',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone: data.phone || '',
        department: data.department || '',
        position: data.position || '',
      });
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) loadMe(); }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMe((m) => ({ ...m, [name]: value }));
  };

  const saveMe = async (e) => {
    e && e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const payload = { first_name: me.first_name, last_name: me.last_name, email: me.email, phone: me.phone, department: me.department, position: me.position };
      const res = await fetch(`${apiBase}/users/api/auth/me/`, { method: 'PATCH', headers: headers(token), body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'No se pudo guardar');
      setMsg({ type: 'success', text: 'Datos personales actualizados' });
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setSaving(false);
    }
  };

  const absUrl = (path) => {
    try {
      if (!path) return '';
      if (typeof path === 'string' && (path.startsWith('http://') || path.startsWith('https://'))) return path;
      if (typeof path === 'string' && path.startsWith('/')) return `${apiBase}${path}`;
      return `${apiBase}/${path}`;
    } catch { return path; }
  };

  const loadSettings = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`${apiBase}/webconfig/settings/`, { headers: headers(token) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'No se pudieron cargar configuraciones');
      setSettings({
        company_name: data.company_name || '',
        company_nit: data.company_nit || '',
        company_phone: data.company_phone || '',
        company_whatsapp: data.company_whatsapp || '',
        company_email: data.company_email || '',
        company_address: data.company_address || '',
        company_description: data.company_description || '',
        primary_color: data.primary_color || '#0ea5e9',
        secondary_color: data.secondary_color || '#1f2937',
        logo: data.logo || null,
        printer_type: data.printer_type || 'system',
        printer_name: data.printer_name || '',
        paper_width_mm: data.paper_width_mm || 58,
        auto_print: !!data.auto_print,
        receipt_footer: data.receipt_footer || '',
      });
      try {
        const raw = data.receipt_footer || '';
        const obj = typeof raw === 'string' ? JSON.parse(raw) : null;
        if (obj && typeof obj === 'object') {
          setPrinterOpts({
            show_logo: obj.show_logo !== false,
            header1: obj.header1 || '',
            header2: obj.header2 || '',
            align: obj.align || 'center',
            font_size: Number(obj.font_size || 11),
            margin_top: Number((obj.margins && obj.margins.top) || obj.margin_top || 10),
            margin_bottom: Number((obj.margins && obj.margins.bottom) || obj.margin_bottom || 10),
            show_qr: !!obj.show_qr,
            logo_mode: obj.logo_mode || 'company',
            logo_url: obj.logo_url || '',
            logo_width_mm: Number(obj.logo_width_mm || 45),
          });
          setSettings((s) => ({ ...s, receipt_footer: obj.message || s.receipt_footer || '' }));
        } else {
          setPrinterOpts((p) => ({ ...p }));
        }
      } catch {
        setPrinterOpts((p) => ({ ...p }));
      }
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token && (tab === 'empresa' || tab === 'impresora')) loadSettings(); }, [token, tab]);

  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setSettings((s) => ({ ...s, [name]: value }));
  };

  const handleLogo = (e) => {
    const file = e.target.files && e.target.files[0];
    setLogoFile(file || null);
  };

  const saveSettings = async (e) => {
    e && e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      if (tab === 'impresora') {
        const payloadBase = {
          printer_type: settings.printer_type || 'system',
          printer_name: settings.printer_name || '',
          paper_width_mm: Number(settings.paper_width_mm || 58),
          auto_print: !!settings.auto_print,
        };
        const receiptPayload = {
          message: settings.receipt_footer || '',
          show_logo: !!printerOpts.show_logo,
          header1: printerOpts.header1 || '',
          header2: printerOpts.header2 || '',
          align: printerOpts.align || 'center',
          font_size: Number(printerOpts.font_size || 11),
          margins: { top: Number(printerOpts.margin_top || 10), bottom: Number(printerOpts.margin_bottom || 10) },
          show_qr: !!printerOpts.show_qr,
          logo_mode: printerOpts.logo_mode || 'company',
          logo_url: printerOpts.logo_url || '',
          logo_width_mm: Number(printerOpts.logo_width_mm || 45),
        };
        const payload = { ...payloadBase, receipt_footer: JSON.stringify(receiptPayload) };
        const res = await fetch(`${apiBase}/webconfig/settings/`, { method: 'PUT', headers: headers(token, true), body: JSON.stringify(payload) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'No se pudieron guardar cambios');
        setMsg({ type: 'success', text: 'Configuración de impresora guardada (JSON)' });
        setSettings((s) => ({
          ...s,
          printer_type: data.printer_type ?? s.printer_type,
          printer_name: data.printer_name ?? s.printer_name,
          paper_width_mm: data.paper_width_mm ?? s.paper_width_mm,
          auto_print: data.auto_print ?? s.auto_print,
          receipt_footer: (() => {
            try {
              const raw = data.receipt_footer;
              const obj = typeof raw === 'string' ? JSON.parse(raw) : null;
              return obj && obj.message ? obj.message : s.receipt_footer;
            } catch { return s.receipt_footer; }
          })(),
        }));
        setSaving(false);
        return;
      }
      const fd = new FormData();
      fd.append('company_name', settings.company_name || '');
      fd.append('company_nit', settings.company_nit || '');
      fd.append('company_phone', settings.company_phone || '');
      fd.append('company_whatsapp', settings.company_whatsapp || '');
      fd.append('company_email', settings.company_email || '');
      fd.append('company_address', settings.company_address || '');
      fd.append('company_description', settings.company_description || '');
      fd.append('primary_color', settings.primary_color || '');
      fd.append('secondary_color', settings.secondary_color || '');
      if (logoFile) fd.append('logo', logoFile);
      const res = await fetch(`${apiBase}/webconfig/settings/`, { method: 'PUT', headers: headers(token, false), body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'No se pudieron guardar cambios');
      setMsg({ type: 'success', text: 'Identidad de empresa guardada' });
      setLogoFile(null);
      setSettings((s) => ({
        ...s,
        logo: data.logo || s.logo,
        company_name: data.company_name || s.company_name,
        company_nit: data.company_nit || s.company_nit,
        company_phone: data.company_phone || s.company_phone,
        company_whatsapp: data.company_whatsapp || s.company_whatsapp,
        company_email: data.company_email || s.company_email,
        company_address: data.company_address || s.company_address,
        company_description: data.company_description || s.company_description,
        primary_color: data.primary_color || s.primary_color,
        secondary_color: data.secondary_color || s.secondary_color,
      }));
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setSaving(false);
    }
  };

  const previewPosSample = async () => {
    try {
      const w = window.open('', 'previewpos', 'width=400,height=800');
      const paperW = Number(settings.paper_width_mm || 58);
      const primary = settings.primary_color || '#000';
      const brand = (settings.company_name || '');
      const nit = (settings.company_nit || '');
      const addr = (settings.company_address || '');
      const phone = (settings.company_phone || '');
      const logo = settings.logo || '';
      const absUrl = (path) => { try { if (!path) return ''; if (String(path).startsWith('http://') || String(path).startsWith('https://')) return path; if (String(path).startsWith('/')) return `${apiBase}${path}`; return `${apiBase}/${path}`; } catch { return path; } };
      const logoSrc = printerOpts.logo_mode === 'custom' && printerOpts.logo_url ? printerOpts.logo_url : logo;
      const logoTag = printerOpts.show_logo && logoSrc ? `<div class="c"><img src="${logoSrc.startsWith('http') ? logoSrc : absUrl(logoSrc)}" style="width:${Number(printerOpts.logo_width_mm || 45)}mm;height:auto;object-fit:contain"/></div>` : '';
      const alignCls = printerOpts.align === 'left' ? 'l' : printerOpts.align === 'right' ? 'r' : 'c';
      const css = `*{box-sizing:border-box} body{font-family:Arial, sans-serif;margin:0;padding:${Number(printerOpts.margin_top || 10)}px 10px ${Number(printerOpts.margin_bottom || 10)}px;width:${paperW}mm} .c{text-align:center} .l{text-align:left} .r{text-align:right} .t{font-weight:600} .hr{height:1px;background:linear-gradient(90deg, ${primary}, transparent);margin:6px 0} .row{display:flex;justify-content:space-between;gap:6px} .tab{width:100%;border-collapse:collapse} .tab th,.tab td{padding:4px 0;font-size:${Number(printerOpts.font_size || 11)}px} .tab thead th{border-bottom:1px dashed #999;text-align:left} .tab tfoot td{border-top:1px dashed #999} .small{font-size:${Math.max(9, Number(printerOpts.font_size || 11) - 2)}px}`;
      const header = `
        ${logoTag}
        <div class="${alignCls}">
          <div class="t">${brand}</div>
          <div class="small">${nit}</div>
          <div class="small">${addr}</div>
          <div class="small">${phone}</div>
          ${printerOpts.header1 ? `<div class="small">${printerOpts.header1}</div>` : ''}
          ${printerOpts.header2 ? `<div class="small">${printerOpts.header2}</div>` : ''}
        </div>
        <div class="hr"></div>
        <div class="row small"><div>Orden: DEMO-0001</div><div>${new Date().toLocaleString()}</div></div>
        <div class="row small"><div>Cliente: Juan Pérez</div><div></div></div>
      `;
      const itemsHtml = [
        { name: 'Producto A', qty: 2, unit: 15000, line: 30000 },
        { name: 'Producto B', qty: 1, unit: 45000, line: 45000 },
      ].map((it) => `<tr><td>${it.name}</td><td class="c">${it.qty}</td><td class="r">${it.unit.toLocaleString('es-CO',{style:'currency',currency:'COP'})}</td><td class="r">${it.line.toLocaleString('es-CO',{style:'currency',currency:'COP'})}</td></tr>`).join('');
      const table = `
        <table class="tab">
          <thead><tr><th>Producto</th><th class="c">Cant</th><th class="r">Unit</th><th class="r">Total</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot><tr><td colspan="3" class="t">Total</td><td class="r t">${(75000).toLocaleString('es-CO',{style:'currency',currency:'COP'})}</td></tr></tfoot>
        </table>
      `;
      const qr = printerOpts.show_qr ? `<div class="c"><img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent('DEMO-0001')}" style="width:35mm;height:35mm;object-fit:contain"/></div>` : '';
      const footer = `<div class="hr"></div><div class="${alignCls} small">${settings.receipt_footer || ''}</div>${qr}`;
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>Recibo</title><style>${css}</style></head><body>${header}${table}${footer}</body></html>`;
      w.document.write(html);
      w.document.close();
      w.focus();
    } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {['datos','empresa','impresora','caja'].map((t) => {
            const label = t === 'datos' ? 'Datos personales' : t === 'impresora' ? 'Empresora' : t === 'empresa' ? 'Empresa' : 'Caja';
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded ${tab===t?'bg-blue-600 text-white':'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'}`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={tab==='datos'?loadMe:loadSettings} className="px-3 py-1.5 rounded bg-gray-600 hover:bg-gray-700 text-white" disabled={loading}>{loading?'Cargando...':'Recargar'}</button>
        </div>
      </div>
      {msg && (
        <div className={`p-3 rounded text-sm ${msg.type === 'success' ? 'bg-green-600/20 text-green-200 border border-green-500/40' : 'bg-red-600/20 text-red-200 border border-red-500/40'}`}>{msg.text}</div>
      )}
      {tab==='datos' && (
        <div className="bg-white/5 border border-white/10 rounded p-4">
          <div className="text-white font-medium mb-3">Datos personales</div>
          <form onSubmit={saveMe} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-300">Usuario</span>
              <input name="username" value={me.username} disabled className="px-3 py-2 rounded bg-gray-800 text-white border border-gray-700" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-300">Correo</span>
              <input name="email" value={me.email} onChange={handleChange} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-300">Nombre</span>
              <input name="first_name" value={me.first_name} onChange={handleChange} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-300">Apellido</span>
              <input name="last_name" value={me.last_name} onChange={handleChange} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-300">Teléfono</span>
              <input name="phone" value={me.phone || ''} onChange={handleChange} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-300">Departamento</span>
              <input name="department" value={me.department || ''} onChange={handleChange} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-300">Cargo</span>
              <input name="position" value={me.position || ''} onChange={handleChange} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" />
            </div>
            <div className="md:col-span-2 flex items-center justify-end gap-2 mt-2">
              <button type="submit" disabled={saving} className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50">{saving?'Guardando...':'Guardar cambios'}</button>
            </div>
          </form>
        </div>
      )}
      {tab==='empresa' && (
        <div className="bg-white/5 border border-white/10 rounded p-4">
          <div className="text-white font-medium mb-3">Identidad de la empresa</div>
          <form onSubmit={saveSettings} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-300">Nombre de la empresa</span>
              <input name="company_name" value={settings.company_name} onChange={handleSettingsChange} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="Mi Empresa" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-300">NIT</span>
              <input name="company_nit" value={settings.company_nit} onChange={handleSettingsChange} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="123456789-0" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-300">Teléfono</span>
              <input name="company_phone" value={settings.company_phone} onChange={handleSettingsChange} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="3001234567" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-300">WhatsApp</span>
              <input name="company_whatsapp" value={settings.company_whatsapp} onChange={handleSettingsChange} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="3001234567" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-300">Correo</span>
              <input type="email" name="company_email" value={settings.company_email} onChange={handleSettingsChange} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="correo@empresa.com" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-300">Dirección</span>
              <input name="company_address" value={settings.company_address} onChange={handleSettingsChange} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="Calle 123 #45-67" />
            </div>
            <div className="md:col-span-2 flex flex-col gap-1">
              <span className="text-xs text-gray-300">Descripción</span>
              <textarea name="company_description" value={settings.company_description} onChange={handleSettingsChange} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="Breve descripción de la empresa" rows={3} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-300">Color primario</span>
              <input type="color" name="primary_color" value={settings.primary_color} onChange={handleSettingsChange} className="w-16 h-10 p-1 rounded bg-gray-700 border border-gray-600" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-300">Color secundario</span>
              <input type="color" name="secondary_color" value={settings.secondary_color} onChange={handleSettingsChange} className="w-16 h-10 p-1 rounded bg-gray-700 border border-gray-600" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-300">Logo</span>
              <input type="file" accept="image/*" onChange={handleLogo} className="text-white" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded overflow-hidden bg-gray-800 flex items-center justify-center">
                {logoFile ? (
                  <img src={URL.createObjectURL(logoFile)} alt="Logo preview" className="w-full h-full object-cover" />
                ) : settings.logo ? (
                  <img src={absUrl(settings.logo)} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-xs">Sin imagen</span>
                )}
              </div>
            </div>
            <div className="md:col-span-2 flex items-center justify-end gap-2 mt-2">
              <button type="button" onClick={loadSettings} className="px-3 py-2 rounded bg-gray-600 hover:bg-gray-700 text-white">Cancelar</button>
              <button type="submit" disabled={saving} className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50">{saving?'Guardando...':'Guardar cambios'}</button>
            </div>
          </form>
        </div>
      )}
      {tab==='impresora' && (
        <div className="bg-white/5 border border-white/10 rounded p-4">
          <div className="text-white font-medium mb-3">Configuración de impresora</div>
          <form onSubmit={saveSettings} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-300">Tipo</span>
              <select name="printer_type" value={settings.printer_type || 'system'} onChange={handleSettingsChange} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600">
                <option value="system">Impresora del sistema</option>
                <option value="pos">Impresora POS</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-300">Nombre de impresora</span>
              <input name="printer_name" value={settings.printer_name || ''} onChange={handleSettingsChange} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="Nombre del dispositivo" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-300">Ancho papel (mm)</span>
              <input type="number" name="paper_width_mm" value={settings.paper_width_mm || 58} onChange={handleSettingsChange} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <label className="text-xs text-gray-300 inline-flex items-center gap-2">
                <input type="checkbox" name="auto_print" checked={!!settings.auto_print} onChange={(e) => setSettings((s) => ({ ...s, auto_print: e.target.checked }))} />
                Imprimir automáticamente al registrar venta
              </label>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-300 inline-flex items-center gap-2">
                <input type="checkbox" checked={!!printerOpts.show_logo} onChange={(e) => setPrinterOpts((p) => ({ ...p, show_logo: e.target.checked }))} />
                Mostrar logo en recibo
              </label>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-300">Fuente del logo</span>
              <select value={printerOpts.logo_mode} onChange={(e) => setPrinterOpts((p) => ({ ...p, logo_mode: e.target.value }))} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600">
                <option value="company">Logo de la empresa</option>
                <option value="custom">Logo personalizado (URL)</option>
              </select>
            </div>
            {printerOpts.logo_mode === 'custom' && (
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-300">URL del logo</span>
                <input value={printerOpts.logo_url} onChange={(e) => setPrinterOpts((p) => ({ ...p, logo_url: e.target.value }))} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="https://mi-sitio.com/logo.png" />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-300">Ancho del logo (mm)</span>
              <input type="number" value={printerOpts.logo_width_mm} onChange={(e) => setPrinterOpts((p) => ({ ...p, logo_width_mm: Number(e.target.value || 45) }))} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-300">Encabezado 1</span>
              <input value={printerOpts.header1} onChange={(e) => setPrinterOpts((p) => ({ ...p, header1: e.target.value }))} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="Texto adicional" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-300">Encabezado 2</span>
              <input value={printerOpts.header2} onChange={(e) => setPrinterOpts((p) => ({ ...p, header2: e.target.value }))} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" placeholder="Texto adicional" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-300">Alineación</span>
              <select value={printerOpts.align} onChange={(e) => setPrinterOpts((p) => ({ ...p, align: e.target.value }))} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600">
                <option value="left">Izquierda</option>
                <option value="center">Centro</option>
                <option value="right">Derecha</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-300">Tamaño de fuente (px)</span>
              <input type="number" value={printerOpts.font_size} onChange={(e) => setPrinterOpts((p) => ({ ...p, font_size: Number(e.target.value || 11) }))} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-300">Margen superior (px)</span>
              <input type="number" value={printerOpts.margin_top} onChange={(e) => setPrinterOpts((p) => ({ ...p, margin_top: Number(e.target.value || 10) }))} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-300">Margen inferior (px)</span>
              <input type="number" value={printerOpts.margin_bottom} onChange={(e) => setPrinterOpts((p) => ({ ...p, margin_bottom: Number(e.target.value || 10) }))} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-300 inline-flex items-center gap-2">
                <input type="checkbox" checked={!!printerOpts.show_qr} onChange={(e) => setPrinterOpts((p) => ({ ...p, show_qr: e.target.checked }))} />
                Mostrar QR
              </label>
            </div>
            <div className="md:col-span-2 flex flex-col gap-1">
              <span className="text-xs text-gray-300">Pie de recibo</span>
              <textarea name="receipt_footer" value={settings.receipt_footer || ''} onChange={handleSettingsChange} className="px-3 py-2 rounded bg-gray-700 text-white border border-gray-600" rows={3} placeholder="Gracias por su compra..." />
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <button type="button" onClick={previewPosSample} className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white">Vista previa de ejemplo POS</button>
            </div>
            <div className="md:col-span-2 flex items-center justify-end gap-2 mt-2">
              <button type="button" onClick={loadSettings} className="px-3 py-2 rounded bg-gray-600 hover:bg-gray-700 text-white">Cancelar</button>
              <button type="submit" disabled={saving} className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50">{saving?'Guardando...':'Guardar cambios'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ConfigPage;
