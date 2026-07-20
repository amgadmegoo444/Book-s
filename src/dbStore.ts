/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Book, Reservation, Printer, PrinterId, PrintJob, Branch, Employee, Expense, CategorySettings } from './types';

export interface DatabaseState {
  books: Book[];
  reservations: Reservation[];
  printers: Record<PrinterId, Printer>;
  printHistory: PrintJob[];
  branches: Branch[];
  employees: Employee[];
  expenses: Expense[];
  settings: CategorySettings;
  activeEmployeeId: string; // الموظف النشط الحالي في الجلسة (للمحاكاة)
}

const INITIAL_SETTINGS: CategorySettings = {
  series: ['الأضواء', 'سلاح التلميذ', 'المعاصر', 'البيت بيتك', 'القمة', 'سندباد'],
  subjects: ['رياضيات', 'لغة عربية', 'دراسات اجتماعية', 'علوم', 'اللغة الإنجليزية', 'تربية دينية', 'تكنولوجيا المعلومات'],
  stages: ['ابتدائي', 'إعدادي', 'ثانوي'],
  grades: ['الصف الأول', 'الصف الثاني', 'الصف الثالث', 'الصف الرابع', 'الصف الخامس', 'الصف السادس'],
  terms: ['الترم الأول', 'الترم الثاني', 'عام كامل']
};

const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'emp-1', name: 'أحمد عبد الرحمن', role: 'admin', phone: '01012345678' },
  { id: 'emp-2', name: 'محمد عادل', role: 'printer', phone: '01122334455' },
  { id: 'emp-3', name: 'سارة أحمد', role: 'sales', phone: '01234567890' },
  { id: 'emp-4', name: 'خالد محمود', role: 'delivery', phone: '01555667788' }
];

const INITIAL_BRANCHES: Branch[] = [
  { id: 'br-main', name: 'فرع التموين (الرئيسي)', type: 'main', debt: 0 },
  { id: 'br-osman', name: 'فرع عثمان', type: 'sub', debt: 4500 },
  { id: 'br-mosalla', name: 'فرع المسلة', type: 'sub', debt: 3200 },
  { id: 'br-ezzat1', name: 'فرع عزت', type: 'sub', debt: 1800 },
  { id: 'br-ezzat2', name: 'فرع عزت2 (فهد)', type: 'sub', debt: 5200 },
  { id: 'br-matareya', name: 'فرع المطرية', type: 'sub', debt: 2100 },
  { id: 'br-wholesale-hoda', name: 'هدى كامل (عميل جملة)', type: 'wholesale', debt: 12500 }
];

const INITIAL_BOOKS: Book[] = [
  {
    id: 'book-1',
    series: 'الأضواء',
    subject: 'رياضيات',
    stage: 'ابتدائي',
    grade: 'الصف الرابع',
    term: 'الترم الأول',
    customerPrice: 120,
    branchPrice: 95,
    wholesalePrice: 85,
    pdfPath: 'C:\\BookFlow_PDFs\\Adwaa_Math_G4_T1.pdf',
    printingStatus: 'completed',
    quantityPrinted: 450
  },
  {
    id: 'book-2',
    series: 'سلاح التلميذ',
    subject: 'لغة عربية',
    stage: 'ابتدائي',
    grade: 'الصف الرابع',
    term: 'الترم الأول',
    customerPrice: 135,
    branchPrice: 110,
    wholesalePrice: 100,
    pdfPath: 'C:\\BookFlow_PDFs\\Salah_Arabic_G4_T1.pdf',
    printingStatus: 'printing',
    quantityPrinted: 380
  },
  {
    id: 'book-3',
    series: 'المعاصر',
    subject: 'رياضيات',
    stage: 'ابتدائي',
    grade: 'الصف الخامس',
    term: 'الترم الأول',
    customerPrice: 150,
    branchPrice: 120,
    wholesalePrice: 110,
    pdfPath: 'C:\\BookFlow_PDFs\\Moaser_Math_G5_T1.pdf',
    printingStatus: 'idle',
    quantityPrinted: 200
  },
  {
    id: 'book-4',
    series: 'الأضواء',
    subject: 'دراسات اجتماعية',
    stage: 'ابتدائي',
    grade: 'الصف الخامس',
    term: 'الترم الثاني',
    customerPrice: 110,
    branchPrice: 85,
    wholesalePrice: 75,
    pdfPath: 'C:\\BookFlow_PDFs\\Adwaa_Social_G5_T2.pdf',
    printingStatus: 'completed',
    quantityPrinted: 150
  },
  {
    id: 'book-5',
    series: 'القمة',
    subject: 'علوم',
    stage: 'إعدادي',
    grade: 'الصف الأول',
    term: 'الترم الأول',
    customerPrice: 90,
    branchPrice: 70,
    wholesalePrice: 60,
    pdfPath: 'C:\\BookFlow_PDFs\\Qemma_Science_G7_T1.pdf',
    printingStatus: 'idle',
    quantityPrinted: 80
  },
  {
    id: 'book-6',
    series: 'المعاصر',
    subject: 'اللغة الإنجليزية',
    stage: 'ابتدائي',
    grade: 'الصف السادس',
    term: 'الترم الأول',
    customerPrice: 140,
    branchPrice: 115,
    wholesalePrice: 105,
    pdfPath: 'C:\\BookFlow_PDFs\\Moaser_English_G6_T1.pdf',
    printingStatus: 'completed',
    quantityPrinted: 500
  }
];

