import { apiFetch } from '@/lib/fetch.js';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  Layers, 
  DollarSign, 
  FileText, 
  Package, 
  History, 
  AlertCircle, 
  CheckCircle2, 
  CheckCircle
} from 'lucide-react';
import ShipmentHeader from '../components/shipment/shipment_header.js';
import ShipmentRightPanel from '../components/shipment/shipment_right_panel.js';
import TransitMilestonesPanel from '../components/shipment/transit_milestones_panel.js';
import ShipmentCostReconciliation from '../components/shipment/shipment_cost_reconciliation.js';
import MilestoneAlertBanner from '../components/shipment/milestone_alert_banner.js';
import OverviewTab from '../components/shipment/tabs/overview_tab.js';
import DocumentsTab from '../components/shipment/tabs/documents_tab.js';
import ActivityTab from '../components/shipment/tabs/activity_tab.js';
import TasksTab from '../components/shipment/tabs/tasks_tab.js';
import IssuesTab from '../components/shipment/tabs/issues_tab.js';
import EditShipmentModal from '../components/edit_shipment_modal.js';
import { useTranslation } from 'react-i18next';
import { 
  loadMilestonesFromStorage, 
  loadShipmentCostsFromStorage,
  checkAllMilestonesCompleted,
  TransitMilestonesData
} from '../components/shipment/transit_types.js';

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
  { key: 'milestones', label: '5 Mốc Vận chuyển (*)', icon: Layers },
  { key: 'financial', label: 'Tài chính & Đối chiếu Kế toán', icon: DollarSign },
  { key: 'overview', label: 'Tổng quan Lô hàng', icon: Package },
  { key: 'documents', label: 'Chứng từ (Files)', icon: FileText },
  { key: 'tasks_issues', label: 'Nhiệm vụ & Sự cố', icon: AlertCircle },
  { key: 'activity', label: 'Nhật ký Hoạt động', icon: History },
];

