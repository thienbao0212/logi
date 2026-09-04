// VAT Invoice mock service — lưu localStorage để demo không cần backend

export type InvoiceType = 'OUT' | 'IN'; // Đầu ra (xuất cho khách) | Đầu vào (nhận từ NCC)
export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'CANCELLED';

export interface VATInvoice {
  id: string;
  invoiceNumber: string;
  type: InvoiceType;
  date: string; // YYYY-MM-DD
  partnerName: string;
  partnerTaxCode?: string;
  shipmentId?: string;
  trackingNumber?: string;
  subtotal: number;
  vatRate: number; // 8 hoặc 10
  vatAmount: number;
  total: number;
  status: InvoiceStatus;
  description?: string;
  createdAt: string;
}

const INVOICE_KEY = 'logiflow_vat_invoices';

export const InvoiceService = {
  getAll(): VATInvoice[] {
    try {
      return JSON.parse(localStorage.getItem(INVOICE_KEY) || '[]');
    } catch {
      return [];
    }
  },

  save(invoice: VATInvoice): void {
    const all = this.getAll();
    const idx = all.findIndex(i => i.id === invoice.id);
    if (idx >= 0) all[idx] = invoice;
    else all.unshift(invoice);
    localStorage.setItem(INVOICE_KEY, JSON.stringify(all));
  },

  delete(id: string): void {
    localStorage.setItem(INVOICE_KEY, JSON.stringify(this.getAll().filter(i => i.id !== id)));
  },

  getMonthlyVATSummary(month: string): { vatOut: number; vatIn: number; vatPayable: number } {
    const all = this.getAll().filter(i => i.date.startsWith(month) && i.status !== 'CANCELLED');
    const vatOut = all.filter(i => i.type === 'OUT').reduce((s, i) => s + i.vatAmount, 0);
    const vatIn = all.filter(i => i.type === 'IN').reduce((s, i) => s + i.vatAmount, 0);
    return { vatOut, vatIn, vatPayable: vatOut - vatIn };
  },

  nextInvoiceNumber(type: InvoiceType): string {
    const all = this.getAll().filter(i => i.type === type);
    const nums = all.map(i => parseInt(i.invoiceNumber.replace(/\D/g, '') || '0', 10));
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    return String(max + 1).padStart(7, '0');
  }
};