const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: 'res-1',
    invoiceNumber: 'BF-1001',
    customerName: 'مكتبة البستان (فرع عثمان)',
    customerPhone: '01009876543',
    customerType: 'branch',
    branchId: 'br-osman',
    employeeId: 'emp-3',
    deliveryEmployeeId: 'emp-4',
    createdAt: '2026-07-19T10:30:00Z',
    updatedAt: '2026-07-20T12:00:00Z',
    items: [
      {
        bookId: 'book-1',
        series: 'الأضواء',
        subject: 'رياضيات',
        grade: 'الصف الرابع',
        term: 'الترم الأول',
        quantityRequested: 50,
        quantityDelivered: 50,
        pricePerUnit: 95 // Branch price
      },
      {
        bookId: 'book-2',
        series: 'سلاح التلميذ',
        subject: 'لغة عربية',
        grade: 'الصف الرابع',
        term: 'الترم الأول',
        quantityRequested: 30,
        quantityDelivered: 20, // Partial delivery
        pricePerUnit: 110 // Branch price
      }
    ],
    totalAmount: 8050, // (50*95) + (30*110) = 4750 + 3300
    discount: 250,
    netAmount: 7800,
    deposit: 3000,
    paidAmount: 5000,
    remainingBalance: 2800,
    status: 'partial'
  },
  {
    id: 'res-2',
    invoiceNumber: 'BF-1002',
    customerName: 'هدى كامل (عميل جملة)',
    customerPhone: '01112223334',
    customerType: 'wholesale',
    branchId: 'br-wholesale-hoda',
    employeeId: 'emp-3',
    createdAt: '2026-07-20T08:15:00Z',
    updatedAt: '2026-07-20T08:15:00Z',
    items: [
      {
        bookId: 'book-1',
        series: 'الأضواء',
        subject: 'رياضيات',
        grade: 'الصف الرابع',
        term: 'الترم الأول',
        quantityRequested: 100,
        quantityDelivered: 0,
        pricePerUnit: 85 // Wholesale price
      },
      {
        bookId: 'book-6',
        series: 'المعاصر',
        subject: 'اللغة الإنجليزية',
        grade: 'الصف السادس',
        term: 'الترم الأول',
        quantityRequested: 80,
        quantityDelivered: 0,
        pricePerUnit: 105 // Wholesale price
      }
    ],
    totalAmount: 16900, // (100*85) + (80*105) = 8500 + 8400
    discount: 900,
    netAmount: 16000,
    deposit: 4000,
    paidAmount: 4000,
    remainingBalance: 12000,
    status: 'pending'
  },
  {
    id: 'res-3',
    invoiceNumber: 'BF-1003',
    customerName: 'الأستاذ عماد علي',
    customerPhone: '01224466880',
    customerType: 'regular',
    branchId: 'br-main',
    employeeId: 'emp-1',
    deliveryEmployeeId: 'emp-1',
    createdAt: '2026-07-18T14:20:00Z',
    updatedAt: '2026-07-19T11:45:00Z',
    items: [
      {
        bookId: 'book-4',
        series: 'الأضواء',
        subject: 'دراسات اجتماعية',
        grade: 'الصف الخامس',
        term: 'الترم الثاني',
        quantityRequested: 5,
        quantityDelivered: 5,
        pricePerUnit: 110 // Customer price
      }
    ],
    totalAmount: 550,
    discount: 50,
    netAmount: 500,
    deposit: 500,
    paidAmount: 500,
    remainingBalance: 0,
    status: 'completed'
  },
  {
    id: 'res-4',
    invoiceNumber: 'BF-1004',
    customerName: 'مكتبة الفجر (فرع المسلة)',
    customerPhone: '01551122334',
    customerType: 'branch',
    branchId: 'br-mosalla',
    employeeId: 'emp-3',
    createdAt: '2026-07-20T11:00:00Z',
    updatedAt: '2026-07-20T11:00:00Z',
    items: [
      {
        bookId: 'book-3',
        series: 'المعاصر',
        subject: 'رياضيات',
        grade: 'الصف الخامس',
        term: 'الترم الأول',
        quantityRequested: 40,
        quantityDelivered: 0,
        pricePerUnit: 120 // Branch price
      }
    ],
    totalAmount: 4800,
    discount: 0,
    netAmount: 4800,
    deposit: 1000,
    paidAmount: 1000,
    remainingBalance: 3800,
    status: 'pending'
  }
];

