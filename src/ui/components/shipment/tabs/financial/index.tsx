import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Overview } from './subtabs/overview.js';
import { ThuTab } from './subtabs/thu_tab.js';
import { ChiTab } from './subtabs/chi_tab.js';
import { RequestTab } from './subtabs/request_tab.js';

interface Shipment {
  id: string;
  [key: string]: any;
}

interface FinancialTabProps {
  shipment: Shipment;
}

const TABS = [
  { id: 'overview', labelKey: 'financial.tabs.overview', defaultLabel: 'overview' },
  { id: 'thu', labelKey: 'financial.tabs.thu', defaultLabel: 'Thu' },
  { id: 'chi', labelKey: 'financial.tabs.chi', defaultLabel: 'Chi' },
  { id: 'request', labelKey: 'financial.tabs.request', defaultLabel: 'Request' },
];

export default function FinancialTab({ shipment }: FinancialTabProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview shipment={shipment} />;
      case 'thu':
        return <ThuTab shipment={shipment} />;
      case 'chi':
        return <ChiTab shipment={shipment} />;
      case 'request':
        return <RequestTab shipment={shipment} />;
      default:
        return <div>{t('financial.tabs.unknown', 'Unknown tab')}</div>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto hide-scrollbar" aria-label="Tabs">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                    ${isActive
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {t(tab.labelKey, tab.defaultLabel)}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
      
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
}
