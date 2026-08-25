import { apiFetch } from '@/lib/fetch.js';
import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Shipment {
  id: string;
  trackingNumber: string;
  status: string;
  mode: string;
  weightTotal?: string;
  volumeTotal?: string;
  originId: string;
  destinationId: string;
  customerId: string;
}

export default function EditShipmentModal({
  shipment,
  onClose,
  onSuccess
}: {
  shipment: Shipment;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    mode: shipment.mode,
    weightTotal: shipment.weightTotal || '',
    volumeTotal: shipment.volumeTotal || '',
    status: shipment.status,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiFetch(`/api/shipments/${shipment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(form)
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">{t('editShipment.title', 'Edit Shipment')}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{t('editShipment.status', 'Status')}</label>
            <select 
              value={form.status}
              onChange={(e) => updateForm('status', e.target.value)}
              className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="DRAFT">{t('shipment.status.draft', 'Draft')}</option>
              <option value="PENDING">{t('shipment.status.pending', 'Pending')}</option>
              <option value="IN_TRANSIT">{t('shipment.status.in_transit', 'In Transit')}</option>
              <option value="CUSTOMS_CLEARANCE">{t('shipment.status.customs_clearance', 'Customs Clearance')}</option>
              <option value="OUT_FOR_DELIVERY">{t('shipment.status.out_for_delivery', 'Out for Delivery')}</option>
              <option value="DELIVERED">{t('shipment.status.delivered', 'Delivered')}</option>
              <option value="CANCELLED">{t('shipment.status.cancelled', 'Cancelled')}</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">{t('editShipment.transport_mode', 'Transportation Mode')}</label>
            <select 
              value={form.mode}
              onChange={(e) => updateForm('mode', e.target.value)}
              className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="SEA">{t('shipment.mode.sea', 'Sea Freight')}</option>
              <option value="AIR">{t('shipment.mode.air', 'Air Freight')}</option>
              <option value="LAND">{t('shipment.mode.land', 'Land Transport')}</option>
              <option value="RAIL">{t('shipment.mode.rail', 'Rail Transport')}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{t('editShipment.weight', 'Weight')}</label>
              <input 
                type="text"
                value={form.weightTotal}
                onChange={(e) => updateForm('weightTotal', e.target.value)}
                placeholder={t('editShipment.placeholder_weight', 'e.g. 1000 kg')}
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{t('editShipment.volume', 'Volume')}</label>
              <input 
                type="text"
                value={form.volumeTotal}
                onChange={(e) => updateForm('volumeTotal', e.target.value)}
                placeholder={t('editShipment.placeholder_volume', 'e.g. 10 CBM')}
                className="block w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? t('editShipment.saving', 'Saving...') : t('editShipment.save', 'Save Changes')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
