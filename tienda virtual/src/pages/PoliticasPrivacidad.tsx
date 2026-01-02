
import React from 'react';
import { API_CONFIG } from '@/config/api';

const PoliticasPrivacidad = () => {
  const [policy, setPolicy] = React.useState<{ shipping_text?: string; returns_text?: string } | null>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_CONFIG.API_URL}/webconfig/public/policy/`, { headers: { 'Content-Type': 'application/json' } });
        const d = await res.json();
        setPolicy(d);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-neutral-900 tracking-wide mb-4">
            Políticas de Privacidad
          </h1>
          <div className="w-24 h-px bg-neutral-300 mx-auto"></div>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-sm max-w-4xl mx-auto">
          {loading ? (
            <div className="text-center text-neutral-500">Cargando políticas...</div>
          ) : (
            <div className="prose prose-neutral max-w-none">
              <h2 className="text-2xl font-light text-neutral-900 mb-6">Política de Envío</h2>
              <p className="text-neutral-600 mb-4 whitespace-pre-wrap">{policy?.shipping_text || 'Sin configuración'}</p>
              <h2 className="text-2xl font-light text-neutral-900 mb-6 mt-8">Política de Devoluciones</h2>
              <p className="text-neutral-600 mb-4 whitespace-pre-wrap">{policy?.returns_text || 'Sin configuración'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PoliticasPrivacidad;
