import { apiFetch } from '@/lib/fetch.js';
import React, { useState } from 'react';
import { X, Loader2, MapPin, Package, Users, Truck, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const DUMMY_UUIDS = {
  customer: '00000000-0000-4000-8000-000000000001',
  origin: '00000000-0000-4000-8000-000000000002',
  destination: '00000000-0000-4000-8000-000000000003',
};

const ORIGINS = [
  { id: DUMMY_UUIDS.origin, name: 'Shenzhen Port', country: 'China' },
  { id: DUMMY_UUIDS.origin, name: 'Shanghai Port', country: 'China' },
  { id: DUMMY_UUIDS.origin, name: 'Guangzhou Port', country: 'China' },
];

const DESTINATIONS = [
  { id: DUMMY_UUIDS.destination, name: 'Phnom Penh', country: 'Cambodia' },
  { id: DUMMY_UUIDS.destination, name: 'Bavet Border', country: 'Cambodia' },
  { id: DUMMY_UUIDS.destination, name: 'Sihanoukville', country: 'Cambodia' },
];

const CUSTOMERS = [
  { id: DUMMY_UUIDS.customer, name: 'ABC Logistics Cambodia' },
  { id: DUMMY_UUIDS.customer, name: 'Mekong Trading Co.' },
  { id: DUMMY_UUIDS.customer, name: 'Khmer Import Export' },
];

export default function CreateShipmentModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    originId: ORIGINS[0].id,
    originName: ORIGINS[0].name,
    destinationId: DESTINATIONS[0].id,
    destinationName: DESTINATIONS[0].name,
    transitPort: 'Cat Lai Port, Vietnam',
    customerId: CUSTOMERS[0].id,
    mode: 'SEA',
    weightTotal: '',
    volumeTotal: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const memberships = JSON.parse(localStorage.getItem('memberships') || '[]');
      const companyId = memberships[0]?.companyId;

      const payload = {
        companyId,
        customerId: form.customerId,
        originId: form.originId,
        destinationId: form.destinationId,
        mode: form.mode,
        weightTotal: form.weightTotal || 'N/A',
        volumeTotal: form.volumeTotal || 'N/A'
      };

      const json = await apiFetch('/api/shipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{t('createShipment.title', 'Create Transit Shipment')}</h2>
            <p className="text-sm text-slate-500 mt-1">{t('createShipment.subtitle', 'Initiate a new China → Vietnam → Cambodia route.')}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 bg-slate-50 rounded-full">
            <X size={20} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-y-auto">
          <form id="create-shipment-form" onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 flex items-start gap-2">
                <span className="font-bold">Error:</span> {error}
              </div>
            )}

            {/* Routing Section */}
            <section>
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
                <MapPin size={16} className="text-blue-500" /> {t('createShipment.routing', 'Routing')}
              </h3>
              
              <div className="relative flex items-center justify-between gap-4 bg-slate-50 p-5 rounded-xl border border-slate-100">
                {/* Visual connection line */}
                <div className="absolute top-1/2 left-8 right-8 h-0.5 bg-slate-200 -translate-y-1/2" />
                
                <div className="relative z-10 flex-1 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                  <label className="block text-xs font-medium text-slate-500 mb-1">{t('createShipment.origin', 'Origin (China)')}</label>
                  <select 
                    value={form.originName}
                    onChange={(e) => updateForm('originName', e.target.value)}
                    className="w-full text-sm font-medium focus:outline-none bg-transparent"
                  >
                    {ORIGINS.map(o => <option key={o.name} value={o.name}>{o.name}</option>)}
                  </select>
                </div>
                
                <div className="relative z-10 shrink-0 bg-blue-100 text-blue-600 p-2 rounded-full border-4 border-slate-50">
                  <ArrowRight size={16} />
                </div>

                <div className="relative z-10 flex-1 bg-white p-3 rounded-lg border border-amber-200 shadow-sm">
                  <label className="block text-xs font-medium text-amber-600 mb-1">{t('createShipment.transit', 'Transit (Vietnam)')}</label>
                  <div className="text-sm font-medium text-slate-900">{form.transitPort}</div>
                </div>

                <div className="relative z-10 shrink-0 bg-blue-100 text-blue-600 p-2 rounded-full border-4 border-slate-50">
                  <ArrowRight size={16} />
                </div>

                <div className="relative z-10 flex-1 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                  <label className="block text-xs font-medium text-slate-500 mb-1">{t('createShipment.destination', 'Destination (Cambodia)')}</label>
                  <select 
                    value={form.destinationName}
                    onChange={(e) => updateForm('destinationName', e.target.value)}
                    className="w-full text-sm font-medium focus:outline-none bg-transparent"
                  >
                    {DESTINATIONS.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-2 gap-8">
              {/* Parties Section */}
              <section>
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
                  <Users size={16} className="text-purple-500" /> {t('createShipment.parties', 'Parties')}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('createShipment.customer', 'Customer (Bill To)')}</label>
                    <select 
                      value={form.customerId}
                      onChange={(e) => updateForm('customerId', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white shadow-sm"
                    >
                      {CUSTOMERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
              </section>

              {/* Cargo Section */}
              <section>
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
                  <Package size={16} className="text-emerald-500" /> {t('createShipment.cargo_transport', 'Cargo & Transport')}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('createShipment.transport_mode', 'Transport Mode')}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['SEA', 'LAND', 'AIR', 'RAIL'].map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => updateForm('mode', mode)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                            form.mode === mode 
                              ? 'border-blue-500 bg-blue-50 text-blue-700' 
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {mode === 'SEA' && <Truck size={14} className="inline mr-1.5" />}
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('createShipment.est_weight', 'Est. Weight')}</label>
                      <input 
                        type="text"
                        placeholder={t('createShipment.placeholder_weight', 'e.g. 15,000 kg')}
                        value={form.weightTotal}
                        onChange={(e) => updateForm('weightTotal', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('createShipment.est_volume', 'Est. Volume')}</label>
                      <input 
                        type="text"
                        placeholder={t('createShipment.placeholder_volume', 'e.g. 35 CBM')}
                        value={form.volumeTotal}
                        onChange={(e) => updateForm('volumeTotal', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex items-center justify-between">
          <p className="text-xs text-slate-500 italic">
            {t('createShipment.note', '* Tracking number and initial draft status will be automatically generated.')}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              form="create-shipment-form"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold shadow-md hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 transition-all flex items-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? t('createShipment.creating', 'Creating...') : t('createShipment.create', 'Create Shipment')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
