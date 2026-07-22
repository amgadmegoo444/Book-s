import type { Book, Branch, Employee, Expense, PrintJob, Printer, Reservation } from './types';

export interface DatabaseState {
  books: Book[]; reservations: Reservation[]; branches: Branch[]; employees: Employee[];
  expenses: Expense[]; printers: Record<string, Printer>; printHistory: PrintJob[];
  activeEmployeeId: string;
  settings: { series: string[]; subjects: string[]; stages: string[]; grades: string[]; terms: string[] };
}

const storageKey = 'bookflow-pro-data-v1';

const initialState: DatabaseState = {
  books: [
    { id: 'book-1', series: 'المعاصر', subject: 'الرياضيات', stage: 'ابتدائي', grade: 'الصف السادس', term: 'الترم الأول', customerPrice: 120, branchPrice: 95, wholesalePrice: 85, pdfPath: 'C:\\BookFlow_PDFs\\math-6.pdf', printingStatus: 'completed', quantityPrinted: 500 }
  ],
  reservations: [],
  branches: [
    { id: 'br-main', name: 'الفرع الرئيسي', type: 'main', debt: 0 },
    { id: 'br-wholesale-hoda', name: 'الجملة - الهدى', type: 'wholesale', debt: 0 }
  ],
  employees: [{ id: 'emp-admin', name: 'مدير النظام', role: 'admin', phone: '01000000000' }],
  expenses: [],
  printers: {
    'HP-1': { id: 'HP-1', name: 'HP LaserJet 1', status: 'idle' },
    'HP-2': { id: 'HP-2', name: 'HP LaserJet 2', status: 'idle' },
    'Canon-1': { id: 'Canon-1', name: 'Canon Production', status: 'idle' },
    'Epson-1': { id: 'Epson-1', name: 'Epson Color', status: 'idle' }
  },
  printHistory: [], activeEmployeeId: 'emp-admin',
  settings: { series: ['المعاصر'], subjects: ['الرياضيات', 'اللغة العربية'], stages: ['ابتدائي', 'إعدادي', 'ثانوي'], grades: ['الصف السادس'], terms: ['الترم الأول', 'الترم الثاني'] }
};

export function loadDatabase(): DatabaseState {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) return { ...initialState, ...JSON.parse(raw) };
  } catch { /* use a clean database if old saved data is invalid */ }
  return initialState;
}

export function saveDatabase(state: DatabaseState): void {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

export function generateInvoiceNumber(reservations: Reservation[]): string {
  return `INV-${String(reservations.length + 1).padStart(5, '0')}`;
}
