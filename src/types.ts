/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Book interface
export interface Book {
  id: string;
  series: string;       // السلسلة (e.g. الأضواء، سلاح التلميذ)
  subject: string;      // المادة (e.g. رياضيات، لغة عربية)
  stage: string;        // المرحلة (e.g. ابتدائي، إعدادي)
  grade: string;        // الصف (e.g. الصف الرابع، الصف الأول)
  term: string;         // الترم (e.g. الترم الأول، الترم الثاني)
  customerPrice: number; // سعر البيع للزبون
  branchPrice: number;   // سعر الفروع
  wholesalePrice: number; // سعر الجملة
  pdfPath: string;      // مسار ملف PDF المحلي
  printingStatus: 'idle' | 'printing' | 'completed'; // حالة الطباعة
  quantityPrinted: number; // الكمية المطبوعة الإجمالية
}

// Item inside a reservation
export interface ReservationItem {
  bookId: string;
  series: string;
  subject: string;
  grade: string;
  term: string;
  quantityRequested: number; // الكمية المطلوبة
  quantityDelivered: number; // الكمية المستلمة بالفعل
  pricePerUnit: number;      // السعر المعتمد (حسب نوع الزبون)
}

// Reservation status
export type ReservationStatus = 'pending' | 'partial' | 'completed' | 'cancelled';

// Reservation interface
export interface Reservation {
  id: string;
  invoiceNumber: string;    // رقم الفاتورة المميز (e.g. INV-1001)
  customerName: string;     // اسم العميل
  customerPhone: string;    // هاتف العميل
  customerType: 'regular' | 'branch' | 'wholesale'; // نوع العميل (مفرق، فرع، جملة)
  branchId: string;         // الفرع المرتبط (للفرع) أو الموزع
  employeeId: string;       // الموظف الذي أنشأ الحجز
  deliveryEmployeeId?: string; // الموظف الذي سلم الكتب
  items: ReservationItem[]; // الكتب المحجوزة
  totalAmount: number;      // المبلغ الإجمالي قبل الخصم
  discount: number;         // الخصم الممنوح
  netAmount: number;        // المبلغ الصافي بعد الخصم
  deposit: number;          // العربون / المدفوع مقدماً
  paidAmount: number;       // إجمالي المدفوع حتى الآن (بما فيه العربون)
  remainingBalance: number; // المبلغ المتبقي (الصافي - المدفوع)
  status: ReservationStatus;
  createdAt: string;        // تاريخ الحجز
  updatedAt: string;
}

// Production status of books
export interface ProductionTrack {
  bookId: string;
  series: string;
  subject: string;
  grade: string;
  term: string;
  requestedQty: number;   // إجمالي الكمية المطلوبة عبر كل الحجوزات النشطة
  printedQty: number;     // الكمية التي تم طباعتها بالفعل
  rejectedQty: number;    // عدد النسخ التالفة / المستبعدة
  readyQty: number;       // الكمية الجاهزة للتسليم
}

// Printer settings and queue
export type PrinterId = 'HP-1' | 'HP-2' | 'HP-3' | 'HP-4';

export interface Printer {
  id: PrinterId;
  name: string;
  status: 'idle' | 'printing' | 'offline';
  currentJobId?: string;
  progress?: number; // 0 to 100
}

export interface PrintJob {
  id: string;
  bookId: string;
  series: string;
  subject: string;
  grade: string;
  printerId: PrinterId;
  layout: 'portrait' | 'landscape';
  pagesPerSheet: '1-up' | '2-up' | '4-up';
  duplex: boolean;
  copies: number;
  status: 'pending' | 'printing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
}

// Branch details
export interface Branch {
  id: string;
  name: string;
  type: 'main' | 'sub' | 'wholesale';
  debt: number; // المديونية المستحقة على الفرع
}

// Employee details
export interface Employee {
  id: string;
  name: string;
  role: 'admin' | 'printer' | 'sales' | 'delivery';
  phone: string;
}

// Financial expense
export interface Expense {
  id: string;
  title: string;       // بند المصروف (e.g. ورق طباعة، صيانة طابعة، كهرباء)
  amount: number;      // القيمة
  employeeId: string;  // الموظف المسؤول
  date: string;        // التاريخ
}

// Initial/default configuration categories
export interface CategorySettings {
  series: string[];
  subjects: string[];
  stages: string[];
  grades: string[];
  terms: string[];
}