export default function ShipmentDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('milestones');
  const [isEditing, setIsEditing] = useState(false);
  const [headerExtraElement, setHeaderExtraElement] = useState<HTMLElement | null>(null);

  // Local milestone & cost state for reactive banners
  const [milestones, setMilestones] = useState<TransitMilestonesData | null>(null);
  const [costs, setCosts] = useState<any[]>([]);
  const [completionModal, setCompletionModal] = useState(false);

  const token = localStorage.getItem('token') || '';

  useEffect(() => {
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
        if (data?.id) {
          const mData = loadMilestonesFromStorage(data.id, data);
          setMilestones(mData);
          setCosts(loadShipmentCostsFromStorage(data.id));
        }
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
        if (found?.id) {
          const mData = loadMilestonesFromStorage(found.id, found);
          setMilestones(mData);
          setCosts(loadShipmentCostsFromStorage(found.id));
        }
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
    setShipment({ ...shipment, status: newStatus });
    try {
      await apiFetch(`/api/shipments/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (e) {
      console.error('Failed to update status on server:', e);
    }
  };

  const handleAllMilestonesCompleted = () => {
    if (shipment?.status !== 'COMPLETED' && shipment?.status !== 'DELIVERED') {
      handleUpdateStatus('COMPLETED');
      setCompletionModal(true);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium">{t('shipmentDetail.loading', 'Đang tải thông tin lô hàng...')}</p>
      </div>
    </div>
  );

  if (error || !shipment) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-3">
        <AlertCircle size={32} className="text-red-500 mx-auto" />
        <p className="text-slate-700 text-sm font-semibold">{error ?? 'Không tìm thấy lô hàng.'}</p>
        <button
          onClick={() => navigate('/shipments')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
        >
          Quay lại danh sách lô hàng
        </button>
      </div>
    </div>
  );

  const isCompletedShipment = shipment.status === 'COMPLETED' || shipment.status === 'DELIVERED';

  return (
    <div className="flex flex-col absolute inset-0 bg-slate-50 overflow-hidden">
      
      {/* Teleport mini status to Global App Header */}
      {headerExtraElement && createPortal(
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={() => navigate('/shipments')}
            className="flex items-center justify-center w-8 h-8 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0 -ml-2"
            title="Quay lại Danh sách Lô hàng"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs text-blue-700">{shipment.trackingNumber}</span>
            {isCompletedShipment ? (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-300">
                ĐÃ HOÀN THÀNH
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-semibold rounded-full">
                ĐANG THỰC HIỆN
              </span>
            )}
          </div>
        </div>,
        headerExtraElement
      )}

      {/* Fixed Header Area */}
      <div className="shrink-0 flex flex-col z-20">
        <ShipmentHeader shipment={shipment} onEditClick={() => setIsEditing(true)} />
      </div>

      <div className="flex-1 flex flex-col gap-4 p-6 overflow-y-auto min-h-0 relative">
        
        {/* Milestone Alert Banner (DEM/DET Deadline & Risks) */}
        {milestones && (
          <div className="shrink-0">
            <MilestoneAlertBanner 
              milestones={milestones}
              costs={costs}
              onNavigateMilestone={() => setActiveTab('milestones')}
            />
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex gap-5 items-start">
          
          {/* Main area with Tabs */}
          <div className="flex-1 min-w-0 flex flex-col bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            
            {/* Tab Navigation Header */}
            <div className="flex border-b border-slate-200 overflow-x-auto sticky top-[-24px] z-30 bg-white/95 backdrop-blur-md shadow-xs px-2 hide-scrollbar">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
                      isActive
                        ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                        : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={15} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Body */}
            <div className="p-6">
              
              {/* TAB 1: 5 MỐC VẬN CHUYỂN */}
              {activeTab === 'milestones' && (
                <TransitMilestonesPanel 
                  shipment={shipment}
                  onMilestonesChange={(newM) => {
                    setMilestones(newM);
                    setCosts(loadShipmentCostsFromStorage(shipment.id));
                  }}
                  onAllCompleted={handleAllMilestonesCompleted}
                  onNavigateToFinancial={() => setActiveTab('financial')}
                />
              )}

              {/* TAB 2: TÀI CHÍNH & ĐỐI CHIẾU KẾ TOÁN */}
              {activeTab === 'financial' && (
                <ShipmentCostReconciliation shipmentId={shipment.id} />
              )}

              {/* TAB 3: TỔNG QUAN LÔ HÀNG */}
              {activeTab === 'overview' && (
                <OverviewTab shipment={shipment} />
              )}

              {/* TAB 4: CHỨNG TỪ */}
              {activeTab === 'documents' && (
                <DocumentsTab shipment={shipment} />
              )}

              {/* TAB 5: NHIỆM VỤ & SỰ CỐ */}
              {activeTab === 'tasks_issues' && (
                <div className="space-y-6">
                  <TasksTab shipment={shipment} token={token} />
                  <div className="border-t border-slate-200 pt-6">
                    <IssuesTab shipment={shipment} token={token} />
                  </div>
                </div>
              )}

              {/* TAB 6: NHẬT KÝ HOẠT ĐỘNG */}
              {activeTab === 'activity' && (
                <ActivityTab shipment={shipment} />
              )}

            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-80 shrink-0 hidden lg:block space-y-4">
            
            {/* Quick Status Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                <span>Trạng thái Vận hành</span>
                {isCompletedShipment ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
                )}
              </h4>
              
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Mã lô hàng:</span>
                  <span className="font-mono font-bold text-blue-700">{shipment.trackingNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Tiến độ mốc:</span>
                  <span className="font-bold text-slate-800">
                    {milestones ? (
                      checkAllMilestonesCompleted(milestones) ? '5/5 Mốc hoàn thành' : 'Đang xử lý'
                    ) : 'Chưa nhập'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Hạn DEM cảng:</span>
                  <span className="font-mono font-semibold text-red-600">{milestones?.m1?.demExpiryDate || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Hạn DET lưu vỏ:</span>
                  <span className="font-mono font-semibold text-purple-700">{milestones?.m3?.detExpiryDate || '—'}</span>
                </div>
              </div>

              {isCompletedShipment ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>Lô hàng đã hoàn thành đủ 5 mốc & đã được chuyển sang Tab Đã hoàn thành!</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAllMilestonesCompleted}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle size={14} />
                  <span>Xác nhận hoàn thành 5 mốc</span>
                </button>
              )}
            </div>

            <ShipmentRightPanel shipment={shipment} />
          </div>

        </div>
      </div>

      {/* Modal Chúc mừng hoàn thành 5 mốc */}
      {completionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center space-y-4 border border-slate-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Chúc mừng! Đã hoàn thành 5 mốc</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Lô hàng <strong className="font-mono text-blue-700">{shipment.trackingNumber}</strong> đã được điền đủ 100% các trường thông tin bắt buộc và tự động chuyển sang <strong>Tab 1: Các lô hàng đã hoàn thành</strong>.
              </p>
            </div>
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setCompletionModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Ở lại trang này
              </button>
              <button
                type="button"
                onClick={() => navigate('/shipments')}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Về danh sách lô hàng
              </button>
            </div>
          </div>
        </div>
      )}

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
