import { apiFetch } from '@/lib/fetch.js';
import { useState, useEffect } from 'react';
import { FileText, Upload, Search, FolderOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Document {
  id: string;
  name: string;
  documentType: string;
  fileUrl: string;
  createdAt: string;
}

interface Shipment { id: string }

const DOC_GROUPS: { label: string; types: string[] }[] = [
  { label: 'Commercial', types: ['INVOICE', 'PACKING_LIST', 'PURCHASE_ORDER'] },
  { label: 'Shipping', types: ['BILL_OF_LADING', 'BOOKING_CONFIRMATION', 'DELIVERY_ORDER'] },
  { label: 'Customs – Vietnam', types: ['CUSTOMS_DECLARATION', 'TRANSIT_PERMIT', 'TRANSIT_DECLARATION'] },
  { label: 'Cambodia', types: ['CAMBODIA_IMPORT', 'CAMBODIA_CUSTOMS'] },
  { label: 'Transport', types: ['TRUCKING_ORDER', 'POD'] },
  { label: 'Other', types: ['OTHER', 'PHOTOS', 'INSURANCE'] },
];

const DOC_STATUS_COLOR: Record<string, string> = {
  UPLOADED: 'bg-green-100 text-green-700',
  MISSING:  'bg-red-100 text-red-600',
  VERIFIED: 'bg-blue-100 text-blue-700',
  REJECTED: 'bg-red-100 text-red-700',
};

export default function DocumentsTab({ shipment }: { shipment: Shipment }) {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    apiFetch(`/api/shipments/${shipment.id}/documents`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((j) => setDocuments(j.data ?? []))
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  }, [shipment.id]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    setSubmitting(true);
    try {
      const _fetchRes = await apiFetch(`/api/shipments/${shipment.id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: fd.get('name'),
          documentType: fd.get('documentType'),
          fileUrl: 'https://dummyimage.com/600x400/eeeeee/333333.png&text=Mock+Document',
        }),
      });
       {
        const { data } = _fetchRes;
        setDocuments((d) => [...d, data]);
        setShowForm(false);
        (e.target as HTMLFormElement).reset();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = documents.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.documentType.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-slate-400">{t('shipment.documents.loading', 'Loading documents...')}</div>;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('shipment.documents.search', 'Search documents...')}
            className="w-full h-9 pl-9 pr-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Upload size={14} />
          {t('shipment.documents.uploadDoc', 'Upload Document')}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-700 mb-1">{t('shipment.documents.docName', 'Document Name')}</label>
            <input required name="name" placeholder={t('shipment.documents.docNamePlaceholder', 'e.g. Commercial Invoice')} className="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-700 mb-1">{t('shipment.documents.docType', 'Document Type')}</label>
            <select required name="documentType" className="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="INVOICE">Commercial Invoice</option>
              <option value="PACKING_LIST">Packing List</option>
              <option value="BILL_OF_LADING">Bill of Lading</option>
              <option value="CUSTOMS_DECLARATION">Customs Declaration</option>
              <option value="TRANSIT_PERMIT">Transit Permit</option>
              <option value="TRANSIT_DECLARATION">Transit Declaration</option>
              <option value="TRUCKING_ORDER">Trucking Order</option>
              <option value="POD">POD</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <button type="submit" disabled={submitting} className="h-9 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            {submitting ? t('shipment.documents.uploading', 'Uploading...') : t('shipment.documents.upload', 'Upload')}
          </button>
          <button type="button" onClick={() => setShowForm(false)} className="h-9 px-3 text-slate-500 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">
            {t('shipment.documents.cancel', 'Cancel')}
          </button>
        </form>
      )}

      {/* Documents grouped */}
      {filtered.length === 0 && !showForm ? (
        <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
          <FolderOpen size={32} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-500">{t('shipment.documents.emptySearch', 'No documents found.')}</p>
          <button onClick={() => setShowForm(true)} className="mt-2 text-sm text-blue-600 hover:underline">{t('shipment.documents.uploadFirst', 'Upload the first document')}</button>
        </div>
      ) : (
        <div className="space-y-5">
          {DOC_GROUPS.map((group) => {
            const groupDocs = filtered.filter((d) => group.types.includes(d.documentType));
            return (
              <div key={group.label}>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{group.label}</h4>
                {groupDocs.length === 0 ? (
                  <div className="p-3 rounded-lg border border-dashed border-slate-200 text-xs text-slate-400">
                    {t('shipment.documents.noDocs', 'No {{group}} documents.', { group: group.label.toLowerCase() })}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {groupDocs.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all group bg-white flex items-start gap-2"
                      >
                        <div className="p-1.5 bg-blue-50 text-blue-600 rounded shrink-0">
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-900 group-hover:text-blue-600 truncate">{doc.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{doc.documentType.replace(/_/g, ' ')}</p>
                          <span className={`inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${DOC_STATUS_COLOR['UPLOADED']}`}>{t('shipment.documents.status.uploaded', 'UPLOADED')}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Ungrouped */}
          {(() => {
            const allKnownTypes = DOC_GROUPS.flatMap((g) => g.types);
            const ungrouped = filtered.filter((d) => !allKnownTypes.includes(d.documentType));
            if (ungrouped.length === 0) return null;
            return (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('shipment.documents.uncategorized', 'Uncategorized')}</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {ungrouped.map((doc) => (
                    <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noreferrer"
                      className="p-3 rounded-lg border border-slate-200 hover:border-blue-400 bg-white flex items-start gap-2 group"
                    >
                      <div className="p-1.5 bg-slate-50 text-slate-500 rounded shrink-0"><FileText size={16} /></div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-900 group-hover:text-blue-600 truncate">{doc.name}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{doc.documentType}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