const INITIAL_EXPENSES: Expense[] = [
  { id: 'exp-1', title: 'شراء كرتون ورق طباعة A4 دبل إيه (5 كرتونة)', amount: 2400, employeeId: 'emp-1', date: '2026-07-18' },
  { id: 'exp-2', title: 'صيانة طابعة HP-2 وتغيير حبارة', amount: 850, employeeId: 'emp-2', date: '2026-07-19' },
  { id: 'exp-3', title: 'فاتورة كهرباء المطبعة', amount: 1200, employeeId: 'emp-1', date: '2026-07-20' },
  { id: 'exp-4', title: 'شراء سلك تغليف كتب حلزوني (100 قطعة)', amount: 450, employeeId: 'emp-2', date: '2026-07-20' }
];

const INITIAL_PRINTERS: Record<PrinterId, Printer> = {
  'HP-1': { id: 'HP-1', name: 'HP-1 (سريعة أسود/ملون)', status: 'idle' },
  'HP-2': { id: 'HP-2', name: 'HP-2 (إنتاجية ليزر)', status: 'idle' },
  'HP-3': { id: 'HP-3', name: 'HP-3 (مخصصة للغلاف)', status: 'idle' },
  'HP-4': { id: 'HP-4', name: 'HP-4 (ديوبلكس سريع)', status: 'idle' }
};

const INITIAL_PRINT_HISTORY: PrintJob[] = [
  {
    id: 'pj-1',
    bookId: 'book-1',
    series: 'الأضواء',
    subject: 'رياضيات',
    grade: 'الصف الرابع',
    printerId: 'HP-1',
    layout: 'portrait',
    pagesPerSheet: '1-up',
    duplex: true,
    copies: 100,
    status: 'completed',
    createdAt: '2026-07-19T09:00:00Z',
    completedAt: '2026-07-19T09:45:00Z'
  },
  {
    id: 'pj-2',
    bookId: 'book-2',
    series: 'سلاح التلميذ',
    subject: 'لغة عربية',
    grade: 'الصف الرابع',
    printerId: 'HP-2',
    layout: 'portrait',
    pagesPerSheet: '2-up',
    duplex: true,
    copies: 50,
    status: 'completed',
    createdAt: '2026-07-20T10:15:00Z',
    completedAt: '2026-07-20T10:55:00Z'
  },
  {
    id: 'pj-3',
    bookId: 'book-6',
    series: 'المعاصر',
    subject: 'اللغة الإنجليزية',
    grade: 'الصف السادس',
    printerId: 'HP-4',
    layout: 'portrait',
    pagesPerSheet: '1-up',
    duplex: true,
    copies: 150,
    status: 'completed',
    createdAt: '2026-07-20T11:30:00Z',
    completedAt: '2026-07-20T12:45:00Z'
  }
];

const LOCAL_STORAGE_KEY = 'bookflow_pro_db_v1';

export function loadDatabase(): DatabaseState {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Ensure all fields exist
      return {
        books: parsed.books || INITIAL_BOOKS,
        reservations: parsed.reservations || INITIAL_RESERVATIONS,
        printers: parsed.printers || INITIAL_PRINTERS,
        printHistory: parsed.printHistory || INITIAL_PRINT_HISTORY,
        branches: parsed.branches || INITIAL_BRANCHES,
        employees: parsed.employees || INITIAL_EMPLOYEES,
        expenses: parsed.expenses || INITIAL_EXPENSES,
        settings: parsed.settings || INITIAL_SETTINGS,
        activeEmployeeId: parsed.activeEmployeeId || 'emp-1'
      };
    }
  } catch (e) {
    console.error('Failed to load local storage database:', e);
  }

  // Fallback / First time load
  const state: DatabaseState = {
    books: INITIAL_BOOKS,
    reservations: INITIAL_RESERVATIONS,
    printers: INITIAL_PRINTERS,
    printHistory: INITIAL_PRINT_HISTORY,
    branches: INITIAL_BRANCHES,
    employees: INITIAL_EMPLOYEES,
    expenses: INITIAL_EXPENSES,
    settings: INITIAL_SETTINGS,
    activeEmployeeId: 'emp-1'
  };
  saveDatabase(state);
  return state;
}

export function saveDatabase(state: DatabaseState): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save to local storage database:', e);
  }
}

// Generate next invoice number
export function generateInvoiceNumber(reservations: Reservation[]): string {
  const maxNum = reservations.reduce((max, r) => {
    const match = r.invoiceNumber.match(/BF-(\d+)/);
    if (match) {
      const val = parseInt(match[1], 10);
      return val > max ? val : max;
    }
    return max;
  }, 1000);
  return `BF-${maxNum + 1}`;
}
