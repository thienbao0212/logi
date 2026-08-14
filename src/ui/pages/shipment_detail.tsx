import { apiFetch } from '@/lib/fetch.js';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import ShipmentHeader from '../components/shipment/shipment_header.js';
import ShipmentJourney from '../components/shipment/shipment_journey.js';
import ShipmentKpis from '../components/shipment/shipment_kpis.js';
import ShipmentRightPanel from '../components/shipment/shipment_right_panel.js';
import OverviewTab from '../components/shipment/tabs/overview_tab.js';
import ContainersTab from '../components/shipment/tabs/containers_tab.js';
import CustomsTab from '../components/shipment/tabs/customs_tab.js';
import DocumentsTab from '../components/shipment/tabs/documents_tab.js';
import TasksTab from '../components/shipment/tabs/tasks_tab.js';
import IssuesTab from '../components/shipment/tabs/issues_tab.js';
import FinancialTab from '../components/shipment/tabs/financial/index.js';
import ActivityTab from '../components/shipment/tabs/activity_tab.js';
import EditShipmentModal from '../components/edit_shipment_modal.js';
import { useTranslation } from 'react-i18next';

interface Shipment {
  id: string;
  trackingNumber: string;
  status: string;
  mode: string;
  weightTotal?: string;
  volumeTotal?: string;
  customerId: string;
  originId: string;
  destinationId: string;
  estimatedDepartureDate?: string;
  estimatedArrivalDate?: string;
  actualDepartureDate?: string;
  actualArrivalDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

const TABS = [
  { key: 'overview',    label: 'overview' },
  { key: 'containers',  label: 'Containers' },
  { key: 'customs',     label: 'Customs' },
  { key: 'documents',   label: 'Documents' },
  { key: 'tasks',       label: 'Tasks' },
  { key: 'issues',      label: 'Issues' },
  { key: 'financial',   label: 'Financial' },
  { key: 'activity',    label: 'Activity' },
];

export default function ShipmentDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [headerExtraElement, setHeaderExtraElement] = useState<HTMLElement | null>(null);

  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    // Find the portal target after mount
    const el = document.getElementById('app-header-extra');
    if (el) setHeaderExtraElement(el);
  }, []);

  const loadShipment = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await apiFetch(`/api/shipments/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) {
        const { data } = await r.json();
        setShipment(data);
      } else {
        const memberships = JSON.parse(localStorage.getItem('memberships') || '[]');
        const companyId = memberships[0]?.companyId;
        if (!companyId) throw new Error('No company');
        const json = await apiFetch(`/api/shipments?companyId=${companyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const found = (json.data ?? []).find((s: Shipment) => s.id === id);
        if (!found) throw new Error('Shipment not found');
        setShipment(found);
      }
    } catch (e: any) {
      setError(e.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadShipment();
  }, [id]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!shipment) return;
    // Optimistic update
    setShipment({ ...shipment, status: newStatus });
    try {
      await apiFetch(`/api/shipments/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">{t('shipmentDetail.loading', 'Loading shipment...')}</p>
      </div>
    </div>
  );

  if (error || !shipment) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <p className="text-slate-500 text-sm">{error ?? t('shipmentDetail.not_found', 'Shipment not found.')}</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col absolute inset-0 bg-slate-50 overflow-hidden">
      {/* Teleport mini KPIs to the Global App Header */}
      {headerExtraElement && createPortal(
        <div className="flex items-center gap-4 w-full">
          <button
            onClick={() => navigate('/shipments')}
            className="flex items-center justify-center w-8 h-8 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0 -ml-2"
            title="Back to Shipments"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <ShipmentKpis variant="mini" />
        </div>,
        headerExtraElement
      )}

      {/* Fixed Header Area */}
      <div className="shrink-0 flex flex-col z-20">
        <ShipmentHeader shipment={shipment} onEditClick={() => setIsEditing(true)} />
      </div>

      <div className="flex-1 flex flex-col gap-4 p-6 overflow-y-auto min-h-0 relative">
        {/* Journey timeline */}
        <div className="shrink-0">
          <ShipmentJourney shipment={shipment} onUpdateStatus={handleUpdateStatus} />
        </div>

        {/* Main content + right sidebar */}
        <div className="flex gap-4 items-start">
          {/* Main area with tabs */}
          <div className="flex-1 min-w-0 flex flex-col bg-white border border-slate-200 rounded-xl">
            {/* Tab navigation */}
            <div className="flex border-b border-slate-200 overflow-x-auto sticky top-[-24px] z-30 bg-white/90 backdrop-blur-md rounded-t-xl shadow-sm">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {t(`shipmentDetail.tabs.${tab.key}`, tab.label)}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-6">
              {activeTab === 'overview'   && <OverviewTab   shipment={shipment} />}
              {activeTab === 'containers' && <ContainersTab shipment={shipment} token={token} />}
              {activeTab === 'customs'    && <CustomsTab    shipment={shipment} token={token} />}
              {activeTab === 'documents'  && <DocumentsTab  shipment={shipment} />}
              {activeTab === 'tasks'      && <TasksTab      shipment={shipment} token={token} />}
              {activeTab === 'issues'     && <IssuesTab     shipment={shipment} token={token} />}
              {activeTab === 'financial'  && <FinancialTab  shipment={shipment} />}
              {activeTab === 'activity'   && <ActivityTab   shipment={shipment} />}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="w-72 shrink-0">
            <ShipmentRightPanel shipment={shipment} />
          </div>
        </div>
      </div>

      {isEditing && (
        <EditShipmentModal
          shipment={shipment}
          onClose={() => setIsEditing(false)}
          onSuccess={() => {
            setIsEditing(false);
            loadShipment();
          }}
        />
      )}
    </div>
  );
}
